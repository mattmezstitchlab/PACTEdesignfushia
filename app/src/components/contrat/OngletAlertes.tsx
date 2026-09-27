import { useMemo, useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, RefreshCw, Check, Plus, Eye, XCircle } from 'lucide-react';
import { api, logActionAuto, parentRef } from '../../lib/api';
import type { AlerteCalculee } from '../../lib/types';
import { moteurCoherence, santeGlobale, type DonneesCoherence, type EntiteSuivie } from '../../lib/coherence';
import { fmtDate } from '../../lib/format';
import { Btn, Empty, Prudence, useToast } from '../ui';
import type { Alerte } from '../../lib/types';

// Moteur de cohérence : analyse à la demande, alertes persistées,
// passage en actions, accusés de réception. Réutilisé tel quel par un
// contrat ou par un objet du moteur universel (donnees.entiteRacine).
export default function OngletAlertes({ contrat, donnees, alertes, onChange }: {
  contrat: EntiteSuivie;
  donnees: DonneesCoherence;
  alertes: Alerte[];
  onChange: () => void;
}) {
  const estObjet = donnees.entiteRacine === 'objet';
  const contratId = estObjet ? undefined : contrat.id;
  const objetId = estObjet ? contrat.id : undefined;
  const { toastEl, ok, err } = useToast();
  const [analyse, setAnalyse] = useState(false);
  const [calculees, setCalculees] = useState<AlerteCalculee[] | null>(null);

  const actives = useMemo(() => alertes.filter((a) => a.statut === 'active'), [alertes]);
  const traitees = useMemo(() => alertes.filter((a) => a.statut !== 'active'), [alertes]);

  const lancer = async () => {
    setAnalyse(true);
    try {
      const res = moteurCoherence(donnees);
      setCalculees(res);
      // Persister les nouvelles alertes (dédupliquées par code+entité)
      const cles = new Set(actives.map((a) => `${a.code}|${a.entite_type}|${a.entite_id}`));
      let ajoutees = 0;
      for (const r of res) {
        const k = `${r.code}|${r.entite_type}|${r.entite_id}`;
        if (cles.has(k)) continue;
        await api.alertes.create({
          ...parentRef(contratId, objetId), code: r.code, gravite: r.gravite,
          titre: r.titre, message: r.message, entite_type: r.entite_type,
          entite_id: r.entite_id, statut: 'active', action_suggeree: r.action_suggeree,
        });
        cles.add(k);
        ajoutees++;
      }
      // Résoudre automatiquement celles qui ont disparu
      const clesRes = new Set(res.map((r) => `${r.code}|${r.entite_type}|${r.entite_id}`));
      for (const a of actives) {
        const k = `${a.code}|${a.entite_type}|${a.entite_id}`;
        if (!clesRes.has(k) && a.code !== 'IMPORT_VIGILANCE') {
          await api.alertes.update(a.id, { statut: 'resolue' });
        }
      }
      // Santé globale
      const sante = santeGlobale(res);
      if (estObjet) await api.objets.update(contrat.id, { sante });
      else await api.contrats.update(contrat.id, { sante });
      await logActionAuto(contratId, objetId, 'coherence_analysee', estObjet ? 'objet' : 'contrat', contrat.id, { alertes: res.length, sante, nouvelles: ajoutees });
      onChange();
      ok(`Analyse terminée : ${res.length} signalement(s), ${ajoutees} nouveau(x). Santé : ${sante === 'saine' ? 'saine' : sante === 'attention' ? 'à surveiller' : 'critique'}.`);
    } catch (e: any) {
      err(e.message || 'Analyse impossible');
    } finally {
      setAnalyse(false);
    }
  };

  const statutAlerte = async (a: Alerte, statut: string) => {
    try {
      await api.alertes.update(a.id, { statut });
      await logActionAuto(contratId, objetId, 'alerte_statut', 'alerte', a.id, { de: a.statut, vers: statut });
      onChange();
    } catch (e: any) { err(e.message); }
  };

  const versAction = async (a: Alerte) => {
    try {
      const act = await api.actions.create({
        ...parentRef(contratId, objetId),
        titre: a.titre, description: `${a.message}\n\nPiste suggérée : ${a.action_suggeree || '—'}`,
        priorite: a.gravite === 'critique' ? 'haute' : 'normale',
        statut: 'a_faire', alerte_id: a.id,
      });
      await api.alertes.update(a.id, { statut: 'reconnue' });
      await logActionAuto(contratId, objetId, 'action_creee', 'action', act.id, { depuis_alerte: a.id });
      onChange();
      ok('Action créée depuis l’alerte.');
    } catch (e: any) { err(e.message); }
  };

  const aprecu = calculees || [];

  return (
    <div className="space-y-4">
      {toastEl}
      <Prudence compact />
      <div className="flex flex-wrap items-center justify-between gap-2 card p-4">
        <div>
          <p className="font-semibold text-ink">Moteur de cohérence</p>
          <p className="mt-0.5 text-sm text-muted">
            Croise ENGAGEMENTS ↔ CONDITIONS ↔ ÉCHÉANCES ↔ ÉVÉNEMENTS ↔ PREUVES.
            {actives.length > 0 ? ` ${actives.length} alerte(s) active(s).` : ' Aucune alerte active.'}
          </p>
        </div>
        <Btn onClick={lancer} disabled={analyse}>
          <RefreshCw className={`h-4 w-4 ${analyse ? 'animate-spin' : ''}`} /> {analyse ? 'Analyse…' : 'Lancer l’analyse'}
        </Btn>
      </div>

      {calculees && (
        <div className="rounded border border-fuchsia-200 bg-fuchsia-soft p-4 text-sm text-attention">
          <p className="font-semibold text-attention">Dernier passage : {calculees.length} signalement(s)</p>
          <p className="mt-1">
            {calculees.filter((a) => a.gravite === 'critique').length} critique(s) ·{' '}
            {calculees.filter((a) => a.gravite === 'attention').length} à surveiller ·{' '}
            {calculees.filter((a) => a.gravite === 'info').length} information(s).
            Les signalements sont des faits à vérifier, jamais des conclusions juridiques.
          </p>
          {aprecu.length === 0 && <p className="mt-1">Aucune incohérence détectée sur les données actuelles — le moteur reste vigilant à chaque ajout.</p>}
        </div>
      )}

      {actives.length === 0 && !calculees ? (
        <Empty icon={<ShieldAlert className="h-8 w-8" />} titre="Aucune alerte" texte="Lancez l’analyse pour que le moteur croise toutes les données du contrat : échéances proches, retards potentiels, conditions manquantes, contradictions, signatures, preuves…" action={<Btn onClick={lancer} disabled={analyse}><RefreshCw className="h-4 w-4" /> Lancer l’analyse</Btn>} />
      ) : (
        <div className="space-y-2.5">
          {actives.map((a) => (
            <CarteAlerte key={a.id} gravite={a.gravite} titre={a.titre || ''} message={a.message || ''}
              meta={`Détectée le ${fmtDate(a.created_at)}${a.entite_type ? ` · ${a.entite_type}` : ''}`}
              piste={a.action_suggeree}
              actions={<>
                <button onClick={() => versAction(a)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-fuchsia hover:bg-fuchsia-100"><Plus className="h-3.5 w-3.5" /> Créer une action</button>
                <button onClick={() => statutAlerte(a, 'reconnue')} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-white"><Eye className="h-3.5 w-3.5" /> Reconnaître</button>
                <button onClick={() => statutAlerte(a, 'resolue')} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-success hover:bg-success-soft"><Check className="h-3.5 w-3.5" /> Résoudre</button>
                <button onClick={() => statutAlerte(a, 'ignoree')} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-faint hover:bg-white"><XCircle className="h-3.5 w-3.5" /> Ignorer</button>
              </>}
            />
          ))}
        </div>
      )}

      {traitees.length > 0 && (
        <details className="card p-4">
          <summary className="cursor-pointer text-sm font-medium text-muted">Alertes traitées ({traitees.length})</summary>
          <div className="mt-3 space-y-2">
            {traitees.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 rounded-sm bg-white px-3 py-2 text-sm opacity-70">
                <p className="truncate text-muted">{a.titre}</p>
                <span className="flex shrink-0 items-center gap-2 text-xs text-faint">
                  {a.statut === 'resolue' ? 'Résolue' : a.statut === 'reconnue' ? 'Reconnue' : 'Ignorée'}
                  <button onClick={() => statutAlerte(a, 'active')} className="cursor-pointer text-fuchsia hover:underline">Réactiver</button>
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export function CarteAlerte({ gravite, titre, message, meta, piste, actions }: {
  gravite: string | null | undefined; titre: string; message: string; meta?: string; piste?: string | null; actions?: React.ReactNode;
}) {
  const bord = gravite === 'critique' ? 'border-critique bg-critique-soft' : gravite === 'attention' ? 'border-fuchsia-200 bg-fuchsia/[0.05]' : 'border-fuchsia-200 bg-fuchsia/[0.05]';
  const Icon = gravite === 'critique' ? ShieldAlert : gravite === 'attention' ? AlertTriangle : Info;
  const col = gravite === 'critique' ? 'text-critique' : gravite === 'attention' ? 'text-fuchsia' : 'text-attention';
  return (
    <div className={`rounded border p-4 ${bord}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${col}`} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{titre}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{message}</p>
          {meta && <p className="mt-1.5 text-xs text-faint">{meta}</p>}
          {piste && <p className="mt-2 rounded-sm bg-white p-2.5 text-xs text-muted"><strong className="text-ink">Piste d’action : </strong>{piste}</p>}
          {actions && <div className="mt-2.5 flex flex-wrap gap-1 border-t border-line pt-2.5">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

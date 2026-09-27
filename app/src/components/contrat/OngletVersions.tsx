import { useMemo, useState } from 'react';
import { GitBranch, Plus, CheckCircle2, FileText, Pencil } from 'lucide-react';
import { api, logAction } from '../../lib/api';
import type { Action, Alerte, Clause, Contrat, ContratPartie, Echeance, Engagement, Evenement, Historique, Preuve, Version } from '../../lib/types';
import { fmtDate } from '../../lib/format';
import { Btn, Empty, Field, Modal, inputCls, useToast } from '../ui';

// Versioning : aucune modification importante n'écrase silencieusement
// une version. Chaque version fige un instantané des données structurées.
export default function OngletVersions({ contrat, versions, snapshot, historique, onChange }: {
  contrat: Contrat;
  versions: Version[];
  snapshot: {
    clauses: Clause[]; engagements: Engagement[]; echeances: Echeance[];
    evenements: Evenement[]; preuves: Preuve[]; parties: ContratPartie[];
    alertes: Alerte[]; actions: Action[];
  };
  historique: Historique[];
  onChange: () => void;
}) {
  const { toastEl, ok, err } = useToast();
  const [modal, setModal] = useState(false);
  const [compare, setCompare] = useState<Version | null>(null);
  const [titre, setTitre] = useState('');
  const [resume, setResume] = useState('');
  const [brouillon, setBrouillon] = useState(false);
  const [busy, setBusy] = useState(false);

  const numeroSuivant = useMemo(
    () => (versions.reduce((m, v) => Math.max(m, v.numero || 0), 0) || 1) + 1,
    [versions],
  );

  const figer = async () => {
    if (!titre.trim()) { err('Donnez un titre à cette version.'); return; }
    setBusy(true);
    try {
      const snap = {
        date: new Date().toISOString(),
        contrat: { titre: contrat.titre, objet: contrat.objet, statut: contrat.statut, montant_total: contrat.montant_total, devise: contrat.devise, date_debut: contrat.date_debut, date_fin: contrat.date_fin, pays: contrat.pays, droit_applicable: contrat.droit_applicable },
        clauses: snapshot.clauses.map((c) => ({ categorie: c.categorie, titre: c.titre, contenu: c.contenu, statut: c.statut })),
        engagements: snapshot.engagements.map((g) => ({ titre: g.titre, statut: g.statut, date_echeance: g.date_echeance })),
        echeances: snapshot.echeances.map((e) => ({ titre: e.titre, type: e.type, date_limite: e.date_limite, montant: e.montant, statut: e.statut })),
        parties: snapshot.parties.map((p) => ({ nom: p.partie?.nom, role: p.role, signature: p.signature_statut })),
        compteurs: { evenements: snapshot.evenements.length, preuves: snapshot.preuves.length },
      };
      const statutVersion = brouillon ? 'brouillon' : 'validee';
      const v = await api.versions.create({
        contrat_id: contrat.id, numero: numeroSuivant, titre: titre.trim(),
        resume: resume || null, statut: statutVersion, snapshot: snap,
      });
      if (!brouillon) await api.contrats.update(contrat.id, { version_courante: numeroSuivant });
      await logAction(contrat.id, 'version_figee', 'version', v.id, { numero: numeroSuivant, titre, statut: statutVersion });
      setModal(false);
      setTitre('');
      setResume('');
      setBrouillon(false);
      onChange();
      ok(brouillon ? `Version ${numeroSuivant} enregistrée en brouillon — à valider avant qu’elle ne devienne la version courante.` : `Version ${numeroSuivant} figée — l’historique reste intact.`);
    } catch (e: any) { err(e.message); } finally { setBusy(false); }
  };

  const validerBrouillon = async (v: Version) => {
    try {
      await api.versions.update(v.id, { statut: 'validee' });
      await api.contrats.update(contrat.id, { version_courante: v.numero });
      await logAction(contrat.id, 'version_validee', 'version', v.id, { numero: v.numero });
      onChange();
      ok(`Version ${v.numero} validée.`);
    } catch (e: any) { err(e.message); }
  };

  return (
    <div className="space-y-4">
      {toastEl}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          Version courante : <strong className="text-ink">v{contrat.version_courante || 1}</strong> · {versions.length} version(s) conservée(s).
          Aucune modification importante n’écrase silencieusement une version.
        </p>
        <Btn onClick={() => setModal(true)}><Plus className="h-4 w-4" /> Figer une nouvelle version</Btn>
      </div>

      {versions.length === 0 ? (
        <Empty icon={<GitBranch className="h-8 w-8" />} titre="Aucune version figée" texte="Figez l’état actuel des données (clauses, engagements, échéances, signatures) pour garder une trace horodatée avant toute évolution." action={<Btn onClick={() => setModal(true)}><Plus className="h-4 w-4" /> Figer la v1</Btn>} />
      ) : (
        <div className="space-y-2.5">
          {[...versions].sort((a, b) => (b.numero || 0) - (a.numero || 0)).map((v) => (
            <div key={v.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-sm bg-fuchsia-100 px-3 py-1.5 font-mono text-sm font-bold text-fuchsia">v{v.numero}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{v.titre}</p>
                  <p className="mt-0.5 text-xs text-faint">
                    {fmtDate(v.created_at, true)}
                    {v.snapshot?.compteurs ? ` · ${v.snapshot.compteurs.evenements ?? '?'} événement(s), ${v.snapshot.compteurs.preuves ?? '?'} preuve(s)` : ''}
                    {v.snapshot?.clauses ? ` · ${v.snapshot.clauses.length} clause(s)` : ''}
                  </p>
                </div>
                <StatutVersion s={v.statut} />
                <span className="flex gap-1">
                  {v.statut === 'brouillon' && (
                    <button onClick={() => validerBrouillon(v)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-success hover:bg-success-soft">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Valider
                    </button>
                  )}
                  <button onClick={() => setCompare(v)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-white">
                    <FileText className="h-3.5 w-3.5" /> Voir l’instantané
                  </button>
                </span>
              </div>
              {v.resume && <p className="mt-2 text-sm text-muted">{v.resume}</p>}
            </div>
          ))}
        </div>
      )}

      {/* HISTORIQUE */}
      <section className="pt-2">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-muted">
          Historique des opérations ({historique.length})
        </h3>
        {historique.length === 0 ? (
          <p className="card p-4 text-sm text-muted">Aucune opération journalisée pour l’instant.</p>
        ) : (
          <div className="max-h-80 space-y-1.5 overflow-y-auto card p-3">
            {historique.map((h) => (
              <div key={h.id} className="flex items-start justify-between gap-3 rounded-sm px-2 py-1.5 text-sm hover:bg-white">
                <p className="text-muted">
                  <strong className="font-medium text-ink">{actionLabel(h.action)}</strong>
                  {h.entite_type ? <span className="text-faint"> · {h.entite_type}</span> : null}
                  {h.details && typeof h.details === 'object' && (h.details.titre || h.details.nom) ? (
                    <span className="text-muted"> — « {(h.details.titre || h.details.nom) as string} »</span>
                  ) : null}
                </p>
                <p className="shrink-0 text-xs text-faint">{h.acteur || ''} · {fmtDate(h.created_at, true)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {modal && (
        <Modal titre={`Figer la version ${numeroSuivant}`} sousTitre="L’instantané actuel (clauses, engagements, échéances, signatures) sera conservé tel quel." onClose={() => setModal(false)}>
          <div className="space-y-4">
            <Field label="Titre de la version *"><input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder={`Ex. : V${numeroSuivant} — avenant loyer signé`} className={inputCls} /></Field>
            <Field label="Résumé des changements"><textarea value={resume} onChange={(e) => setResume(e.target.value)} rows={3} placeholder="Ce qui change par rapport à la version précédente…" className={inputCls} /></Field>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-sm border border-line bg-white p-3 text-sm text-muted">
              <input type="checkbox" checked={brouillon} onChange={(e) => setBrouillon(e.target.checked)} className="mt-0.5 cursor-pointer" />
              <span>Enregistrer comme <strong className="text-ink">brouillon</strong> — l’instantané est conservé mais ne devient pas la version courante tant qu’il n’est pas validé.</span>
            </label>
            <div className="card p-3.5 text-sm text-muted">
              Seront figés : {snapshot.clauses.length} clause(s), {snapshot.engagements.length} engagement(s), {snapshot.echeances.length} échéance(s), {snapshot.parties.length} partie(s), {snapshot.evenements.length} événement(s), {snapshot.preuves.length} preuve(s).
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(false)}>Annuler</Btn>
              <Btn onClick={figer} disabled={busy}>{busy ? 'Figeage…' : 'Figer cette version'}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {compare && (
        <Modal large titre={`Instantané — v${compare.numero} · ${compare.titre}`} sousTitre={`Figé le ${fmtDate(compare.created_at, true)}`} onClose={() => setCompare(null)}>
          {!compare.snapshot || typeof compare.snapshot !== 'object' ? (
            <p className="text-sm text-muted">Aucun instantané détaillé pour cette version.</p>
          ) : (
            <div className="space-y-3 text-sm">
              {compare.snapshot.contrat && (
                <div className="card p-3.5">
                  <p className="mb-1 font-semibold text-ink">Contrat</p>
                  <p className="text-muted">{compare.snapshot.contrat.titre} — {compare.snapshot.contrat.statut}</p>
                  <p className="text-muted">{compare.snapshot.contrat.objet || ''}</p>
                </div>
              )}
              {Array.isArray(compare.snapshot.clauses) && (
                <details open className="card p-3.5">
                  <summary className="cursor-pointer font-semibold text-ink">Clauses ({compare.snapshot.clauses.length})</summary>
                  <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
                    {compare.snapshot.clauses.map((c: any, i: number) => (
                      <div key={i} className="rounded-sm bg-white p-2.5">
                        <p className="text-xs font-semibold text-fuchsia-600">{c.categorie} — {c.titre}</p>
                        <p className="mt-0.5 line-clamp-3 text-xs text-muted">{c.contenu}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}
              {Array.isArray(compare.snapshot.engagements) && (
                <details className="card p-3.5">
                  <summary className="cursor-pointer font-semibold text-ink">Engagements ({compare.snapshot.engagements.length})</summary>
                  <ul className="mt-2 list-disc pl-5 text-muted">
                    {compare.snapshot.engagements.map((g: any, i: number) => <li key={i}>{g.titre} <span className="text-faint">({g.statut})</span></li>)}
                  </ul>
                </details>
              )}
              {Array.isArray(compare.snapshot.parties) && (
                <details className="card p-3.5">
                  <summary className="cursor-pointer font-semibold text-ink">Parties & signatures</summary>
                  <ul className="mt-2 list-disc pl-5 text-muted">
                    {compare.snapshot.parties.map((p: any, i: number) => <li key={i}>{p.nom} — {p.role} <span className="text-faint">({p.signature})</span></li>)}
                  </ul>
                </details>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function StatutVersion({ s }: { s: string | null | undefined }) {
  if (s === 'signee') return <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">Signée</span>;
  if (s === 'brouillon') return <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-100 px-2.5 py-1 text-xs font-semibold text-fuchsia"><Pencil className="h-3 w-3" /> Brouillon</span>;
  return <span className="rounded-full bg-fuchsia-soft px-2.5 py-1 text-xs font-medium text-attention">Validée</span>;
}

function actionLabel(a: string | null | undefined): string {
  const m: Record<string, string> = {
    contrat_cree: 'Contrat créé', contrat_modifie: 'Contrat modifié',
    partie_rattachee: 'Partie rattachée', partie_detachee: 'Partie détachée',
    partie_modifiee: 'Rôle modifié', fiche_partie_modifiee: 'Fiche identité modifiée',
    clause_creee: 'Clause ajoutée', clause_modifiee: 'Clause modifiée', clause_supprimee: 'Clause supprimée',
    engagement_cree: 'Engagement créé', engagement_modifie: 'Engagement modifié',
    engagement_supprime: 'Engagement supprimé', engagement_statut: 'Statut d’engagement',
    echeance_creee: 'Échéance créée', echeance_modifiee: 'Échéance modifiée',
    echeance_supprimee: 'Échéance supprimée', echeance_statut: 'Statut d’échéance',
    evenement_cree: 'Événement enregistré', evenement_modifie: 'Événement modifié', evenement_supprime: 'Événement supprimé',
    preuve_versee: 'Preuve versée', preuve_retiree: 'Preuve retirée',
    coherence_analysee: 'Analyse de cohérence', alerte_statut: 'Alerte traitée',
    scenario_cree: 'Scénario créé', scenario_modifie: 'Scénario modifié', scenario_supprime: 'Scénario supprimé',
    scenarios_defaut: 'Scénarios types chargés',
    action_creee: 'Action créée', action_modifiee: 'Action modifiée', action_supprimee: 'Action supprimée', action_statut: 'Statut d’action',
    version_figee: 'Version figée', version_validee: 'Version validée',
    avenant_cree: 'Avenant initié', avenant_initie: 'Avenant initié', situation_analysee: 'Situation analysée', situation_enregistree: 'Situation enregistrée',
    dossier_genere: 'Dossier final généré',
  };
  return m[a || ''] || a || 'Opération';
}

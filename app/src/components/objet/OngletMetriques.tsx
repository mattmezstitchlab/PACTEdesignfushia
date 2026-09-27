import { useMemo, useState } from 'react';
import { Gauge, Plus, Trash2, TrendingUp } from 'lucide-react';
import { api, logActionObjet } from '../../lib/api';
import type { Metrique } from '../../lib/types';
import { fmtDate } from '../../lib/format';
import { analyserValeur } from '../../lib/valeur';
import { Btn, Empty, Field, Modal, inputCls, useToast } from '../ui';

const STATUT_LABEL: Record<string, string> = {
  declaree: 'Déclarée', documentee: 'Documentée', confirmee: 'Confirmée', a_verifier: 'À vérifier',
};

// DONNÉE — valeur, mesure, montant, quantité, date, état, indicateur.
// L'ANALYSE qui en découle (ci-dessous) n'est jamais une prédiction :
// observation + facteurs + données manquantes + incertitude, toujours.
export default function OngletMetriques({ objetId, metriques, onChange }: {
  objetId: number;
  metriques: Metrique[];
  onChange: () => void;
}) {
  const { toastEl, ok, err } = useToast();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>({});
  const [busy, setBusy] = useState(false);

  const analyse = useMemo(() => analyserValeur(metriques), [metriques]);
  const triees = useMemo(() => [...metriques].sort((a, b) => new Date(b.date_mesure || b.created_at).getTime() - new Date(a.date_mesure || a.created_at).getTime()), [metriques]);

  const ouvrir = () => {
    setForm({ libelle: '', valeur: '', unite: '', date_mesure: new Date().toISOString().slice(0, 10), source: '', statut: 'declaree', notes: '' });
    setModal(true);
  };

  const sauver = async () => {
    if (!form.libelle.trim()) { err('Donnez un libellé à cette donnée (ex. « valeur estimée », « cours de clôture »).'); return; }
    setBusy(true);
    try {
      const created = await api.metriques.create({
        objet_id: objetId,
        libelle: form.libelle.trim(),
        valeur: form.valeur !== '' ? Number(form.valeur) : null,
        unite: form.unite || null,
        date_mesure: form.date_mesure || null,
        source: form.source || null,
        statut: form.statut || 'declaree',
        notes: form.notes || null,
      });
      await logActionObjet(objetId, 'donnee_ajoutee', 'metrique', created.id, { libelle: form.libelle });
      setModal(false);
      onChange();
      ok('Donnée enregistrée.');
    } catch (e: any) { err(e.message); } finally { setBusy(false); }
  };

  const supprimer = async (m: Metrique) => {
    if (!confirm(`Supprimer la donnée « ${m.libelle} » ?`)) return;
    try {
      await api.metriques.remove(m.id);
      await logActionObjet(objetId, 'donnee_supprimee', 'metrique', m.id, { libelle: m.libelle });
      onChange();
      ok('Donnée supprimée.');
    } catch (e: any) { err(e.message); }
  };

  return (
    <div className="space-y-5">
      {toastEl}
      <div className="card p-5">
        <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold text-ink"><TrendingUp className="h-5 w-5 text-fuchsia" /> Observation — jamais une prédiction</h2>
        {analyse.valeur_observee === null ? (
          <p className="text-sm text-muted">{analyse.incertitude}</p>
        ) : (
          <>
            <p className="mt-1 text-2xl font-bold text-ink">{analyse.valeur_observee}{analyse.variation_pct !== null && (
              <span className={`ml-2 text-sm font-medium ${analyse.variation_pct >= 0 ? 'text-success' : 'text-critique'}`}>{analyse.variation_pct >= 0 ? '+' : ''}{analyse.variation_pct}% depuis la première mesure</span>
            )}</p>
            <p className="text-xs text-faint">Observée au {analyse.date_observation ? fmtDate(analyse.date_observation) : '—'} · {analyse.nb_mesures} mesure(s) enregistrée(s)</p>
            {analyse.facteurs.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-muted">{analyse.facteurs.map((f, i) => <li key={i}>· {f}</li>)}</ul>
            )}
            {analyse.donnees_manquantes.length > 0 && (
              <div className="mt-3 rounded-sm bg-fuchsia-50 p-3 text-xs text-fuchsia-700">
                <strong>Données manquantes / incertitude :</strong>
                <ul className="mt-1 space-y-0.5">{analyse.donnees_manquantes.map((d, i) => <li key={i}>· {d}</li>)}</ul>
              </div>
            )}
            <p className="mt-3 text-xs italic text-faint">{analyse.incertitude}</p>
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">Données enregistrées</h3>
        <Btn onClick={ouvrir}><Plus className="h-4 w-4" /> Ajouter une donnée</Btn>
      </div>

      {triees.length === 0 ? (
        <Empty icon={<Gauge className="h-8 w-8" />} titre="Aucune donnée" texte="Enregistrez des valeurs, montants, quantités ou indicateurs datés et sourcés." action={<Btn onClick={ouvrir}><Plus className="h-4 w-4" /> Ajouter une donnée</Btn>} />
      ) : (
        <div className="space-y-2">
          {triees.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-3 card p-3.5">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                  {m.libelle} {m.valeur !== null && <span className="text-fuchsia">{m.valeur}{m.unite ? ` ${m.unite}` : ''}</span>}
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-muted">{STATUT_LABEL[m.statut || ''] || 'Déclarée'}</span>
                </p>
                <p className="mt-0.5 text-xs text-faint">{m.date_mesure ? fmtDate(m.date_mesure) : fmtDate(m.created_at)}{m.source ? ` · Source : ${m.source}` : ''}</p>
              </div>
              <button onClick={() => supprimer(m)} className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-critique-soft hover:text-critique"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal titre="Ajouter une donnée" sousTitre="Valeur, mesure, montant, quantité, date, état, indicateur — toujours daté et sourcé." onClose={() => setModal(false)}>
          <div className="space-y-3">
            <Field label="Libellé"><input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} className={inputCls} placeholder="Ex. : valeur estimée, cours de clôture, nombre de participants…" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valeur"><input type="number" step="any" value={form.valeur} onChange={(e) => setForm({ ...form, valeur: e.target.value })} className={inputCls} /></Field>
              <Field label="Unité"><input value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })} className={inputCls} placeholder="€, %, kg, participants…" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date de mesure"><input type="date" value={form.date_mesure} onChange={(e) => setForm({ ...form, date_mesure: e.target.value })} className={inputCls} /></Field>
              <Field label="Statut">
                <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  {Object.entries(STATUT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Source" hint="D’où vient cette donnée ? (expertise, relevé, plateforme, déclaration…)"><input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={inputCls} /></Field>
            <Field label="Notes"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} rows={2} /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="ghost" onClick={() => setModal(false)}>Annuler</Btn>
              <Btn onClick={sauver} disabled={busy}>Enregistrer</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

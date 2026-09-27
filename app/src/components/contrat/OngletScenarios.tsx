import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, FlaskConical, CheckCircle2, FileText, Paperclip, ListChecks, ArrowRight } from 'lucide-react';
import { api, logAction } from '../../lib/api';
import type { Clause, Echeance, Engagement, Evenement, Preuve, Scenario } from '../../lib/types';
import { evaluerScenario, scenariosParDefaut } from '../../lib/scenarios';
import { Btn, Empty, Field, Modal, Prudence, inputCls, useToast } from '../ui';

// Moteur de scénarios : SI événement X → vérifier condition Y →
// engagements concernés → clauses → preuves → actions possibles.
export default function OngletScenarios({ contratId, scenarios, ctx, droit, onChange }: {
  contratId: number;
  scenarios: Scenario[];
  ctx: { engagements: Engagement[]; echeances: Echeance[]; evenements: Evenement[]; clauses: Clause[]; preuves: Preuve[] };
  droit: string | null;
  onChange: () => void;
}) {
  const { toastEl, ok, err } = useToast();
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Scenario | null>(null);
  const [form, setForm] = useState<any>({});
  const [selectionne, setSelectionne] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const evaluation = useMemo(() => {
    const s = scenarios.find((x) => x.id === selectionne);
    if (!s) return null;
    return evaluerScenario(s, { ...ctx, droitApplicable: droit });
  }, [selectionne, scenarios, ctx, droit]);

  const ouvrir = (s?: Scenario) => {
    if (s) {
      setEdit(s);
      setForm({ nom: s.nom || '', declencheur: s.declencheur || '', declencheur_type: s.declencheur_type || '', condition_verif: s.condition_verif || '', clauses_mots_cles: s.clauses_mots_cles || '', actions_suggerees: s.actions_suggerees || '', note_prudence: s.note_prudence || '', actif: s.actif !== false });
    } else {
      setEdit(null);
      setForm({ nom: '', declencheur: '', declencheur_type: '', condition_verif: '', clauses_mots_cles: '', actions_suggerees: '', note_prudence: '', actif: true });
    }
    setModal(true);
  };

  const sauver = async () => {
    if (!form.nom?.trim() || !form.declencheur?.trim()) { err('Nom et déclencheur sont obligatoires.'); return; }
    setBusy(true);
    try {
      const payload = {
        contrat_id: contratId, nom: form.nom.trim(), declencheur: form.declencheur.trim(),
        declencheur_type: form.declencheur_type || null, condition_verif: form.condition_verif || null,
        clauses_mots_cles: form.clauses_mots_cles || null, actions_suggerees: form.actions_suggerees || null,
        note_prudence: form.note_prudence || null, actif: form.actif !== false,
      };
      if (edit) {
        await api.scenarios.update(edit.id, payload);
        await logAction(contratId, 'scenario_modifie', 'scenario', edit.id, { nom: form.nom });
      } else {
        const c = await api.scenarios.create(payload);
        await logAction(contratId, 'scenario_cree', 'scenario', c.id, { nom: form.nom });
      }
      setModal(false);
      onChange();
      ok(edit ? 'Scénario mis à jour.' : 'Scénario créé.');
    } catch (e: any) { err(e.message); } finally { setBusy(false); }
  };

  const chargerDefaut = async () => {
    setBusy(true);
    try {
      for (const s of scenariosParDefaut(contratId)) await api.scenarios.create(s);
      await logAction(contratId, 'scenarios_defaut', 'contrat', contratId, {});
      onChange();
      ok('Scénarios types chargés — adaptez-les à votre contrat.');
    } catch (e: any) { err(e.message); } finally { setBusy(false); }
  };

  const supprimer = async (s: Scenario) => {
    if (!confirm(`Supprimer le scénario « ${s.nom} » ?`)) return;
    try {
      await api.scenarios.remove(s.id);
      if (selectionne === s.id) setSelectionne(null);
      await logAction(contratId, 'scenario_supprime', 'scenario', s.id, { nom: s.nom });
      onChange();
      ok('Scénario supprimé.');
    } catch (e: any) { err(e.message); }
  };

  const versAction = async (texte: string) => {
    try {
      await api.actions.create({ contrat_id: contratId, titre: texte.slice(0, 140), description: `Issue du scénario « ${scenarios.find((s) => s.id === selectionne)?.nom} ».`, priorite: 'normale', statut: 'a_faire' });
      await logAction(contratId, 'action_creee', 'contrat', contratId, { depuis_scenario: selectionne });
      onChange();
      ok('Action créée — retrouvez-la dans l’onglet Actions.');
    } catch (e: any) { err(e.message); }
  };

  return (
    <div className="space-y-4">
      {toastEl}
      <Prudence compact />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          {scenarios.length} scénario(s) · <strong className="text-ink">SI</strong> événement → <strong className="text-ink">VÉRIFIER</strong> conditions → <strong className="text-ink">IDENTIFIER</strong> engagements → <strong className="text-ink">AFFICHER</strong> clauses & preuves → <strong className="text-ink">PROPOSER</strong> actions.
        </p>
        <span className="flex gap-2">
          {scenarios.length === 0 && <Btn variant="soft" onClick={chargerDefaut} disabled={busy}>Charger les 6 scénarios types</Btn>}
          <Btn onClick={() => ouvrir()}><Plus className="h-4 w-4" /> Nouveau scénario</Btn>
        </span>
      </div>

      {scenarios.length === 0 ? (
        <Empty icon={<FlaskConical className="h-8 w-8" />} titre="Aucun scénario" texte="Préparez vos réponses aux situations classiques : retard de paiement, livraison non conforme, demande d’avenant, force majeure, résiliation, désaccord…" action={<span className="flex gap-2"><Btn onClick={chargerDefaut} disabled={busy}>Charger les types</Btn><Btn variant="soft" onClick={() => ouvrir()}>Créer sur mesure</Btn></span>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-2 lg:col-span-2">
            {scenarios.map((s) => (
              <div key={s.id} className={`rounded border p-4 transition ${selectionne === s.id ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-line bg-white hover:border-line'}`}>
                <button onClick={() => setSelectionne(selectionne === s.id ? null : s.id)} className="w-full cursor-pointer text-left">
                  <p className="font-semibold text-ink">{s.nom}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">SI : {s.declencheur}</p>
                </button>
                <div className="mt-2 flex gap-1 border-t border-line pt-2">
                  <button onClick={() => setSelectionne(s.id)} className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-fuchsia hover:bg-fuchsia-100">Évaluer</button>
                  <button onClick={() => ouvrir(s)} className="cursor-pointer rounded-lg px-2 py-1 text-xs text-muted hover:bg-white"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => supprimer(s)} className="cursor-pointer rounded-lg px-2 py-1 text-xs text-muted hover:bg-critique-soft hover:text-critique"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            {!evaluation ? (
              <div className="flex h-full min-h-64 flex-col items-center justify-center rounded border border-dashed border-line p-8 text-center">
                <FlaskConical className="mb-3 h-8 w-8 text-faint" />
                <p className="font-medium text-ink">Sélectionnez un scénario à évaluer</p>
                <p className="mt-1 max-w-sm text-sm text-muted">Le moteur reliera automatiquement les événements, engagements, échéances, clauses et preuves concernés.</p>
              </div>
            ) : (
              <div className="space-y-3 rounded border border-fuchsia-200 bg-white p-5">
                <h3 className="font-display text-lg font-semibold text-ink">Évaluation — {evaluation.scenario.nom}</h3>
                <p className="rounded-sm bg-ink p-3 text-sm text-muted"><strong className="text-fuchsia-600">À vérifier : </strong>{evaluation.scenario.condition_verif || '—'}</p>

                <EvalBloc icon={<ListChecks className="h-4 w-4" />} titre={`Événements déclencheurs (${evaluation.evenements_declencheurs.length})`} vide="Aucun événement correspondant pour l’instant — le scénario reste en veille.">
                  {evaluation.evenements_declencheurs.map((ev) => <li key={ev.id}>{ev.titre}</li>)}
                </EvalBloc>
                <EvalBloc icon={<CheckCircle2 className="h-4 w-4" />} titre={`Engagements concernés (${evaluation.engagements_concernes.length})`} vide="Aucun engagement rattaché — ciblez-les dans le scénario.">
                  {evaluation.engagements_concernes.map((g) => <li key={g.id}>{g.titre}</li>)}
                </EvalBloc>
                {evaluation.echeances_concernees.length > 0 && (
                  <EvalBloc icon={<CheckCircle2 className="h-4 w-4" />} titre={`Échéances concernées (${evaluation.echeances_concernees.length})`} vide="">
                    {evaluation.echeances_concernees.map((e) => <li key={e.id}>{e.titre}</li>)}
                  </EvalBloc>
                )}
                <EvalBloc icon={<FileText className="h-4 w-4" />} titre={`Clauses correspondantes (${evaluation.clauses_correspondantes.length})`} vide="Aucune clause correspondante détectée — vérifiez si le contrat traite cette situation.">
                  {evaluation.clauses_correspondantes.map((c) => <li key={c.id}><strong>{c.titre}</strong> <span className="text-faint">({c.categorie})</span></li>)}
                </EvalBloc>
                <EvalBloc icon={<Paperclip className="h-4 w-4" />} titre={`Preuves liées (${evaluation.preuves_liees.length})`} vide="Aucune preuve rattachée — rassemblez les écrits disponibles.">
                  {evaluation.preuves_liees.map((p) => <li key={p.id}>{p.titre}</li>)}
                </EvalBloc>

                <div className="rounded border border-success bg-success-soft p-4">
                  <p className="mb-2 text-sm font-semibold text-success">Actions possibles</p>
                  <ul className="space-y-2">
                    {evaluation.actions_possibles.map((a, i) => (
                      <li key={i} className="flex items-start justify-between gap-2 text-sm text-ink">
                        <span className="flex gap-2"><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-success" />{a}</span>
                        <button onClick={() => versAction(a)} className="shrink-0 cursor-pointer rounded-lg px-2 py-1 text-xs text-success hover:bg-success-soft">→ Action</button>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="card p-3 text-xs leading-relaxed text-muted">
                  <strong className="text-ink">Complétude du dossier : </strong>{evaluation.niveau_confiance}
                  <br /><br />{evaluation.avertissement}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {modal && (
        <Modal large titre={edit ? 'Modifier le scénario' : 'Nouveau scénario'} sousTitre="SI… → VÉRIFIER… → IDENTIFIER… → AFFICHER… → PROPOSER…" onClose={() => setModal(false)}>
          <div className="space-y-4">
            <Field label="Nom du scénario *"><input value={form.nom || ''} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex. : Retard de paiement" className={inputCls} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SI — déclencheur (texte) *"><textarea value={form.declencheur || ''} onChange={(e) => setForm({ ...form, declencheur: e.target.value })} rows={2} placeholder="Ex. : un paiement attendu n’a pas été reçu…" className={inputCls} /></Field>
              <Field label="SI — type d’événement">
                <select value={form.declencheur_type || ''} onChange={(e) => setForm({ ...form, declencheur_type: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  <option value="">— Tous —</option>
                  {['paiement', 'retard', 'livraison', 'reception', 'validation', 'refus', 'modification', 'annulation', 'incident', 'force_majeure', 'communication'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <Field label="VÉRIFIER — condition à contrôler"><textarea value={form.condition_verif || ''} onChange={(e) => setForm({ ...form, condition_verif: e.target.value })} rows={2} placeholder="Ex. : date limite, montants versés, clause de pénalité…" className={inputCls} /></Field>
            <Field label="Mots-clés pour retrouver les clauses"><input value={form.clauses_mots_cles || ''} onChange={(e) => setForm({ ...form, clauses_mots_cles: e.target.value })} placeholder="Ex. : paiement échéance pénalité facture" className={inputCls} /></Field>
            <Field label="Actions suggérées (une par ligne)"><textarea value={form.actions_suggerees || ''} onChange={(e) => setForm({ ...form, actions_suggerees: e.target.value })} rows={3} placeholder={"- Relire la clause…\n- Adresser une relance écrite…"} className={inputCls} /></Field>
            <Field label="Note de prudence"><input value={form.note_prudence || ''} onChange={(e) => setForm({ ...form, note_prudence: e.target.value })} placeholder="Ex. : ne présumez d’aucun automatisme…" className={inputCls} /></Field>
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(false)}>Annuler</Btn>
              <Btn onClick={sauver} disabled={busy}>{busy ? 'Enregistrement…' : edit ? 'Mettre à jour' : 'Créer le scénario'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function EvalBloc({ icon, titre, vide, children }: { icon: React.ReactNode; titre: string; vide: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-line bg-ink p-4">
      <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-ink">{icon} {titre}</p>
      {Array.isArray(children) && children.length === 0 ? (
        <p className="text-sm italic text-faint">{vide}</p>
      ) : (
        <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted">{children}</ul>
      )}
    </div>
  );
}

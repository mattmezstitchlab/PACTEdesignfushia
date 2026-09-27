import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ListTodo, Telescope, CheckCircle2, Circle } from 'lucide-react';
import { api, logAction } from '../../lib/api';
import type { Action, Echeance, Engagement, Evenement } from '../../lib/types';
import { anticiper } from '../../lib/scenarios';
import { fmtDate } from '../../lib/format';
import { Btn, Empty, Field, Modal, inputCls, useToast } from '../ui';

// Actions + Anticipation : ce qu'il faut faire, et ce qui se prépare.
export default function OngletActions({ contratId, actions, echeances, evenements, engagements, dateFin, statutContrat, onChange }: {
  contratId: number;
  actions: Action[];
  echeances: Echeance[];
  evenements: Evenement[];
  engagements: Engagement[];
  dateFin: string | null;
  statutContrat: string;
  onChange: () => void;
}) {
  const { toastEl, ok, err } = useToast();
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Action | null>(null);
  const [form, setForm] = useState<any>({});
  const [filtre, setFiltre] = useState('ouvertes');
  const [busy, setBusy] = useState(false);

  const previsions = useMemo(
    () => anticiper({ dateFinContrat: dateFin, statutContrat, echeances, evenements, engagements }),
    [dateFin, statutContrat, echeances, evenements, engagements],
  );

  const ouvrir = (a?: Action) => {
    if (a) {
      setEdit(a);
      setForm({ titre: a.titre || '', description: a.description || '', priorite: a.priorite || 'normale', statut: a.statut || 'a_faire', echeance: (a.echeance || '').slice(0, 10), responsable: a.responsable || '' });
    } else {
      setEdit(null);
      setForm({ titre: '', description: '', priorite: 'normale', statut: 'a_faire', echeance: '', responsable: '' });
    }
    setModal(true);
  };

  const sauver = async () => {
    if (!form.titre?.trim()) { err('Le titre est obligatoire.'); return; }
    setBusy(true);
    try {
      const payload = {
        contrat_id: contratId, titre: form.titre.trim(), description: form.description || null,
        priorite: form.priorite || 'normale', statut: form.statut || 'a_faire',
        echeance: form.echeance || null, responsable: form.responsable || null,
        alerte_id: edit?.alerte_id ?? null,
      };
      if (edit) {
        await api.actions.update(edit.id, payload);
        await logAction(contratId, 'action_modifiee', 'action', edit.id, { titre: form.titre });
      } else {
        const c = await api.actions.create(payload);
        await logAction(contratId, 'action_creee', 'action', c.id, { titre: form.titre });
      }
      setModal(false);
      onChange();
      ok(edit ? 'Action mise à jour.' : 'Action créée.');
    } catch (e: any) { err(e.message); } finally { setBusy(false); }
  };

  const statut = async (a: Action, s: string) => {
    try {
      await api.actions.update(a.id, { statut: s });
      await logAction(contratId, 'action_statut', 'action', a.id, { de: a.statut, vers: s });
      onChange();
    } catch (e: any) { err(e.message); }
  };

  const supprimer = async (a: Action) => {
    if (!confirm(`Supprimer l’action « ${a.titre} » ?`)) return;
    try {
      await api.actions.remove(a.id);
      await logAction(contratId, 'action_supprimee', 'action', a.id, { titre: a.titre });
      onChange();
      ok('Action supprimée.');
    } catch (e: any) { err(e.message); }
  };

  const depuisPrevision = (titre: string, desc: string) => {
    setEdit(null);
    setForm({ titre, description: desc, priorite: 'normale', statut: 'a_faire', echeance: '', responsable: '' });
    setModal(true);
  };

  const liste = useMemo(() => {
    let l = [...actions];
    if (filtre === 'ouvertes') l = l.filter((a) => a.statut === 'a_faire' || a.statut === 'en_cours');
    if (filtre === 'terminees') l = l.filter((a) => a.statut === 'terminee');
    return l.sort((a, b) => new Date(a.echeance || '9999').getTime() - new Date(b.echeance || '9999').getTime());
  }, [actions, filtre]);

  return (
    <div className="space-y-6">
      {toastEl}

      {/* ANTICIPATION */}
      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-attention/80">
          <Telescope className="h-4 w-4" /> Anticipation — événements prévisibles ({previsions.length})
        </h3>
        {previsions.length === 0 ? (
          <p className="card p-4 text-sm text-muted">
            Rien de prévisible pour les 90 prochains jours sur les données actuelles. L’anticipation se nourrit des échéances, de la fin du contrat et de l’historique.
          </p>
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2">
            {previsions.map((p, i) => (
              <div key={i} className="rounded border border-fuchsia-100 bg-fuchsia/[0.04] p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <span className="rounded-full bg-fuchsia-soft px-2 py-0.5 text-[11px] font-bold text-attention">
                    {p.horizon_jours === 0 ? 'MAINTENANT' : `J+${p.horizon_jours}`}
                  </span>
                  {p.titre}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.description}</p>
                <p className="mt-1.5 text-xs text-faint">Source : {p.source}</p>
                <p className="mt-2 rounded-sm bg-white p-2.5 text-xs text-muted"><strong className="text-ink">Se préparer : </strong>{p.preparation}</p>
                <button onClick={() => depuisPrevision(`Préparer : ${p.titre}`, p.preparation)} className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-attention hover:text-attention">
                  <Plus className="h-3.5 w-3.5" /> En faire une action
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ACTIONS */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-fuchsia-700">
            <ListTodo className="h-4 w-4" /> Plan d’actions ({liste.length})
          </h3>
          <span className="flex items-center gap-2">
            <span className="flex gap-1.5">
              {[{ v: 'ouvertes', l: 'Ouvertes' }, { v: '', l: 'Toutes' }, { v: 'terminees', l: 'Terminées' }].map((f) => (
                <button key={f.v} onClick={() => setFiltre(f.v)} className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium ${filtre === f.v ? 'bg-fuchsia text-white' : 'bg-white text-muted hover:text-ink'}`}>{f.l}</button>
              ))}
            </span>
            <Btn onClick={() => ouvrir()}><Plus className="h-4 w-4" /> Nouvelle action</Btn>
          </span>
        </div>

        {liste.length === 0 ? (
          <Empty icon={<ListTodo className="h-8 w-8" />} titre="Aucune action" texte="Créez des actions depuis les alertes, les scénarios ou les prévisions — ou directement ici." action={<Btn onClick={() => ouvrir()}><Plus className="h-4 w-4" /> Créer une action</Btn>} />
        ) : (
          <div className="space-y-2.5">
            {liste.map((a) => {
              const terminee = a.statut === 'terminee' || a.statut === 'abandonnee';
              return (
                <div key={a.id} className={`flex flex-wrap items-start gap-3 rounded border p-4 ${terminee ? 'border-line bg-white opacity-60' : 'border-line bg-white'}`}>
                  <button onClick={() => statut(a, terminee ? 'a_faire' : 'terminee')} title={terminee ? 'Rouvrir' : 'Marquer terminée'} className="mt-0.5 cursor-pointer">
                    {terminee ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-faint hover:text-fuchsia" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium ${terminee ? 'text-muted line-through' : 'text-ink'}`}>{a.titre}</p>
                    {a.description && <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{a.description}</p>}
                    <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-faint">
                      {a.echeance && <span>Échéance : {fmtDate(a.echeance)}</span>}
                      {a.responsable && <span>Responsable : {a.responsable}</span>}
                      {a.alerte_id ? <span>Issue d’une alerte</span> : null}
                      <span className={a.priorite === 'haute' || a.priorite === 'critique' ? 'font-semibold text-fuchsia' : ''}>Priorité {a.priorite}</span>
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1">
                    {!terminee && a.statut === 'a_faire' && (
                      <button onClick={() => statut(a, 'en_cours')} className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium text-attention hover:bg-fuchsia-soft">Démarrer</button>
                    )}
                    <button onClick={() => ouvrir(a)} className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-white hover:text-ink"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => supprimer(a)} className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-critique-soft hover:text-critique"><Trash2 className="h-4 w-4" /></button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {modal && (
        <Modal titre={edit ? 'Modifier l’action' : 'Nouvelle action'} onClose={() => setModal(false)}>
          <div className="space-y-4">
            <Field label="Titre *"><input value={form.titre || ''} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="Ex. : Relancer le 3ᵉ versement par écrit" className={inputCls} /></Field>
            <Field label="Description"><textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputCls} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Priorité">
                <select value={form.priorite || 'normale'} onChange={(e) => setForm({ ...form, priorite: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  <option value="basse">Basse</option><option value="normale">Normale</option>
                  <option value="haute">Haute</option><option value="critique">Critique</option>
                </select>
              </Field>
              <Field label="Échéance"><input type="date" value={form.echeance || ''} onChange={(e) => setForm({ ...form, echeance: e.target.value })} className={inputCls} /></Field>
              <Field label="Responsable"><input value={form.responsable || ''} onChange={(e) => setForm({ ...form, responsable: e.target.value })} placeholder="Ex. : Marie" className={inputCls} /></Field>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(false)}>Annuler</Btn>
              <Btn onClick={sauver} disabled={busy}>{busy ? 'Enregistrement…' : edit ? 'Mettre à jour' : 'Créer l’action'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

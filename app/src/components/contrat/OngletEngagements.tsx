import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ListChecks, ChevronDown, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { api, logAction } from '../../lib/api';
import type { ContratPartie, Echeance, Engagement, Evenement, Preuve } from '../../lib/types';
import { fmtDate, delaiHumain, joursRestants } from '../../lib/format';
import { Btn, Empty, Field, Modal, inputCls, useToast } from '../ui';

// Chaque engagement = objet suivi : QUI / FAIT QUOI / POUR QUI / QUAND / OÙ /
// CONDITIONS / PREUVE / SI NON REMPLI.
export default function OngletEngagements({ contratId, engagements, liens, echeances = [], evenements = [], preuves = [], onChange }: {
  contratId: number;
  engagements: Engagement[];
  liens: ContratPartie[];
  echeances?: Echeance[];
  evenements?: Evenement[];
  preuves?: Preuve[];
  onChange: () => void;
}) {
  const { toastEl, ok, err } = useToast();
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Engagement | null>(null);
  const [form, setForm] = useState<any>({});
  const [filtre, setFiltre] = useState('');
  const [ouverts, setOuverts] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  const ouvrir = (g?: Engagement) => {
    if (g) {
      setEdit(g);
      setForm({
        titre: g.titre || '', description: g.description || '',
        qui_partie_id: g.qui_partie_id || '', qui_texte: g.qui_texte || '',
        pour_qui_partie_id: g.pour_qui_partie_id || '', pour_qui_texte: g.pour_qui_texte || '',
        quand_texte: g.quand_texte || '', date_echeance: (g.date_echeance || '').slice(0, 10),
        lieu: g.lieu || '', conditions: g.conditions || '', preuve_attendue: g.preuve_attendue || '',
        si_non_rempli: g.si_non_rempli || '', statut: g.statut || 'a_faire', priorite: g.priorite || 'normale',
      });
    } else {
      setEdit(null);
      setForm({ titre: '', description: '', qui_partie_id: '', qui_texte: '', pour_qui_partie_id: '', pour_qui_texte: '', quand_texte: '', date_echeance: '', lieu: '', conditions: '', preuve_attendue: '', si_non_rempli: '', statut: 'a_faire', priorite: 'normale' });
    }
    setModal(true);
  };

  const sauver = async () => {
    if (!form.titre?.trim()) { err('Le titre de l’engagement est obligatoire.'); return; }
    setBusy(true);
    try {
      const payload = {
        contrat_id: contratId,
        titre: form.titre.trim(),
        description: form.description || null,
        qui_partie_id: form.qui_partie_id ? Number(form.qui_partie_id) : null,
        qui_texte: form.qui_texte || null,
        pour_qui_partie_id: form.pour_qui_partie_id ? Number(form.pour_qui_partie_id) : null,
        pour_qui_texte: form.pour_qui_texte || null,
        quand_texte: form.quand_texte || null,
        date_echeance: form.date_echeance || null,
        lieu: form.lieu || null,
        conditions: form.conditions || null,
        preuve_attendue: form.preuve_attendue || null,
        si_non_rempli: form.si_non_rempli || null,
        statut: form.statut || 'a_faire',
        priorite: form.priorite || 'normale',
      };
      if (edit) {
        await api.engagements.update(edit.id, payload);
        await logAction(contratId, 'engagement_modifie', 'engagement', edit.id, { titre: form.titre });
      } else {
        const c = await api.engagements.create(payload);
        await logAction(contratId, 'engagement_cree', 'engagement', c.id, { titre: form.titre });
      }
      setModal(false);
      onChange();
      ok(edit ? 'Engagement mis à jour.' : 'Engagement créé et suivi.');
    } catch (e: any) { err(e.message); } finally { setBusy(false); }
  };

  const changerStatut = async (g: Engagement, statut: string) => {
    try {
      await api.engagements.update(g.id, { statut });
      await logAction(contratId, 'engagement_statut', 'engagement', g.id, { de: g.statut, vers: statut });
      onChange();
      ok(`Engagement → ${statutLabel(statut)}.`);
    } catch (e: any) { err(e.message); }
  };

  const supprimer = async (g: Engagement) => {
    const echLiees = echeances.filter((e) => e.engagement_id === g.id);
    const evLiees = evenements.filter((e) => e.engagement_ids?.includes(g.id));
    const preLiees = preuves.filter((p) => p.engagement_id === g.id);
    const nbLies = echLiees.length + evLiees.length + preLiees.length;
    const avertissement = nbLies > 0
      ? `\n\n${nbLies} élément(s) y font référence (échéances, événements ou preuves) : ils seront conservés mais dissociés de cet engagement.`
      : '';
    if (!confirm(`Supprimer l’engagement « ${g.titre} » ?${avertissement}`)) return;
    try {
      await api.engagements.remove(g.id);
      // Cohérence référentielle : on ne laisse jamais de renvoi vers un engagement disparu.
      await Promise.all([
        ...echLiees.map((e) => api.echeances.update(e.id, { engagement_id: null })),
        ...evLiees.map((e) => api.evenements.update(e.id, { engagement_ids: (e.engagement_ids || []).filter((id) => id !== g.id) })),
        ...preLiees.map((p) => api.preuves.update(p.id, { engagement_id: null })),
      ]);
      await logAction(contratId, 'engagement_supprime', 'engagement', g.id, { titre: g.titre, elements_dissocies: nbLies });
      onChange();
      ok(nbLies > 0 ? `Engagement supprimé — ${nbLies} élément(s) dissocié(s).` : 'Engagement supprimé.');
    } catch (e: any) { err(e.message); }
  };

  const liste = useMemo(() => {
    let l = [...engagements];
    if (filtre === 'actifs') l = l.filter((g) => g.statut !== 'realise' && g.statut !== 'annule');
    if (filtre === 'retard') l = l.filter((g) => g.date_echeance && (joursRestants(g.date_echeance) ?? 1) < 0 && g.statut !== 'realise' && g.statut !== 'annule');
    if (filtre === 'realise') l = l.filter((g) => g.statut === 'realise');
    return l.sort((a, b) => {
      const pa = prioritePoids(a.priorite);
      const pb = prioritePoids(b.priorite);
      if (pa !== pb) return pb - pa;
      const da = a.date_echeance ? new Date(a.date_echeance).getTime() : Infinity;
      const db = b.date_echeance ? new Date(b.date_echeance).getTime() : Infinity;
      return da - db;
    });
  }, [engagements, filtre]);

  const nomPartie = (id: number | null) => liens.find((l) => l.partie_id === id)?.partie?.nom || liens.find((l) => l.partie_id === id)?.role;

  const toggle = (id: number) => setOuverts((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="space-y-4">
      {toastEl}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {[{ v: '', l: 'Tous' }, { v: 'actifs', l: 'En cours' }, { v: 'retard', l: 'En retard potentiel' }, { v: 'realise', l: 'Réalisés' }].map((f) => (
            <button key={f.v} onClick={() => setFiltre(f.v)} className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition ${filtre === f.v ? 'bg-fuchsia text-white' : 'bg-white text-muted hover:text-ink'}`}>{f.l}</button>
          ))}
        </div>
        <Btn onClick={() => ouvrir()}><Plus className="h-4 w-4" /> Nouvel engagement</Btn>
      </div>

      {liste.length === 0 ? (
        <Empty icon={<ListChecks className="h-8 w-8" />} titre="Aucun engagement" texte="Transformez chaque promesse du contrat en objet suivi : qui fait quoi, pour qui, quand, où, à quelles conditions, avec quelle preuve." action={<Btn onClick={() => ouvrir()}><Plus className="h-4 w-4" /> Créer le premier</Btn>} />
      ) : (
        <div className="space-y-2.5">
          {liste.map((g) => {
            const ouvert = ouverts.has(g.id);
            const j = joursRestants(g.date_echeance);
            const enRetard = j !== null && j < 0 && g.statut !== 'realise' && g.statut !== 'annule';
            return (
              <div key={g.id} className={`rounded border bg-white transition ${enRetard ? 'border-critique' : 'border-line'}`}>
                <button onClick={() => toggle(g.id)} className="flex w-full cursor-pointer items-center gap-3 p-4 text-left">
                  <StatutIcon statut={g.statut} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{g.titre}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {[g.qui_partie_id ? nomPartie(g.qui_partie_id) : g.qui_texte, g.pour_qui_partie_id ? `→ ${nomPartie(g.pour_qui_partie_id)}` : g.pour_qui_texte ? `→ ${g.pour_qui_texte}` : null, g.date_echeance ? fmtDate(g.date_echeance) : g.quand_texte].filter(Boolean).join(' · ') || 'À compléter'}
                    </p>
                  </div>
                  <PrioriteBadge p={g.priorite} />
                  {g.date_echeance && g.statut !== 'realise' && g.statut !== 'annule' && (
                    <span className={`hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline ${enRetard ? 'bg-critique-soft text-critique' : (j ?? 99) <= 7 ? 'bg-fuchsia-100 text-fuchsia' : 'bg-white text-muted'}`}>
                      {delaiHumain(j)}
                    </span>
                  )}
                  <StatutBadge statut={g.statut} />
                  <ChevronDown className={`h-4 w-4 shrink-0 text-faint transition ${ouvert ? 'rotate-180' : ''}`} />
                </button>
                {ouvert && (
                  <div className="border-t border-line px-4 py-4">
                    <div className="grid gap-2.5 text-sm sm:grid-cols-2">
                      <QA q="QUI ? (débiteur)" a={g.qui_partie_id ? nomPartie(g.qui_partie_id) : g.qui_texte} />
                      <QA q="POUR QUI ? (bénéficiaire)" a={g.pour_qui_partie_id ? nomPartie(g.pour_qui_partie_id) : g.pour_qui_texte} />
                      <QA q="FAIT QUOI ?" a={g.description || g.titre} large />
                      <QA q="QUAND ?" a={[g.quand_texte, g.date_echeance ? fmtDate(g.date_echeance) : null].filter(Boolean).join(' · ')} />
                      <QA q="OÙ ?" a={g.lieu} />
                      <QA q="À QUELLES CONDITIONS ?" a={g.conditions} large />
                      <QA q="QUELLE PREUVE ?" a={g.preuve_attendue} />
                      <QA q="SI NON REMPLI, QUE PRÉVOIT LE CONTRAT ?" a={g.si_non_rempli} />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                      <span className="text-xs text-faint">Marquer :</span>
                      {['a_faire', 'en_cours', 'realise', 'en_retard', 'annule'].map((s) => (
                        <button key={s} onClick={() => changerStatut(g, s)} className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition ${g.statut === s ? 'bg-fuchsia text-white' : 'bg-white text-muted hover:text-ink'}`}>
                          {statutLabel(s)}
                        </button>
                      ))}
                      <span className="ml-auto flex gap-1.5">
                        <button onClick={() => ouvrir(g)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-white"><Pencil className="h-3.5 w-3.5" /> Modifier</button>
                        <button onClick={() => supprimer(g)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-critique hover:bg-critique-soft"><Trash2 className="h-3.5 w-3.5" /> Supprimer</button>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal large titre={edit ? 'Modifier l’engagement' : 'Nouvel engagement'} sousTitre="Un engagement précis se suit, se prouve et se défend." onClose={() => setModal(false)}>
          <div className="space-y-4">
            <Field label="Titre *"><input value={form.titre || ''} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="Ex. : Livrer le site vitrine" className={inputCls} /></Field>
            <Field label="FAIT QUOI ? — description détaillée"><textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Décrivez précisément le contenu attendu" className={inputCls} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="QUI ? — partie débitrice">
                <select value={form.qui_partie_id || ''} onChange={(e) => setForm({ ...form, qui_partie_id: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  <option value="">— Choisir —</option>
                  {liens.map((l) => <option key={l.id} value={l.partie_id}>{l.partie?.nom} ({l.role})</option>)}
                </select>
              </Field>
              <Field label="QUI ? — ou texte libre"><input value={form.qui_texte || ''} onChange={(e) => setForm({ ...form, qui_texte: e.target.value })} placeholder="Ex. : le prestataire" className={inputCls} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="POUR QUI ? — partie bénéficiaire">
                <select value={form.pour_qui_partie_id || ''} onChange={(e) => setForm({ ...form, pour_qui_partie_id: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  <option value="">— Choisir —</option>
                  {liens.map((l) => <option key={l.id} value={l.partie_id}>{l.partie?.nom} ({l.role})</option>)}
                </select>
              </Field>
              <Field label="POUR QUI ? — ou texte libre"><input value={form.pour_qui_texte || ''} onChange={(e) => setForm({ ...form, pour_qui_texte: e.target.value })} placeholder="Ex. : le client" className={inputCls} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="QUAND ? — formulation"><input value={form.quand_texte || ''} onChange={(e) => setForm({ ...form, quand_texte: e.target.value })} placeholder="Ex. : sous 15 jours" className={inputCls} /></Field>
              <Field label="QUAND ? — date"><input type="date" value={form.date_echeance || ''} onChange={(e) => setForm({ ...form, date_echeance: e.target.value })} className={inputCls} /></Field>
              <Field label="OÙ ? — lieu"><input value={form.lieu || ''} onChange={(e) => setForm({ ...form, lieu: e.target.value })} placeholder="Ex. : Lyon / à distance" className={inputCls} /></Field>
            </div>
            <Field label="À QUELLES CONDITIONS ?"><textarea value={form.conditions || ''} onChange={(e) => setForm({ ...form, conditions: e.target.value })} rows={2} placeholder="Modalités, critères de conformité, prérequis…" className={inputCls} /></Field>
            <Field label="QUELLE PREUVE attestera la réalisation ?"><input value={form.preuve_attendue || ''} onChange={(e) => setForm({ ...form, preuve_attendue: e.target.value })} placeholder="Ex. : reçu signé, PV de réception, photos datées…" className={inputCls} /></Field>
            <Field label="SI NON REMPLI — que prévoit le contrat ?"><textarea value={form.si_non_rempli || ''} onChange={(e) => setForm({ ...form, si_non_rempli: e.target.value })} rows={2} placeholder="Ex. : relance écrite, pénalité de…, résolution…" className={inputCls} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Statut">
                <select value={form.statut || 'a_faire'} onChange={(e) => setForm({ ...form, statut: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  {['a_faire', 'en_cours', 'realise', 'en_retard', 'annule'].map((s) => <option key={s} value={s}>{statutLabel(s)}</option>)}
                </select>
              </Field>
              <Field label="Priorité">
                <select value={form.priorite || 'normale'} onChange={(e) => setForm({ ...form, priorite: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  <option value="basse">Basse</option>
                  <option value="normale">Normale</option>
                  <option value="haute">Haute</option>
                  <option value="critique">Critique</option>
                </select>
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(false)}>Annuler</Btn>
              <Btn onClick={sauver} disabled={busy}>{busy ? 'Enregistrement…' : edit ? 'Mettre à jour' : 'Créer l’engagement'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function QA({ q, a, large }: { q: string; a: string | null | undefined; large?: boolean }) {
  return (
    <div className={`card px-3 py-2 ${large ? 'sm:col-span-2' : ''}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-fuchsia-600/60">{q}</p>
      <p className="mt-0.5 text-sm text-ink">{a || <span className="italic text-faint">Non précisé</span>}</p>
    </div>
  );
}

function prioritePoids(p: string | null | undefined): number {
  return p === 'critique' ? 3 : p === 'haute' ? 2 : p === 'normale' ? 1 : 0;
}

export function PrioriteBadge({ p }: { p: string | null | undefined }) {
  if (p === 'critique') return <span className="shrink-0 rounded-full bg-critique-soft px-2 py-0.5 text-[11px] font-bold text-critique">CRITIQUE</span>;
  if (p === 'haute') return <span className="shrink-0 rounded-full bg-fuchsia-100 px-2 py-0.5 text-[11px] font-bold text-fuchsia">HAUTE</span>;
  return null;
}

export function statutLabel(s: string | null | undefined): string {
  const m: Record<string, string> = { a_faire: 'À faire', en_cours: 'En cours', realise: 'Réalisé', en_retard: 'En retard', annule: 'Annulé' };
  return m[s || ''] || s || '—';
}

function StatutBadge({ statut }: { statut: string | null | undefined }) {
  const m: Record<string, string> = {
    a_faire: 'bg-white text-muted', en_cours: 'bg-fuchsia-soft text-attention',
    realise: 'bg-success-soft text-success', en_retard: 'bg-critique-soft text-critique',
    annule: 'bg-line-soft text-faint',
  };
  return <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${m[statut || ''] || m.a_faire}`}>{statutLabel(statut)}</span>;
}

function StatutIcon({ statut }: { statut: string | null | undefined }) {
  if (statut === 'realise') return <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />;
  if (statut === 'en_retard') return <AlertCircle className="h-5 w-5 shrink-0 text-critique" />;
  return <Circle className="h-5 w-5 shrink-0 text-faint" />;
}

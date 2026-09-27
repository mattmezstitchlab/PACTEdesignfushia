import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, History, Paperclip, CalendarClock } from 'lucide-react';
import { api, logAction } from '../../lib/api';
import type { Engagement, Evenement } from '../../lib/types';
import { TYPES_EVENEMENT } from '../../lib/types';
import { fmtDate, typeEvenementLabel } from '../../lib/format';
import { Btn, Empty, Field, Modal, inputCls, useToast } from '../ui';

// Journal des événements : paiement, retard, modification, annulation,
// absence, demande, validation, refus, livraison, réception, incident,
// impossibilité, force majeure déclarée, communication, document, signature…
export default function OngletEvenements({ contratId, evenements, engagements, onChange }: {
  contratId: number;
  evenements: Evenement[];
  engagements: Engagement[];
  onChange: () => void;
}) {
  const { toastEl, ok, err } = useToast();
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Evenement | null>(null);
  const [form, setForm] = useState<any>({});
  const [filtre, setFiltre] = useState('');
  const [engSel, setEngSel] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const ouvrir = (ev?: Evenement) => {
    if (ev) {
      setEdit(ev);
      setForm({
        type: ev.type || 'autre', titre: ev.titre || '', description: ev.description || '',
        date_evenement: (ev.date_evenement || ev.created_at || '').slice(0, 16),
        auteur: ev.auteur || '', statut: ev.statut || 'actif',
      });
      setEngSel(ev.engagement_ids || []);
    } else {
      setEdit(null);
      const now = new Date();
      setForm({ type: 'paiement', titre: '', description: '', date_evenement: now.toISOString().slice(0, 16), auteur: '', statut: 'actif' });
      setEngSel([]);
    }
    setModal(true);
  };

  const sauver = async () => {
    if (!form.titre?.trim()) { err('Le titre est obligatoire.'); return; }
    setBusy(true);
    try {
      const payload = {
        contrat_id: contratId, type: form.type || 'autre', titre: form.titre.trim(),
        description: form.description || null,
        date_evenement: form.date_evenement ? new Date(form.date_evenement).toISOString() : new Date().toISOString(),
        auteur: form.auteur || null, statut: form.statut || 'actif',
        engagement_ids: engSel.length ? engSel : null,
        pieces: edit?.pieces || null,
      };
      if (edit) {
        await api.evenements.update(edit.id, payload);
        await logAction(contratId, 'evenement_modifie', 'evenement', edit.id, { titre: form.titre });
      } else {
        const c = await api.evenements.create(payload);
        await logAction(contratId, 'evenement_cree', 'evenement', c.id, { type: form.type, titre: form.titre });
      }
      setModal(false);
      onChange();
      ok(edit ? 'Événement mis à jour.' : 'Événement enregistré au journal.');
    } catch (e: any) { err(e.message); } finally { setBusy(false); }
  };

  const supprimer = async (ev: Evenement) => {
    if (!confirm(`Supprimer l’événement « ${ev.titre} » ?`)) return;
    try {
      await api.evenements.remove(ev.id);
      await logAction(contratId, 'evenement_supprime', 'evenement', ev.id, { titre: ev.titre });
      onChange();
      ok('Événement supprimé.');
    } catch (e: any) { err(e.message); }
  };

  const liste = useMemo(() => {
    const l = filtre ? evenements.filter((e) => e.type === filtre) : [...evenements];
    return l.sort((a, b) => new Date(b.date_evenement || b.created_at).getTime() - new Date(a.date_evenement || a.created_at).getTime());
  }, [evenements, filtre]);

  const typesPresents = useMemo(() => [...new Set(evenements.map((e) => e.type || 'autre'))], [evenements]);

  return (
    <div className="space-y-4">
      {toastEl}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFiltre('')} className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium ${filtre === '' ? 'bg-fuchsia text-white' : 'bg-white text-muted hover:text-ink'}`}>Tous ({evenements.length})</button>
          {typesPresents.map((t) => (
            <button key={t} onClick={() => setFiltre(filtre === t ? '' : t)} className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium ${filtre === t ? 'bg-fuchsia text-white' : 'bg-white text-muted hover:text-ink'}`}>
              {typeEvenementLabel(t)}
            </button>
          ))}
        </div>
        <Btn onClick={() => ouvrir()}><Plus className="h-4 w-4" /> Enregistrer un événement</Btn>
      </div>

      {liste.length === 0 ? (
        <Empty icon={<History className="h-8 w-8" />} titre="Journal vide" texte="Enregistrez tout ce qui compte : paiements, retards, livraisons, validations, incidents, signatures… Le journal fait le lien entre engagements, échéances et preuves." action={<Btn onClick={() => ouvrir()}><Plus className="h-4 w-4" /> Premier événement</Btn>} />
      ) : (
        <ol className="relative space-y-3 border-l-2 border-line pl-5">
          {liste.map((ev) => (
            <li key={ev.id} className="relative">
              <span className={`absolute -left-[27px] top-4 h-3 w-3 rounded-full ${couleurType(ev.type)}`} />
              <div className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${pastilleType(ev.type)}`}>{typeEvenementLabel(ev.type)}</span>
                      <strong className="font-semibold text-ink">{ev.titre}</strong>
                    </p>
                    <p className="mt-1 text-xs text-faint">
                      {fmtDate(ev.date_evenement || ev.created_at, true)}{ev.auteur ? ` · ${ev.auteur}` : ''}{ev.statut && ev.statut !== 'actif' ? ` · ${ev.statut}` : ''}
                    </p>
                  </div>
                  <span className="flex shrink-0 gap-1">
                    <button onClick={() => ouvrir(ev)} className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-white hover:text-ink"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => supprimer(ev)} className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-critique-soft hover:text-critique"><Trash2 className="h-4 w-4" /></button>
                  </span>
                </div>
                {ev.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{ev.description}</p>}
                {(ev.engagement_ids?.length || ev.pieces?.length) ? (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-line pt-2.5">
                    {(ev.engagement_ids || []).map((id) => {
                      const g = engagements.find((x) => x.id === id);
                      return g ? <span key={id} className="rounded-full bg-fuchsia-soft px-2.5 py-0.5 text-[11px] text-attention">⇄ {g.titre}</span> : null;
                    })}
                    {(ev.pieces || []).map((p, i) => (
                      <a key={i} href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[11px] text-muted hover:text-ink">
                        <Paperclip className="h-3 w-3" /> {p.nom}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}

      {modal && (
        <Modal large titre={edit ? 'Modifier l’événement' : 'Nouvel événement'} sousTitre="Date, auteur, description, engagements liés. Les pièces se versent ensuite dans les Preuves." onClose={() => setModal(false)}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type *">
                <select value={form.type || 'autre'} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  {TYPES_EVENEMENT.map((t) => <option key={t} value={t}>{typeEvenementLabel(t)}</option>)}
                </select>
              </Field>
              <Field label="Date & heure *"><input type="datetime-local" value={form.date_evenement || ''} onChange={(e) => setForm({ ...form, date_evenement: e.target.value })} className={inputCls} /></Field>
            </div>
            <Field label="Titre *"><input value={form.titre || ''} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="Ex. : Réception du 2ᵉ versement — 500 €" className={inputCls} /></Field>
            <Field label="Description détaillée"><textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Faits précis : montants, références, circonstances…" className={inputCls} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Auteur / déclarant"><input value={form.auteur || ''} onChange={(e) => setForm({ ...form, auteur: e.target.value })} placeholder="Ex. : Marie Dupont" className={inputCls} /></Field>
              <Field label="Statut">
                <select value={form.statut || 'actif'} onChange={(e) => setForm({ ...form, statut: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  <option value="actif">Actif</option>
                  <option value="a_verifier">À vérifier</option>
                  <option value="conteste">Contesté</option>
                  <option value="annule">Annulé</option>
                </select>
              </Field>
            </div>
            {engagements.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">Engagements concernés</p>
                <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto rounded-sm border border-line bg-white p-3">
                  {engagements.map((g) => (
                    <button key={g.id} onClick={() => setEngSel((s) => s.includes(g.id) ? s.filter((x) => x !== g.id) : [...s, g.id])}
                      className={`cursor-pointer rounded-full px-3 py-1 text-xs transition ${engSel.includes(g.id) ? 'bg-fuchsia font-semibold text-white' : 'bg-white text-muted hover:bg-white'}`}>
                      {g.titre}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {form.type === 'force_majeure' && (
              <p className="rounded border border-critique bg-critique-soft p-3.5 text-xs leading-relaxed text-critique">
                Vous enregistrez une force majeure DÉCLARÉE par une partie. PACTE ne tranche jamais si elle est juridiquement constituée : conservez toutes les preuves de l’empêchement et consultez rapidement un professionnel.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(false)}>Annuler</Btn>
              <Btn onClick={sauver} disabled={busy}>{busy ? 'Enregistrement…' : edit ? 'Mettre à jour' : 'Enregistrer'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function couleurType(t: string | null | undefined): string {
  if (t === 'paiement' || t === 'validation' || t === 'signature' || t === 'reception') return 'bg-success';
  if (t === 'retard' || t === 'incident' || t === 'refus' || t === 'annulation' || t === 'impossibilite' || t === 'force_majeure') return 'bg-critique';
  if (t === 'modification' || t === 'avenant' || t === 'demande') return 'bg-fuchsia';
  return 'bg-fuchsia';
}

function pastilleType(t: string | null | undefined): string {
  if (t === 'paiement' || t === 'validation' || t === 'signature' || t === 'reception') return 'bg-success-soft text-success';
  if (t === 'retard' || t === 'incident' || t === 'refus' || t === 'annulation' || t === 'impossibilite' || t === 'force_majeure') return 'bg-critique-soft text-critique';
  if (t === 'modification' || t === 'avenant' || t === 'demande') return 'bg-fuchsia-100 text-fuchsia';
  return 'bg-fuchsia-soft text-attention';
}

export function IconEch() { void CalendarClock; return null; }

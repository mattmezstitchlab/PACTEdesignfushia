import { useState } from 'react';
import { Link2, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { api, logActionObjet } from '../../lib/api';
import type { Partie, Relation } from '../../lib/types';
import { TYPES_RELATION } from '../../lib/types';
import { Btn, Empty, Field, Modal, inputCls, useToast } from '../ui';

const LABEL_RELATION: Record<string, string> = {
  propriete: 'Propriété', participation: 'Participation', collaboration: 'Collaboration',
  representation: 'Représentation', prestation: 'Prestation', partenariat: 'Partenariat',
  responsabilite: 'Responsabilité', utilisation: 'Utilisation', licence: 'Licence', autre: 'Autre',
};

// RELATION — ce qui relie une entité (personne/organisation, annuaire
// déjà existant) à cet objet. Le rôle appartient à la relation, jamais
// à l'identité : une même personne peut être artiste dans un projet,
// propriétaire d'une œuvre et prestataire ailleurs, sans être recréée.
export default function OngletRelations({ objetId, relations, annuaire, onChange }: {
  objetId: number;
  relations: Relation[];
  annuaire: Partie[];
  onChange: () => void;
}) {
  const { toastEl, ok, err } = useToast();
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Relation | null>(null);
  const [partieId, setPartieId] = useState<number | ''>('');
  const [form, setForm] = useState<any>({});
  const [busy, setBusy] = useState(false);

  const ouvrir = (r?: Relation) => {
    if (r) {
      setEdit(r);
      setPartieId(r.partie_id || '');
      setForm({ type_relation: r.type_relation || 'autre', role: r.role || '', date_debut: (r.date_debut || '').slice(0, 10), date_fin: (r.date_fin || '').slice(0, 10), statut: r.statut || 'active', notes: r.notes || '' });
    } else {
      setEdit(null);
      setPartieId('');
      setForm({ type_relation: 'autre', role: '', date_debut: '', date_fin: '', statut: 'active', notes: '' });
    }
    setModal(true);
  };

  const sauver = async () => {
    if (!edit && !partieId) { err('Choisissez une entité de l’annuaire (personne ou organisation).'); return; }
    setBusy(true);
    try {
      const payload = {
        objet_id: objetId,
        partie_id: edit ? edit.partie_id : partieId,
        type_relation: form.type_relation || 'autre',
        role: form.role || null,
        date_debut: form.date_debut || null,
        date_fin: form.date_fin || null,
        statut: form.statut || 'active',
        notes: form.notes || null,
      };
      if (edit) {
        await api.relations.update(edit.id, payload);
        await logActionObjet(objetId, 'relation_modifiee', 'relation', edit.id, { role: form.role });
      } else {
        const created = await api.relations.create(payload);
        await logActionObjet(objetId, 'relation_ajoutee', 'relation', created.id, { partie_id: partieId, type_relation: form.type_relation });
      }
      setModal(false);
      onChange();
      ok(edit ? 'Relation mise à jour.' : 'Relation ajoutée.');
    } catch (e: any) { err(e.message); } finally { setBusy(false); }
  };

  const supprimer = async (r: Relation) => {
    if (!confirm(`Retirer « ${r.partie?.nom || 'cette entité'} » de cet objet ? (La fiche annuaire est conservée.)`)) return;
    try {
      await api.relations.remove(r.id);
      await logActionObjet(objetId, 'relation_retiree', 'relation', r.id, { nom: r.partie?.nom });
      onChange();
      ok('Relation retirée.');
    } catch (e: any) { err(e.message); }
  };

  return (
    <div className="space-y-4">
      {toastEl}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Personnes et organisations reliées à cet objet — une identité n’est jamais recréée, seul le rôle change.</p>
        <Btn onClick={() => ouvrir()}><Plus className="h-4 w-4" /> Ajouter une relation</Btn>
      </div>
      {relations.length === 0 ? (
        <Empty icon={<Users className="h-8 w-8" />} titre="Aucune relation" texte="Reliez les personnes ou organisations concernées (propriétaire, participant, prestataire…)." action={<Btn onClick={() => ouvrir()}><Plus className="h-4 w-4" /> Ajouter une relation</Btn>} />
      ) : (
        <div className="space-y-2.5">
          {relations.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 card p-4">
              <span className="avatar">{(r.partie?.nom || '?').slice(0, 2).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                  {r.partie?.nom || 'Entité inconnue'}
                  <span className="rounded-full bg-fuchsia-soft px-2 py-0.5 text-[11px] text-attention">{LABEL_RELATION[r.type_relation] || r.type_relation}</span>
                  {r.statut && r.statut !== 'active' && <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-faint">{r.statut}</span>}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">{r.role || 'Rôle non précisé'}{r.date_debut ? ` · depuis ${r.date_debut.slice(0, 10)}` : ''}</p>
              </div>
              <span className="flex shrink-0 gap-1">
                <button onClick={() => ouvrir(r)} className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-white hover:text-ink"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => supprimer(r)} className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-critique-soft hover:text-critique"><Trash2 className="h-4 w-4" /></button>
              </span>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal titre={edit ? 'Modifier la relation' : 'Ajouter une relation'} sousTitre="Le rôle appartient à la relation, pas à l’identité." onClose={() => setModal(false)}>
          <div className="space-y-3">
            {!edit && (
              <Field label="Entité (annuaire)">
                <select value={partieId} onChange={(e) => setPartieId(e.target.value ? Number(e.target.value) : '')} className={inputCls + ' cursor-pointer'}>
                  <option value="">— Choisir —</option>
                  {annuaire.map((p) => <option key={p.id} value={p.id}>{p.nom}{p.type ? ` (${p.type})` : ''}</option>)}
                </select>
              </Field>
            )}
            <Field label="Type de relation">
              <select value={form.type_relation} onChange={(e) => setForm({ ...form, type_relation: e.target.value })} className={inputCls + ' cursor-pointer'}>
                {TYPES_RELATION.map((t) => <option key={t} value={t}>{LABEL_RELATION[t] || t}</option>)}
              </select>
            </Field>
            <Field label="Rôle"><input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls} placeholder="Ex. : propriétaire, artiste, prestataire…" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Depuis"><input type="date" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} className={inputCls} /></Field>
              <Field label="Jusqu’à"><input type="date" value={form.date_fin} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} className={inputCls} /></Field>
            </div>
            <Field label="Statut">
              <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })} className={inputCls + ' cursor-pointer'}>
                <option value="active">Active</option>
                <option value="suspendue">Suspendue</option>
                <option value="terminee">Terminée</option>
              </select>
            </Field>
            <Field label="Notes"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} rows={2} /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="ghost" onClick={() => setModal(false)}>Annuler</Btn>
              <Btn onClick={sauver} disabled={busy}><Link2 className="h-4 w-4" /> Enregistrer</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, CalendarClock, CheckCircle2 } from 'lucide-react';
import { api, logActionAuto, parentRef } from '../../lib/api';
import type { Echeance, Engagement } from '../../lib/types';
import { fmtDate, fmtMontant, joursRestants, delaiHumain } from '../../lib/format';
import { Btn, Empty, Field, Modal, inputCls, useToast } from '../ui';

// Échéances : paiements, livraisons, validations, renouvellements, fins.
export default function OngletEcheances({ contratId, objetId, echeances, engagements, devise, onChange }: {
  contratId?: number;
  objetId?: number;
  echeances: Echeance[];
  engagements: Engagement[];
  devise: string | null;
  onChange: () => void;
}) {
  const { toastEl, ok, err } = useToast();
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Echeance | null>(null);
  const [form, setForm] = useState<any>({});
  const [busy, setBusy] = useState(false);

  const ouvrir = (e?: Echeance) => {
    if (e) {
      setEdit(e);
      setForm({ titre: e.titre || '', type: e.type || 'autre', date_limite: (e.date_limite || '').slice(0, 10), montant: e.montant ?? '', dev: e.devise || devise || 'EUR', statut: e.statut || 'a_venir', engagement_id: e.engagement_id || '', notes: e.notes || '' });
    } else {
      setEdit(null);
      setForm({ titre: '', type: 'paiement', date_limite: '', montant: '', dev: devise || 'EUR', statut: 'a_venir', engagement_id: '', notes: '' });
    }
    setModal(true);
  };

  const sauver = async () => {
    if (!form.titre?.trim()) { err('Le titre est obligatoire.'); return; }
    setBusy(true);
    try {
      const payload = {
        ...parentRef(contratId, objetId), titre: form.titre.trim(), type: form.type || 'autre',
        date_limite: form.date_limite || null,
        montant: form.montant === '' ? null : Number(String(form.montant).replace(',', '.')) || null,
        devise: form.dev || 'EUR', statut: form.statut || 'a_venir',
        engagement_id: form.engagement_id ? Number(form.engagement_id) : null,
        notes: form.notes || null,
      };
      if (edit) {
        await api.echeances.update(edit.id, payload);
        await logActionAuto(contratId, objetId, 'echeance_modifiee', 'echeance', edit.id, { titre: form.titre });
      } else {
        const c = await api.echeances.create(payload);
        await logActionAuto(contratId, objetId, 'echeance_creee', 'echeance', c.id, { titre: form.titre });
      }
      setModal(false);
      onChange();
      ok(edit ? 'Échéance mise à jour.' : 'Échéance créée.');
    } catch (e: any) { err(e.message); } finally { setBusy(false); }
  };

  const marquer = async (e: Echeance, statut: string) => {
    try {
      await api.echeances.update(e.id, { statut });
      await logActionAuto(contratId, objetId, 'echeance_statut', 'echeance', e.id, { de: e.statut, vers: statut });
      onChange();
    } catch (e2: any) { err(e2.message); }
  };

  const supprimer = async (e: Echeance) => {
    if (!confirm(`Supprimer l’échéance « ${e.titre} » ?`)) return;
    try {
      await api.echeances.remove(e.id);
      await logActionAuto(contratId, objetId, 'echeance_supprimee', 'echeance', e.id, { titre: e.titre });
      onChange();
      ok('Échéance supprimée.');
    } catch (e2: any) { err(e2.message); }
  };

  const { actives, passees } = useMemo(() => {
    const tri = (a: Echeance, b: Echeance) => {
      const da = a.date_limite ? new Date(a.date_limite).getTime() : Infinity;
      const db = b.date_limite ? new Date(b.date_limite).getTime() : Infinity;
      return da - db;
    };
    return {
      actives: echeances.filter((e) => e.statut !== 'realisee' && e.statut !== 'annulee').sort(tri),
      passees: echeances.filter((e) => e.statut === 'realisee' || e.statut === 'annulee').sort(tri),
    };
  }, [echeances]);

  const totalAttendu = useMemo(() => actives.filter((e) => e.type === 'paiement' && e.montant).reduce((s, e) => s + (e.montant || 0), 0), [actives]);

  return (
    <div className="space-y-4">
      {toastEl}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          {actives.length} échéance(s) à venir
          {totalAttendu > 0 && <> · paiements attendus : <strong className="text-ink">{fmtMontant(totalAttendu, devise || 'EUR')}</strong> (indicatif)</>}
        </p>
        <Btn onClick={() => ouvrir()}><Plus className="h-4 w-4" /> Nouvelle échéance</Btn>
      </div>

      {echeances.length === 0 ? (
        <Empty icon={<CalendarClock className="h-8 w-8" />} titre="Aucune échéance" texte="Ajoutez les dates qui comptent : paiements, livraisons, validations, renouvellement, fin. Le moteur de cohérence les surveillera." action={<Btn onClick={() => ouvrir()}><Plus className="h-4 w-4" /> Créer la première</Btn>} />
      ) : (
        <>
          <div className="space-y-2.5">
            {actives.map((e) => (
              <LigneEcheance key={e.id} e={e} engagements={engagements}
                onEdit={() => ouvrir(e)} onDelete={() => supprimer(e)} onMarquer={(s) => marquer(e, s)} />
            ))}
          </div>
          {passees.length > 0 && (
            <details className="card p-4">
              <summary className="cursor-pointer text-sm font-medium text-muted">Réalisées / annulées ({passees.length})</summary>
              <div className="mt-3 space-y-2.5">
                {passees.map((e) => (
                  <LigneEcheance key={e.id} e={e} engagements={engagements} terminee
                    onEdit={() => ouvrir(e)} onDelete={() => supprimer(e)} onMarquer={(s) => marquer(e, s)} />
                ))}
              </div>
            </details>
          )}
        </>
      )}

      {modal && (
        <Modal titre={edit ? 'Modifier l’échéance' : 'Nouvelle échéance'} onClose={() => setModal(false)}>
          <div className="space-y-4">
            <Field label="Titre *"><input value={form.titre || ''} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="Ex. : 3ᵉ mensualité — 200 €" className={inputCls} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type">
                <select value={form.type || 'autre'} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  <option value="paiement">Paiement</option>
                  <option value="livraison">Livraison</option>
                  <option value="validation">Validation</option>
                  <option value="renouvellement">Renouvellement</option>
                  <option value="fin">Fin / terme</option>
                  <option value="autre">Autre jalon</option>
                </select>
              </Field>
              <Field label="Date limite"><input type="date" value={form.date_limite || ''} onChange={(e) => setForm({ ...form, date_limite: e.target.value })} className={inputCls} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Montant (optionnel)"><input value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} inputMode="decimal" placeholder="Ex. : 200" className={inputCls} /></Field>
              <Field label="Devise"><input value={form.dev || ''} onChange={(e) => setForm({ ...form, dev: e.target.value })} className={inputCls} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Engagement lié">
                <select value={form.engagement_id || ''} onChange={(e) => setForm({ ...form, engagement_id: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  <option value="">— Aucun —</option>
                  {engagements.map((g) => <option key={g.id} value={g.id}>{g.titre}</option>)}
                </select>
              </Field>
              <Field label="Statut">
                <select value={form.statut || 'a_venir'} onChange={(e) => setForm({ ...form, statut: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  <option value="a_venir">À venir</option>
                  <option value="proche">Proche</option>
                  <option value="en_retard">En retard</option>
                  <option value="realisee">Réalisée</option>
                  <option value="annulee">Annulée</option>
                </select>
              </Field>
            </div>
            <Field label="Notes"><textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Modalités, références…" className={inputCls} /></Field>
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(false)}>Annuler</Btn>
              <Btn onClick={sauver} disabled={busy}>{busy ? 'Enregistrement…' : edit ? 'Mettre à jour' : 'Créer l’échéance'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function LigneEcheance({ e, engagements, terminee, onEdit, onDelete, onMarquer }: {
  e: Echeance; engagements: Engagement[]; terminee?: boolean;
  onEdit: () => void; onDelete: () => void; onMarquer: (s: string) => void;
}) {
  const j = joursRestants(e.date_limite);
  const enRetard = j !== null && j < 0 && !terminee;
  const g = engagements.find((x) => x.id === e.engagement_id);
  return (
    <div className={`flex flex-wrap items-center gap-3 rounded border p-4 ${enRetard ? 'border-critique bg-critique-soft' : 'border-line bg-white'} ${terminee ? 'opacity-60' : ''}`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-sm ${terminee ? 'bg-white text-faint' : enRetard ? 'bg-critique-soft text-critique' : 'bg-fuchsia-100 text-fuchsia'}`}>
        {terminee ? <CheckCircle2 className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{e.titre}</p>
        <p className="mt-0.5 text-xs text-muted">
          {typeLabel(e.type)}{e.date_limite ? ` · ${fmtDate(e.date_limite)}` : ''}{e.montant ? ` · ${fmtMontant(e.montant, e.devise || 'EUR')}` : ''}{g ? ` · ⇄ ${g.titre}` : ''}
        </p>
      </div>
      {!terminee && j !== null && (
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${enRetard ? 'bg-critique-soft text-critique' : j <= 7 ? 'bg-fuchsia-100 text-fuchsia' : 'bg-white text-muted'}`}>
          {delaiHumain(j)}
        </span>
      )}
      {terminee && <span className="text-xs text-faint">{e.statut === 'realisee' ? 'Réalisée' : 'Annulée'}</span>}
      <span className="flex shrink-0 gap-1">
        {!terminee && (
          <button onClick={() => onMarquer('realisee')} title="Marquer réalisée" className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium text-success hover:bg-success-soft">Réalisée</button>
        )}
        <button onClick={onEdit} className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-white hover:text-ink"><Pencil className="h-4 w-4" /></button>
        <button onClick={onDelete} className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-critique-soft hover:text-critique"><Trash2 className="h-4 w-4" /></button>
      </span>
    </div>
  );
}

function typeLabel(t: string | null | undefined): string {
  const m: Record<string, string> = { paiement: 'Paiement', livraison: 'Livraison', validation: 'Validation', renouvellement: 'Renouvellement', fin: 'Fin / terme', autre: 'Jalon' };
  return m[t || ''] || t || 'Jalon';
}

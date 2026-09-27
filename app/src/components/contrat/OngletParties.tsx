import { useState } from 'react';
import { Pencil, Plus, Trash2, User, Building2, Phone, Mail, MapPin, FileBadge, Briefcase, StickyNote } from 'lucide-react';
import { api, logAction } from '../../lib/api';
import type { ContratPartie, Partie } from '../../lib/types';
import { initiales } from '../../lib/format';
import { Btn, Empty, Field, Modal, inputCls, useToast } from '../ui';

// Fiche partie : IDENTITÉ / RÔLE / RELATION / ENGAGEMENT
export default function OngletParties({ contratId, liens, annuaire, onChange }: {
  contratId: number;
  liens: ContratPartie[];
  annuaire: Partie[];
  onChange: () => void;
}) {
  const { toastEl, ok, err } = useToast();
  const [modalLien, setModalLien] = useState(false);
  const [modalFiche, setModalFiche] = useState<Partie | null>(null);
  const [editLien, setEditLien] = useState<ContratPartie | null>(null);
  const [form, setForm] = useState<any>({});
  const [partieId, setPartieId] = useState<number | ''>('');
  const [fiche, setFiche] = useState<any>({});
  const [busy, setBusy] = useState(false);

  const ouvrirLien = (l?: ContratPartie) => {
    if (l) {
      setEditLien(l);
      setForm({ role: l.role || '', qualite: l.qualite || '', relation: l.relation || '', engagement_resume: l.engagement_resume || '', signature_statut: l.signature_statut || 'non_signee', signature_date: (l.signature_date || '').slice(0, 10) });
    } else {
      setEditLien(null);
      setForm({ role: '', qualite: '', relation: '', engagement_resume: '', signature_statut: 'non_signee', signature_date: '' });
      setPartieId('');
    }
    setModalLien(true);
  };

  const sauverLien = async () => {
    if (!editLien && !partieId) { err('Choisissez une partie de l’annuaire.'); return; }
    setBusy(true);
    try {
      const payload = {
        contrat_id: contratId,
        partie_id: editLien ? editLien.partie_id : partieId,
        role: form.role || null, qualite: form.qualite || null,
        relation: form.relation || null, engagement_resume: form.engagement_resume || null,
        signature_statut: form.signature_statut || 'non_signee',
        signature_date: form.signature_date || null,
      };
      if (editLien) {
        await api.contratParties.update(editLien.id, payload);
        await logAction(contratId, 'partie_modifiee', 'contrat_partie', editLien.id, { role: form.role });
      } else {
        const created = await api.contratParties.create(payload);
        await logAction(contratId, 'partie_rattachee', 'contrat_partie', created.id, { partie_id: partieId });
      }
      setModalLien(false);
      onChange();
      ok(editLien ? 'Lien mis à jour.' : 'Partie rattachée au contrat.');
    } catch (e: any) { err(e.message); } finally { setBusy(false); }
  };

  const detacher = async (l: ContratPartie) => {
    if (!confirm(`Détacher « ${l.partie?.nom} » de ce contrat ? (La fiche annuaire est conservée.)`)) return;
    try {
      await api.contratParties.remove(l.id);
      await logAction(contratId, 'partie_detachee', 'contrat_partie', l.id, { nom: l.partie?.nom });
      onChange();
      ok('Partie détachée.');
    } catch (e: any) { err(e.message); }
  };

  const ouvrirFiche = (p: Partie) => {
    setFiche({
      nom: p.nom || '', type: p.type || 'personne_physique', role_defaut: p.role_defaut || '',
      email: p.email || '', telephone: p.telephone || '', adresse: p.adresse || '',
      ville: p.ville || '', pays: p.pays || '', identifiant_national: p.identifiant_national || '',
      statut_professionnel: p.statut_professionnel || '', representant_nom: p.representant_nom || '',
      representant_qualite: p.representant_qualite || '', notes: p.notes || '',
    });
    setModalFiche(p);
  };

  const sauverFiche = async () => {
    if (!modalFiche || !fiche.nom.trim()) { err('Le nom est obligatoire.'); return; }
    setBusy(true);
    try {
      const payload = { ...fiche };
      for (const k of Object.keys(payload)) if (payload[k] === '') payload[k] = null;
      await api.parties.update(modalFiche.id, payload);
      await logAction(contratId, 'fiche_partie_modifiee', 'partie', modalFiche.id, { nom: fiche.nom });
      setModalFiche(null);
      onChange();
      ok('Fiche partie mise à jour.');
    } catch (e: any) { err(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      {toastEl}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          {liens.length} partie(s) rattachée(s) · Chaque fiche sépare <strong className="text-ink">IDENTITÉ / RÔLE / RELATION / ENGAGEMENT</strong>.
          Une personne peut participer à plusieurs contrats.
        </p>
        <Btn onClick={() => ouvrirLien()}><Plus className="h-4 w-4" /> Rattacher une partie</Btn>
      </div>

      {liens.length === 0 ? (
        <Empty icon={<User className="h-8 w-8" />} titre="Aucune partie rattachée" texte="Rattachez les signataires depuis l’annuaire. Un contrat suppose en principe au moins deux parties." action={<Btn onClick={() => ouvrirLien()}><Plus className="h-4 w-4" /> Rattacher</Btn>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {liens.map((l) => (
            <div key={l.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="avatar" style={{ width: 44, height: 44, fontSize: 14 }}>
                    {initiales(l.partie?.nom)}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{l.partie?.nom}</p>
                    <p className="text-xs text-muted">{l.role || 'Rôle à préciser'}{l.qualite ? ` · ${l.qualite}` : ''}</p>
                  </div>
                </div>
                <SignatureBadge statut={l.signature_statut} />
              </div>

              <div className="mt-4 grid gap-2 text-sm">
                <BlocMini titre="RÔLE" texte={l.role || '—'} sub={l.qualite || undefined} />
                <BlocMini titre="RELATION" texte={l.relation || 'Non décrite'} />
                <BlocMini titre="ENGAGEMENT" texte={l.engagement_resume || 'Non résumé'} />
              </div>

              {(l.partie?.email || l.partie?.telephone || l.partie?.ville) && (
                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
                  {l.partie.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {l.partie.email}</span>}
                  {l.partie.telephone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {l.partie.telephone}</span>}
                  {l.partie.ville && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {l.partie.ville}</span>}
                </p>
              )}

              <div className="mt-4 flex gap-2 border-t border-line pt-3">
                {l.partie && (
                  <button onClick={() => ouvrirFiche(l.partie!)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-attention hover:bg-fuchsia-soft">
                    {l.partie.type === 'personne_morale' ? <Building2 className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />} Fiche identité
                  </button>
                )}
                <button onClick={() => ouvrirLien(l)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-white">
                  <Pencil className="h-3.5 w-3.5" /> Rôle / signature
                </button>
                <button onClick={() => detacher(l)} className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-critique hover:bg-critique-soft">
                  <Trash2 className="h-3.5 w-3.5" /> Détacher
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal rattachement / rôle */}
      {modalLien && (
        <Modal titre={editLien ? `Rôle de ${editLien.partie?.nom}` : 'Rattacher une partie'} sousTitre="RÔLE / RELATION / ENGAGEMENT — la fiche identité se gère séparément." onClose={() => setModalLien(false)}>
          <div className="space-y-4">
            {!editLien && (
              <Field label="Partie (annuaire)">
                <select value={partieId} onChange={(e) => setPartieId(Number(e.target.value) || '')} className={inputCls + ' cursor-pointer'}>
                  <option value="">— Choisir —</option>
                  {annuaire.filter((p) => !liens.some((l) => l.partie_id === p.id)).map((p) => (
                    <option key={p.id} value={p.id}>{p.nom}{p.ville ? ` — ${p.ville}` : ''}</option>
                  ))}
                </select>
              </Field>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Rôle dans ce contrat"><input value={form.role || ''} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Ex. : Client, Prestataire, Bailleur…" className={inputCls} /></Field>
              <Field label="Qualité"><input value={form.qualite || ''} onChange={(e) => setForm({ ...form, qualite: e.target.value })} placeholder="Ex. : Donneur d’ordre, Gérant…" className={inputCls} /></Field>
            </div>
            <Field label="Relation avec les autres parties"><input value={form.relation || ''} onChange={(e) => setForm({ ...form, relation: e.target.value })} placeholder="Ex. : frère du prêteur, filiale de…, conjoint de…" className={inputCls} /></Field>
            <Field label="Résumé de son engagement"><textarea value={form.engagement_resume || ''} onChange={(e) => setForm({ ...form, engagement_resume: e.target.value })} rows={2} placeholder="Ex. : rembourse 200 €/mois pendant 10 mois" className={inputCls} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Signature">
                <select value={form.signature_statut || 'non_signee'} onChange={(e) => setForm({ ...form, signature_statut: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  <option value="non_signee">Non signée</option>
                  <option value="signee">Signée</option>
                  <option value="refusee">Refusée</option>
                </select>
              </Field>
              <Field label="Date de signature"><input type="date" value={form.signature_date || ''} onChange={(e) => setForm({ ...form, signature_date: e.target.value })} className={inputCls} /></Field>
            </div>
            <p className="field-hint">Ce statut est une déclaration interne à PACTE, horodatée et tracée dans l’historique — ce n’est pas une signature électronique légalement qualifiée au sens du règlement eIDAS.</p>
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModalLien(false)}>Annuler</Btn>
              <Btn onClick={sauverLien} disabled={busy}>{busy ? 'Enregistrement…' : editLien ? 'Mettre à jour' : 'Rattacher'}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal fiche identité */}
      {modalFiche && (
        <Modal large titre={`Fiche identité — ${modalFiche.nom}`} sousTitre="IDENTITÉ — partagée entre tous les contrats de cette personne." onClose={() => setModalFiche(null)}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom complet / raison sociale *"><input value={fiche.nom || ''} onChange={(e) => setFiche({ ...fiche, nom: e.target.value })} className={inputCls} /></Field>
              <Field label="Type">
                <select value={fiche.type || 'personne_physique'} onChange={(e) => setFiche({ ...fiche, type: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  <option value="personne_physique">Personne physique</option>
                  <option value="personne_morale">Personne morale</option>
                </select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="E-mail"><input value={fiche.email || ''} onChange={(e) => setFiche({ ...fiche, email: e.target.value })} placeholder="nom@exemple.fr" className={inputCls} /></Field>
              <Field label="Téléphone"><input value={fiche.telephone || ''} onChange={(e) => setFiche({ ...fiche, telephone: e.target.value })} placeholder="+33 …" className={inputCls} /></Field>
            </div>
            <Field label="Adresse"><input value={fiche.adresse || ''} onChange={(e) => setFiche({ ...fiche, adresse: e.target.value })} placeholder="N°, rue…" className={inputCls} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Ville"><input value={fiche.ville || ''} onChange={(e) => setFiche({ ...fiche, ville: e.target.value })} className={inputCls} /></Field>
              <Field label="Pays"><input value={fiche.pays || ''} onChange={(e) => setFiche({ ...fiche, pays: e.target.value })} className={inputCls} /></Field>
              <Field label="Identifiant national"><input value={fiche.identifiant_national || ''} onChange={(e) => setFiche({ ...fiche, identifiant_national: e.target.value })} placeholder="SIRET, NIF, CNI…" className={inputCls} /></Field>
            </div>
            <Field label="Statut professionnel"><input value={fiche.statut_professionnel || ''} onChange={(e) => setFiche({ ...fiche, statut_professionnel: e.target.value })} placeholder="Ex. : auto-entrepreneur, salarié, gérant…" className={inputCls} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Représentant (nom)"><input value={fiche.representant_nom || ''} onChange={(e) => setFiche({ ...fiche, representant_nom: e.target.value })} placeholder="Si personne morale" className={inputCls} /></Field>
              <Field label="Représentant (qualité)"><input value={fiche.representant_qualite || ''} onChange={(e) => setFiche({ ...fiche, representant_qualite: e.target.value })} placeholder="Ex. : Président, Gérant…" className={inputCls} /></Field>
            </div>
            <Field label="Notes"><textarea value={fiche.notes || ''} onChange={(e) => setFiche({ ...fiche, notes: e.target.value })} rows={2} className={inputCls} /></Field>
            <div className="flex items-center gap-4 text-xs text-faint">
              <span className="inline-flex items-center gap-1"><FileBadge className="h-3.5 w-3.5" /> Identité vérifiable</span>
              <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> Statut pro si pertinent</span>
              <span className="inline-flex items-center gap-1"><StickyNote className="h-3.5 w-3.5" /> Notes internes</span>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModalFiche(null)}>Annuler</Btn>
              <Btn onClick={sauverFiche} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer la fiche'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function BlocMini({ titre, texte, sub }: { titre: string; texte: string; sub?: string }) {
  return (
    <div className="card px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">{titre}</p>
      <p className="mt-0.5 text-sm text-ink">{texte}{sub ? <span className="text-muted"> — {sub}</span> : null}</p>
    </div>
  );
}

export function SignatureBadge({ statut }: { statut: string | null | undefined }) {
  if (statut === 'signee') return <span className="shrink-0 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">Signée</span>;
  if (statut === 'refusee') return <span className="shrink-0 rounded-full bg-critique-soft px-2.5 py-1 text-xs font-semibold text-critique">Refusée</span>;
  return <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-muted">Non signée</span>;
}

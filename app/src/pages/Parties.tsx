import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Pencil, Trash2, Search, FileText, User, Building2 } from 'lucide-react';
import { api } from '../lib/api';
import type { ContratPartie, Partie } from '../lib/types';
import { Spinner, Btn, Empty, Field, Modal, inputCls, useToast } from '../components/ui';

// Annuaire global : une personne peut participer à plusieurs contrats.
export default function Parties() {
  const [parties, setParties] = useState<Partie[]>([]);
  const [liens, setLiens] = useState<ContratPartie[]>([]);
  const [contrats, setContrats] = useState<{ id: number; titre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Partie | null>(null);
  const [form, setForm] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const { toastEl, ok, err } = useToast();

  const charger = async () => {
    try {
      const [ps, cps, cs] = await Promise.all([api.parties.list(), api.contratParties.list(), api.contrats.list()]);
      setParties(ps);
      setLiens(cps);
      setContrats(cs.map((c) => ({ id: c.id, titre: c.titre })));
    } catch (e: any) {
      err(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ouvrir = (p?: Partie) => {
    if (p) {
      setEdit(p);
      setForm({ ...p });
    } else {
      setEdit(null);
      setForm({ nom: '', type: 'personne_physique', role_defaut: '', email: '', telephone: '', adresse: '', ville: '', pays: '', identifiant_national: '', statut_professionnel: '', representant_nom: '', representant_qualite: '', notes: '' });
    }
    setModal(true);
  };

  const sauver = async () => {
    if (!form.nom?.trim()) { err('Le nom est obligatoire.'); return; }
    setBusy(true);
    try {
      const payload = { ...form };
      for (const k of Object.keys(payload)) if (payload[k] === '') payload[k] = null;
      delete payload.id;
      delete payload.created_at;
      if (edit) await api.parties.update(edit.id, payload);
      else await api.parties.create(payload);
      setModal(false);
      charger();
      ok(edit ? 'Fiche mise à jour.' : 'Partie ajoutée à l’annuaire.');
    } catch (e: any) { err(e.message); } finally { setBusy(false); }
  };

  const supprimer = async (p: Partie) => {
    const usages = liens.filter((l) => l.partie_id === p.id);
    if (usages.length > 0) {
      err(`Impossible : cette partie est rattachée à ${usages.length} contrat(s). Détachez-la d’abord.`);
      return;
    }
    if (!confirm(`Supprimer « ${p.nom} » de l’annuaire ?`)) return;
    try {
      await api.parties.remove(p.id);
      charger();
      ok('Partie supprimée.');
    } catch (e: any) { err(e.message); }
  };

  const liste = parties.filter((p) => {
    if (!q.trim()) return true;
    return `${p.nom} ${p.email || ''} ${p.ville || ''} ${p.statut_professionnel || ''}`.toLowerCase().includes(q.trim().toLowerCase());
  });

  if (loading) return <Spinner label="Chargement de l’annuaire…" />;

  return (
    <div className="space-y-5">
      {toastEl}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Annuaire des parties</h1>
          <p className="mt-1 text-sm text-muted">{parties.length} fiche(s) · une personne peut participer à plusieurs contrats.</p>
        </div>
        <Btn onClick={() => ouvrir()}><Plus className="h-4 w-4" /> Nouvelle partie</Btn>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (nom, e-mail, ville, statut…)" className={`${inputCls} pl-10`} />
      </div>

      {liste.length === 0 ? (
        <Empty icon={<Users className="h-8 w-8" />} titre="Annuaire vide" texte="Créez des fiches parties réutilisables dans tous vos contrats : identité, coordonnées, statut professionnel, représentant." action={<Btn onClick={() => ouvrir()}><Plus className="h-4 w-4" /> Créer une fiche</Btn>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {liste.map((p) => {
            const usages = liens.filter((l) => l.partie_id === p.id);
            return (
              <div key={p.id} className="card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded bg-white text-muted">
                      {p.type === 'personne_morale' ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </span>
                    <div>
                      <p className="font-semibold text-ink">{p.nom}</p>
                      <p className="text-xs text-muted">
                        {p.type === 'personne_morale' ? 'Personne morale' : 'Personne physique'}
                        {p.statut_professionnel ? ` · ${p.statut_professionnel}` : ''}
                        {p.ville ? ` · ${p.ville}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="flex gap-1">
                    <button onClick={() => ouvrir(p)} className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-white hover:text-ink"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => supprimer(p)} className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-critique-soft hover:text-critique"><Trash2 className="h-4 w-4" /></button>
                  </span>
                </div>
                {(p.email || p.telephone || p.representant_nom) && (
                  <p className="mt-2 text-xs text-faint">
                    {[p.email, p.telephone, p.representant_nom ? `Rep. : ${p.representant_nom}` : null].filter(Boolean).join(' · ')}
                  </p>
                )}
                <div className="mt-3 border-t border-line pt-3">
                  {usages.length === 0 ? (
                    <p className="text-xs italic text-faint">Aucun contrat rattaché pour l’instant.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {usages.map((u) => (
                        <Link key={u.id} to={`/contrats/${u.contrat_id}?onglet=parties`} className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs text-muted hover:bg-white hover:text-ink">
                          <FileText className="h-3 w-3" /> {contrats.find((c) => c.id === u.contrat_id)?.titre || `#${u.contrat_id}`}{u.role ? ` · ${u.role}` : ''}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal large titre={edit ? `Modifier — ${edit.nom}` : 'Nouvelle partie'} sousTitre="Fiche identité réutilisable dans plusieurs contrats." onClose={() => setModal(false)}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom complet / raison sociale *"><input value={form.nom || ''} onChange={(e) => setForm({ ...form, nom: e.target.value })} className={inputCls} /></Field>
              <Field label="Type">
                <select value={form.type || 'personne_physique'} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  <option value="personne_physique">Personne physique</option>
                  <option value="personne_morale">Personne morale</option>
                </select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="E-mail"><input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></Field>
              <Field label="Téléphone"><input value={form.telephone || ''} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className={inputCls} /></Field>
            </div>
            <Field label="Adresse"><input value={form.adresse || ''} onChange={(e) => setForm({ ...form, adresse: e.target.value })} className={inputCls} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Ville"><input value={form.ville || ''} onChange={(e) => setForm({ ...form, ville: e.target.value })} className={inputCls} /></Field>
              <Field label="Pays"><input value={form.pays || ''} onChange={(e) => setForm({ ...form, pays: e.target.value })} className={inputCls} /></Field>
              <Field label="Identifiant national"><input value={form.identifiant_national || ''} onChange={(e) => setForm({ ...form, identifiant_national: e.target.value })} placeholder="SIRET, NIF, CNI…" className={inputCls} /></Field>
            </div>
            <Field label="Rôle par défaut"><input value={form.role_defaut || ''} onChange={(e) => setForm({ ...form, role_defaut: e.target.value })} placeholder="Ex. : Client" className={inputCls} /></Field>
            <Field label="Statut professionnel"><input value={form.statut_professionnel || ''} onChange={(e) => setForm({ ...form, statut_professionnel: e.target.value })} className={inputCls} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Représentant (nom)"><input value={form.representant_nom || ''} onChange={(e) => setForm({ ...form, representant_nom: e.target.value })} className={inputCls} /></Field>
              <Field label="Représentant (qualité)"><input value={form.representant_qualite || ''} onChange={(e) => setForm({ ...form, representant_qualite: e.target.value })} className={inputCls} /></Field>
            </div>
            <Field label="Notes"><textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputCls} /></Field>
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(false)}>Annuler</Btn>
              <Btn onClick={sauver} disabled={busy}>{busy ? 'Enregistrement…' : edit ? 'Mettre à jour' : 'Ajouter à l’annuaire'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Boxes } from 'lucide-react';
import { api, logActionObjet } from '../lib/api';
import { UNIVERS, universParCode } from '../lib/univers';
import { Btn, Field, Prudence, inputCls, useToast } from '../components/ui';

// Création d'un objet suivi : même moteur que le contrat, une fiche
// plus légère. L'univers ne configure que des libellés et suggestions
// de type — jamais l'architecture des données.
export default function NouvelObjet() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { toastEl, err } = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    univers: params.get('univers') || 'projets',
    type_objet: '', titre: '', description: '', statut: 'brouillon',
    pays: '', droit_applicable: '', devise: 'EUR', valeur_declaree: '',
    date_debut: '', date_fin: '', notes: '',
  });

  const u = useMemo(() => universParCode(form.univers), [form.univers]);

  const creer = async () => {
    if (!form.titre.trim()) { err('Donnez un titre à cet objet.'); return; }
    if (!form.type_objet) { err('Choisissez un type d’objet.'); return; }
    setBusy(true);
    try {
      const created = await api.objets.create({
        univers: form.univers, type_objet: form.type_objet, titre: form.titre.trim(),
        description: form.description || null, statut: form.statut,
        pays: form.pays || null, droit_applicable: form.droit_applicable || null,
        devise: form.devise || null, valeur_declaree: form.valeur_declaree !== '' ? Number(form.valeur_declaree) : null,
        date_debut: form.date_debut || null, date_fin: form.date_fin || null, notes: form.notes || null,
        sante: 'saine',
      });
      await logActionObjet(created.id, 'objet_cree', 'objet', created.id, { titre: form.titre, univers: form.univers, type_objet: form.type_objet });
      nav(`/objets/${created.id}`);
    } catch (e: any) { err(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <button onClick={() => nav('/objets')} className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Retour aux objets</button>

      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink sm:text-3xl"><Boxes className="h-6 w-6 text-fuchsia" /> Nouvel objet suivi</h1>
        <p className="mt-1 text-sm text-muted">Un projet, une œuvre, un actif, un bien, une mission, un dossier… — PACTE le suit avec les mêmes briques qu’un contrat : relations, engagements, échéances, événements, preuves, données, alertes, scénarios, décisions.</p>
      </div>

      <Prudence compact />

      <div className="card space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Univers">
            <select value={form.univers} onChange={(e) => setForm({ ...form, univers: e.target.value, type_objet: '' })} className={inputCls + ' cursor-pointer'}>
              {UNIVERS.map((uu) => <option key={uu.code} value={uu.code}>{uu.nom}</option>)}
            </select>
          </Field>
          <Field label="Type d’objet">
            <select value={form.type_objet} onChange={(e) => setForm({ ...form, type_objet: e.target.value })} className={inputCls + ' cursor-pointer'}>
              <option value="">— Choisir —</option>
              {u?.typesObjets.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
            </select>
          </Field>
        </div>
        {u && <p className="rounded-sm bg-fuchsia-50 p-3 text-xs text-fuchsia-700">{u.description}{u.vigilance[0] ? ` — ${u.vigilance[0]}` : ''}</p>}

        <Field label="Titre *"><input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} className={inputCls} placeholder="Ex. : Exposition itinérante 2027, Appartement rue de Paris, Application mobile…" /></Field>
        <Field label="Description"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputCls} /></Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pays"><input value={form.pays} onChange={(e) => setForm({ ...form, pays: e.target.value })} className={inputCls} placeholder="Ex. : France" /></Field>
          <Field label="Droit applicable" hint="Ne présumez rien : à préciser si connu."><input value={form.droit_applicable} onChange={(e) => setForm({ ...form, droit_applicable: e.target.value })} className={inputCls} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valeur déclarée"><input type="number" step="any" value={form.valeur_declaree} onChange={(e) => setForm({ ...form, valeur_declaree: e.target.value })} className={inputCls} /></Field>
          <Field label="Devise"><input value={form.devise} onChange={(e) => setForm({ ...form, devise: e.target.value })} className={inputCls} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date de début"><input type="date" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} className={inputCls} /></Field>
          <Field label="Date de fin (si connue)"><input type="date" value={form.date_fin} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} className={inputCls} /></Field>
        </div>
        <Field label="Notes"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputCls} /></Field>

        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="ghost" onClick={() => nav('/objets')}>Annuler</Btn>
          <Btn onClick={creer} disabled={busy}>{busy ? 'Création…' : 'Créer l’objet'}</Btn>
        </div>
      </div>
    </div>
  );
}

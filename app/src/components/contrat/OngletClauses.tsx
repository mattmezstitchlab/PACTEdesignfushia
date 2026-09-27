import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, BookOpen, AlertTriangle } from 'lucide-react';
import { api, logAction } from '../../lib/api';
import type { Clause } from '../../lib/types';
import { CATEGORIES_CLAUSES } from '../../lib/types';
import { Btn, Empty, Field, Modal, inputCls, useToast } from '../ui';

// Structure universelle : PARTIES, OBJET, ENGAGEMENTS, OBLIGATIONS, DROITS,
// CONDITIONS, ÉCHÉANCES, PRIX/PAIEMENTS, LIVRABLES, VALIDATIONS, ANNULATION,
// MODIFICATION, RÉSILIATION, RESPONSABILITÉS, ÉVÉNEMENTS EXCEPTIONNELS,
// PREUVES, SIGNATURES, HISTORIQUE.
export default function OngletClauses({ contratId, clauses, onChange }: {
  contratId: number;
  clauses: Clause[];
  onChange: () => void;
}) {
  const { toastEl, ok, err } = useToast();
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Clause | null>(null);
  const [form, setForm] = useState<any>({});
  const [catFiltre, setCatFiltre] = useState('');
  const [busy, setBusy] = useState(false);

  const ouvrir = (c?: Clause) => {
    if (c) {
      setEdit(c);
      setForm({ categorie: c.categorie || 'DIVERS', titre: c.titre || '', contenu: c.contenu || '', statut: c.statut || 'active', incertitude: c.incertitude || '' });
    } else {
      setEdit(null);
      setForm({ categorie: catFiltre || 'DIVERS', titre: '', contenu: '', statut: 'active', incertitude: '' });
    }
    setModal(true);
  };

  const sauver = async () => {
    if (!form.titre?.trim() || !form.contenu?.trim()) { err('Titre et contenu sont obligatoires.'); return; }
    setBusy(true);
    try {
      const payload = {
        contrat_id: contratId, categorie: form.categorie || 'DIVERS',
        titre: form.titre.trim(), contenu: form.contenu.trim(),
        statut: form.statut || 'active', incertitude: form.incertitude || null,
        ordre: edit?.ordre ?? (clauses.length + 1),
      };
      if (edit) {
        await api.clauses.update(edit.id, payload);
        await logAction(contratId, 'clause_modifiee', 'clause', edit.id, { titre: form.titre });
      } else {
        const c = await api.clauses.create(payload);
        await logAction(contratId, 'clause_creee', 'clause', c.id, { titre: form.titre });
      }
      setModal(false);
      onChange();
      ok(edit ? 'Clause mise à jour.' : 'Clause ajoutée à la structure.');
    } catch (e: any) { err(e.message); } finally { setBusy(false); }
  };

  const supprimer = async (c: Clause) => {
    if (!confirm(`Supprimer la clause « ${c.titre} » ?`)) return;
    try {
      await api.clauses.remove(c.id);
      await logAction(contratId, 'clause_supprimee', 'clause', c.id, { titre: c.titre });
      onChange();
      ok('Clause supprimée.');
    } catch (e: any) { err(e.message); }
  };

  const groupes = useMemo(() => {
    const g = new Map<string, Clause[]>();
    for (const c of clauses) {
      const k = c.categorie || 'DIVERS';
      if (!g.has(k)) g.set(k, []);
      g.get(k)!.push(c);
    }
    return CATEGORIES_CLAUSES.filter((c) => !catFiltre || c === catFiltre).map((cat) => ({ cat, items: (g.get(cat) || []).sort((a, b) => (a.ordre || 0) - (b.ordre || 0)) })).filter((x) => x.items.length > 0);
  }, [clauses, catFiltre]);

  const couverture = useMemo(() => {
    const presentes = new Set(clauses.map((c) => c.categorie));
    return CATEGORIES_CLAUSES.map((c) => ({ c, ok: presentes.has(c) }));
  }, [clauses]);

  return (
    <div className="space-y-4">
      {toastEl}
      {/* Jauge de couverture */}
      <div className="card p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Couverture de la structure universelle — {couverture.filter((x) => x.ok).length}/{CATEGORIES_CLAUSES.length} rubriques renseignées
        </p>
        <div className="flex flex-wrap gap-1.5">
          {couverture.map(({ c, ok: o }) => (
            <button key={c} onClick={() => setCatFiltre(catFiltre === c ? '' : c)} title={o ? 'Renseignée — cliquer pour filtrer' : 'Manquante — cliquer pour ajouter'}
              className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-medium transition ${catFiltre === c ? 'bg-fuchsia text-white' : o ? 'bg-success-soft text-success' : 'bg-white text-faint hover:text-muted'}`}>
              {c}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-faint">Le document généré est une représentation lisible de ces données structurées — jamais l’unique source de vérité.</p>
      </div>

      <div className="flex justify-end">
        <Btn onClick={() => ouvrir()}><Plus className="h-4 w-4" /> Nouvelle clause</Btn>
      </div>

      {groupes.length === 0 ? (
        <Empty icon={<BookOpen className="h-8 w-8" />} titre="Aucune clause" texte="Structurez le contrat rubrique par rubrique : objet, obligations, prix, résiliation, preuves…" action={<Btn onClick={() => ouvrir()}><Plus className="h-4 w-4" /> Ajouter la première clause</Btn>} />
      ) : (
        <div className="space-y-5">
          {groupes.map(({ cat, items }) => (
            <section key={cat}>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-700">
                <span className="h-px w-6 bg-fuchsia/40" /> {cat} <span className="text-faint">({items.length})</span>
              </h3>
              <div className="space-y-2.5">
                {items.map((c, i) => (
                  <article key={c.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-ink"><span className="mr-2 text-xs text-faint">{i + 1}.</span>{c.titre}</p>
                      <span className="flex shrink-0 items-center gap-1">
                        {c.statut !== 'active' && <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-[11px] font-medium text-fuchsia">{c.statut === 'en_discussion' ? 'En discussion' : c.statut}</span>}
                        <button onClick={() => ouvrir(c)} className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-white hover:text-ink"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => supprimer(c)} className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-critique-soft hover:text-critique"><Trash2 className="h-4 w-4" /></button>
                      </span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted">{c.contenu}</p>
                    {c.incertitude && (
                      <p className="mt-2 flex items-start gap-1.5 rounded-sm bg-fuchsia-50 p-2.5 text-xs text-fuchsia-700">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Incertitude signalée : {c.incertitude}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {modal && (
        <Modal large titre={edit ? 'Modifier la clause' : 'Nouvelle clause'} sousTitre="Distinguez les faits, les clauses et les interprétations. Signalez les incertitudes." onClose={() => setModal(false)}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Rubrique">
                <select value={form.categorie || 'DIVERS'} onChange={(e) => setForm({ ...form, categorie: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  {CATEGORIES_CLAUSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Statut">
                <select value={form.statut || 'active'} onChange={(e) => setForm({ ...form, statut: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  <option value="active">Active</option>
                  <option value="en_discussion">En discussion</option>
                  <option value="suspendue">Suspendue</option>
                </select>
              </Field>
            </div>
            <Field label="Titre *"><input value={form.titre || ''} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="Ex. : Prix et modalités de paiement" className={inputCls} /></Field>
            <Field label="Contenu *"><textarea value={form.contenu || ''} onChange={(e) => setForm({ ...form, contenu: e.target.value })} rows={5} placeholder="Rédigez la clause en langage clair…" className={inputCls} /></Field>
            <Field label="Incertitude éventuelle (optionnel)" hint="Ex. : interprétation débattue entre les parties, validité à faire vérifier.">
              <input value={form.incertitude || ''} onChange={(e) => setForm({ ...form, incertitude: e.target.value })} placeholder="Signalez honnêtement ce qui est incertain" className={inputCls} />
            </Field>
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(false)}>Annuler</Btn>
              <Btn onClick={sauver} disabled={busy}>{busy ? 'Enregistrement…' : edit ? 'Mettre à jour' : 'Ajouter la clause'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

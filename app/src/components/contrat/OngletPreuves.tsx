import { useState } from 'react';
import { Plus, Trash2, FileCheck2, Upload, ExternalLink } from 'lucide-react';
import { api, logActionAuto, parentRef, fichierVersBase64 } from '../../lib/api';
import type { Engagement, Evenement, Preuve } from '../../lib/types';
import { TYPES_PREUVE } from '../../lib/types';
import { fmtDate, typePreuveLabel, empreinteDoc } from '../../lib/format';
import { Btn, Empty, Field, Modal, inputCls, useToast } from '../ui';

// Preuves : chaîne documentaire horodatée. Chaque pièce reçoit une
// empreinte de traçabilité et peut être liée à un engagement / événement.
export default function OngletPreuves({ contratId, objetId, preuves, engagements, evenements, onChange }: {
  contratId?: number;
  objetId?: number;
  preuves: Preuve[];
  engagements: Engagement[];
  evenements: Evenement[];
  onChange: () => void;
}) {
  const { toastEl, ok, err } = useToast();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>({});
  const [fichier, setFichier] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [etape, setEtape] = useState('');

  const ouvrir = () => {
    setForm({ titre: '', type: 'autre', description: '', auteur: '', date_preuve: new Date().toISOString().slice(0, 10), engagement_id: '', evenement_id: '' });
    setFichier(null);
    setModal(true);
  };

  const sauver = async () => {
    if (!form.titre?.trim()) { err('Le titre est obligatoire.'); return; }
    setBusy(true);
    try {
      let url: string | null = null;
      let nom: string | null = null;
      if (fichier) {
        setEtape('Téléversement de la pièce…');
        const b64 = await fichierVersBase64(fichier);
        const up = await api.upload(fichier.name, b64, fichier.type || 'application/octet-stream');
        url = up.url;
        nom = fichier.name;
      }
      setEtape('Scellement de la preuve…');
      const c = await api.preuves.create({
        ...parentRef(contratId, objetId),
        titre: form.titre.trim(),
        type: form.type || 'autre',
        description: form.description || null,
        fichier_url: url,
        fichier_nom: nom,
        engagement_id: form.engagement_id ? Number(form.engagement_id) : null,
        evenement_id: form.evenement_id ? Number(form.evenement_id) : null,
        auteur: form.auteur || null,
        date_preuve: form.date_preuve || new Date().toISOString().slice(0, 10),
        empreinte: empreinteDoc(`${contratId ?? objetId}-${form.titre}-${nom || 'note'}`),
      });
      await logActionAuto(contratId, objetId, 'preuve_versee', 'preuve', c.id, { titre: form.titre, fichier: !!url });
      setModal(false);
      setEtape('');
      onChange();
      ok('Preuve versée à la chaîne documentaire.');
    } catch (e: any) { err(e.message); } finally { setBusy(false); setEtape(''); }
  };

  const supprimer = async (p: Preuve) => {
    if (!confirm(`Retirer « ${p.titre} » de la chaîne documentaire ? (Le fichier reste stocké.)`)) return;
    try {
      await api.preuves.remove(p.id);
      await logActionAuto(contratId, objetId, 'preuve_retiree', 'preuve', p.id, { titre: p.titre });
      onChange();
      ok('Preuve retirée.');
    } catch (e: any) { err(e.message); }
  };

  return (
    <div className="space-y-4">
      {toastEl}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          {preuves.length} pièce(s) · Chaque versement est horodaté et scellé d’une empreinte. En cas de contestation, seule la preuve compte.
        </p>
        <Btn onClick={ouvrir}><Plus className="h-4 w-4" /> Verser une preuve</Btn>
      </div>

      {preuves.length === 0 ? (
        <Empty icon={<FileCheck2 className="h-8 w-8" />} titre="Chaîne documentaire vide" texte="Versez ici contrats signés, reçus, factures, PV, photos datées, échanges écrits… Chaque pièce est liée aux engagements et événements concernés." action={<Btn onClick={ouvrir}><Plus className="h-4 w-4" /> Verser la première pièce</Btn>} />
      ) : (
        <div className="space-y-2.5">
          {preuves.map((p, i) => {
            const g = engagements.find((x) => x.id === p.engagement_id);
            const ev = evenements.find((x) => x.id === p.evenement_id);
            return (
              <div key={p.id} className="flex flex-wrap items-center gap-3 card p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-success-soft font-mono text-xs font-bold text-success">
                  #{preuves.length - i}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-muted">{typePreuveLabel(p.type)}</span>
                    <strong className="font-semibold text-ink">{p.titre}</strong>
                  </p>
                  <p className="mt-1 text-xs text-faint">
                    {fmtDate(p.date_preuve || p.created_at)}{p.auteur ? ` · ${p.auteur}` : ''} · empreinte <span className="font-mono text-muted">{p.empreinte || '—'}</span>
                  </p>
                  {p.description && <p className="mt-1 text-sm text-muted">{p.description}</p>}
                  <p className="mt-1.5 flex flex-wrap gap-1.5">
                    {g && <span className="rounded-full bg-fuchsia-soft px-2.5 py-0.5 text-[11px] text-attention">⇄ {g.titre}</span>}
                    {ev && <span className="rounded-full bg-fuchsia-soft px-2.5 py-0.5 text-[11px] text-fuchsia">◷ {ev.titre}</span>}
                  </p>
                </div>
                <span className="flex shrink-0 gap-1">
                  {p.fichier_url && (
                    <a href={p.fichier_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-attention hover:bg-fuchsia-soft">
                      <ExternalLink className="h-3.5 w-3.5" /> Ouvrir
                    </a>
                  )}
                  <button onClick={() => supprimer(p)} className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-critique-soft hover:text-critique"><Trash2 className="h-4 w-4" /></button>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal titre="Verser une preuve" sousTitre="Horodatage + empreinte automatiques. 8 Mo max par fichier." onClose={() => setModal(false)}>
          <div className="space-y-4">
            <Field label="Titre *"><input value={form.titre || ''} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="Ex. : Reçu du 2ᵉ versement — 500 €" className={inputCls} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type">
                <select value={form.type || 'autre'} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  {TYPES_PREUVE.map((t) => <option key={t} value={t}>{typePreuveLabel(t)}</option>)}
                </select>
              </Field>
              <Field label="Date de la pièce"><input type="date" value={form.date_preuve || ''} onChange={(e) => setForm({ ...form, date_preuve: e.target.value })} className={inputCls} /></Field>
            </div>
            <Field label="Description"><textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Ce que cette pièce établit…" className={inputCls} /></Field>
            <Field label="Fichier (optionnel — sinon simple mention tracée)">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-line px-4 py-5 text-sm text-muted hover:border-fuchsia-400">
                <Upload className="h-4 w-4" /> {fichier ? fichier.name : 'Choisir un fichier (PDF, image, texte…)'}
                <input type="file" className="hidden" onChange={(e) => setFichier(e.target.files?.[0] || null)} />
              </label>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Engagement lié">
                <select value={form.engagement_id || ''} onChange={(e) => setForm({ ...form, engagement_id: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  <option value="">— Aucun —</option>
                  {engagements.map((g) => <option key={g.id} value={g.id}>{g.titre}</option>)}
                </select>
              </Field>
              <Field label="Événement lié">
                <select value={form.evenement_id || ''} onChange={(e) => setForm({ ...form, evenement_id: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  <option value="">— Aucun —</option>
                  {evenements.map((g) => <option key={g.id} value={g.id}>{g.titre}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Émetteur / auteur"><input value={form.auteur || ''} onChange={(e) => setForm({ ...form, auteur: e.target.value })} placeholder="Ex. : Marie Dupont" className={inputCls} /></Field>
            {etape && <p className="text-sm text-fuchsia-600">{etape}</p>}
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(false)}>Annuler</Btn>
              <Btn onClick={sauver} disabled={busy}>{busy ? 'Versement…' : 'Sceller la preuve'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}


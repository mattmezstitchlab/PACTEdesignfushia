import { useState } from 'react';
import { Gavel, Plus, Trash2 } from 'lucide-react';
import { api, logActionObjet } from '../../lib/api';
import type { Decision } from '../../lib/types';
import { fmtDate } from '../../lib/format';
import { Btn, Empty, Field, Modal, Prudence, inputCls, useToast } from '../ui';

// DÉCISION — ce que l'humain décide finalement. Distincte de toute
// suggestion, simulation ou analyse IA : PACTE montre, structure et
// signale, mais ne décide jamais à la place de l'utilisateur.
export default function OngletDecisions({ objetId, decisions, onChange }: {
  objetId: number;
  decisions: Decision[];
  onChange: () => void;
}) {
  const { toastEl, ok, err } = useToast();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>({});
  const [busy, setBusy] = useState(false);

  const ouvrir = () => {
    setForm({ titre: '', description: '', decideur: '', fondee_sur: '', date_decision: new Date().toISOString().slice(0, 10) });
    setModal(true);
  };

  const sauver = async () => {
    if (!form.titre.trim()) { err('Donnez un titre à cette décision.'); return; }
    setBusy(true);
    try {
      const created = await api.decisions.create({
        objet_id: objetId,
        titre: form.titre.trim(),
        description: form.description || null,
        decideur: form.decideur || null,
        fondee_sur: form.fondee_sur || null,
        date_decision: form.date_decision || new Date().toISOString(),
      });
      await logActionObjet(objetId, 'decision_enregistree', 'decision', created.id, { titre: form.titre });
      setModal(false);
      onChange();
      ok('Décision enregistrée.');
    } catch (e: any) { err(e.message); } finally { setBusy(false); }
  };

  const supprimer = async (d: Decision) => {
    if (!confirm(`Supprimer la décision « ${d.titre} » ?`)) return;
    try {
      await api.decisions.remove(d.id);
      await logActionObjet(objetId, 'decision_supprimee', 'decision', d.id, { titre: d.titre });
      onChange();
      ok('Décision supprimée.');
    } catch (e: any) { err(e.message); }
  };

  const triees = [...decisions].sort((a, b) => new Date(b.date_decision || b.created_at).getTime() - new Date(a.date_decision || a.created_at).getTime());

  return (
    <div className="space-y-4">
      {toastEl}
      <Prudence compact />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Ce que vous avez décidé, avec ce qui l’a éclairé — jamais ce que PACTE aurait « conclu » à votre place.</p>
        <Btn onClick={ouvrir}><Plus className="h-4 w-4" /> Enregistrer une décision</Btn>
      </div>
      {triees.length === 0 ? (
        <Empty icon={<Gavel className="h-8 w-8" />} titre="Aucune décision enregistrée" texte="Tracez ici les décisions humaines importantes (poursuivre, arrêter, vendre, renégocier…) et ce qui les a éclairées." action={<Btn onClick={ouvrir}><Plus className="h-4 w-4" /> Enregistrer une décision</Btn>} />
      ) : (
        <div className="space-y-2.5">
          {triees.map((d) => (
            <div key={d.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{d.titre}</p>
                  <p className="text-xs text-faint">{fmtDate(d.date_decision)}{d.decideur ? ` · Décidé par ${d.decideur}` : ''}</p>
                </div>
                <button onClick={() => supprimer(d)} className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-critique-soft hover:text-critique shrink-0"><Trash2 className="h-4 w-4" /></button>
              </div>
              {d.description && <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{d.description}</p>}
              {d.fondee_sur && <p className="mt-2 rounded-sm bg-fuchsia-50 p-2.5 text-xs text-fuchsia-700"><strong>Fondée sur :</strong> {d.fondee_sur}</p>}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal titre="Enregistrer une décision" sousTitre="Ce que vous décidez, pas ce que PACTE conclurait." onClose={() => setModal(false)}>
          <div className="space-y-3">
            <Field label="Titre de la décision"><input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} className={inputCls} placeholder="Ex. : poursuivre le projet, vendre l’œuvre, renégocier le contrat…" /></Field>
            <Field label="Description"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} rows={3} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Décidé par"><input value={form.decideur} onChange={(e) => setForm({ ...form, decideur: e.target.value })} className={inputCls} /></Field>
              <Field label="Date"><input type="date" value={form.date_decision} onChange={(e) => setForm({ ...form, date_decision: e.target.value })} className={inputCls} /></Field>
            </div>
            <Field label="Fondée sur" hint="Analyses, scénarios, alertes ou données qui ont éclairé cette décision."><textarea value={form.fondee_sur} onChange={(e) => setForm({ ...form, fondee_sur: e.target.value })} className={inputCls} rows={2} /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="ghost" onClick={() => setModal(false)}>Annuler</Btn>
              <Btn onClick={sauver} disabled={busy}>Enregistrer</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

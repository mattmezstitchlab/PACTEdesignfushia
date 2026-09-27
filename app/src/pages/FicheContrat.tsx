import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Users, BookOpen, ListChecks, History, CalendarClock, FileCheck2,
  Bell, FlaskConical, ListTodo, GitBranch, FolderOpen, Pencil, Info, Globe2,
  CalendarDays, Wallet, FileText,
} from 'lucide-react';
import { api, logAction } from '../lib/api';
import { fmtDate, fmtMontant, statutContratLabel } from '../lib/format';
import { modeleParCode } from '../lib/modeles';
import { Spinner, BadgeSante, BadgeStatut, Btn, Field, Modal, inputCls, useToast } from '../components/ui';
import { useContratData } from '../components/contrat/data';
import OngletParties from '../components/contrat/OngletParties';
import OngletClauses from '../components/contrat/OngletClauses';
import OngletEngagements from '../components/contrat/OngletEngagements';
import OngletEvenements from '../components/contrat/OngletEvenements';
import OngletEcheances from '../components/contrat/OngletEcheances';
import OngletPreuves from '../components/contrat/OngletPreuves';
import OngletAlertes from '../components/contrat/OngletAlertes';
import OngletScenarios from '../components/contrat/OngletScenarios';
import OngletActions from '../components/contrat/OngletActions';
import OngletVersions from '../components/contrat/OngletVersions';
import OngletDossier from '../components/contrat/OngletDossier';

const ONGLETS = [
  { id: 'apercu', label: 'Aperçu', icon: Info },
  { id: 'parties', label: 'Parties', icon: Users },
  { id: 'clauses', label: 'Clauses', icon: BookOpen },
  { id: 'engagements', label: 'Engagements', icon: ListChecks },
  { id: 'evenements', label: 'Événements', icon: History },
  { id: 'echeances', label: 'Échéances', icon: CalendarClock },
  { id: 'preuves', label: 'Preuves', icon: FileCheck2 },
  { id: 'alertes', label: 'Alertes', icon: Bell },
  { id: 'scenarios', label: 'Scénarios', icon: FlaskConical },
  { id: 'actions', label: 'Actions', icon: ListTodo },
  { id: 'versions', label: 'Versions', icon: GitBranch },
  { id: 'dossier', label: 'Dossier', icon: FolderOpen },
];

export default function FicheContrat() {
  const { id } = useParams();
  const numId = Number(id);
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const onglet = params.get('onglet') || 'apercu';
  const { toastEl, ok, err } = useToast();
  const [modalInfo, setModalInfo] = useState(false);
  const [form, setForm] = useState<any>({});
  const [busy, setBusy] = useState(false);

  const d = useContratData(isNaN(numId) ? null : numId);
  const { contrat } = d;

  const changerOnglet = (o: string) => setParams(o === 'apercu' ? {} : { onglet: o }, { replace: true });

  useEffect(() => {
    if (contrat) {
      setForm({
        titre: contrat.titre || '', statut: contrat.statut || 'brouillon', objet: contrat.objet || '',
        pays: contrat.pays || '', droit_applicable: contrat.droit_applicable || '', ville: contrat.ville || '',
        date_debut: (contrat.date_debut || '').slice(0, 10), date_fin: (contrat.date_fin || '').slice(0, 10),
        duree: contrat.duree || '', montant_total: contrat.montant_total ?? '', devise: contrat.devise || 'EUR',
        notes: contrat.notes || '',
      });
    }
  }, [contrat?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const timeline = useMemo(() => {
    const items: { date: string; type: string; titre: string; detail: string }[] = [];
    for (const g of d.engagements) {
      if (!g.date_echeance) continue;
      items.push({ date: g.date_echeance, type: 'engagement', titre: g.titre, detail: g.statut || '' });
    }
    for (const e of d.echeances) {
      if (!e.date_limite) continue;
      items.push({ date: e.date_limite, type: 'echeance', titre: e.titre || 'Échéance', detail: `${e.type || ''}${e.montant ? ` · ${e.montant}` : ''}` });
    }
    for (const ev of d.evenements) {
      items.push({ date: ev.date_evenement || ev.created_at, type: 'evenement', titre: ev.titre || 'Événement', detail: ev.type || '' });
    }
    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [d.engagements, d.echeances, d.evenements]);

  if (d.loading) return <Spinner label="Ouverture du contrat…" />;
  if (d.erreur || !contrat) {
    return (
      <div className="space-y-4">
        <button onClick={() => nav('/contrats')} className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Retour aux contrats</button>
        <div className="rounded border border-critique bg-critique-soft p-6 text-sm text-critique">{d.erreur || 'Contrat introuvable.'}</div>
      </div>
    );
  }

  const m = modeleParCode(contrat.type_modele);
  const alertesActives = d.alertes.filter((a) => a.statut === 'active').length;
  const compte = (o: string) => {
    if (o === 'parties') return d.contratParties.length;
    if (o === 'clauses') return d.clauses.length;
    if (o === 'engagements') return d.engagements.length;
    if (o === 'evenements') return d.evenements.length;
    if (o === 'echeances') return d.echeances.length;
    if (o === 'preuves') return d.preuves.length;
    if (o === 'alertes') return alertesActives;
    if (o === 'scenarios') return d.scenarios.length;
    if (o === 'actions') return d.actions.filter((a) => a.statut === 'a_faire' || a.statut === 'en_cours').length;
    if (o === 'versions') return d.versions.length;
    return null;
  };

  const sauverInfos = async () => {
    if (!form.titre?.trim()) { err('Le titre est obligatoire.'); return; }
    setBusy(true);
    try {
      await api.contrats.update(contrat.id, {
        titre: form.titre.trim(), statut: form.statut, objet: form.objet || null,
        pays: form.pays || null, droit_applicable: form.droit_applicable || null, ville: form.ville || null,
        date_debut: form.date_debut || null, date_fin: form.date_fin || null, duree: form.duree || null,
        montant_total: form.montant_total === '' ? null : Number(String(form.montant_total).replace(',', '.')) || null,
        devise: form.devise || 'EUR', notes: form.notes || null,
      });
      await logAction(contrat.id, 'contrat_modifie', 'contrat', contrat.id, {});
      setModalInfo(false);
      d.rechargerTable('contrat');
      ok('Informations mises à jour.');
    } catch (e: any) { err(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      {toastEl}
      <button onClick={() => nav('/contrats')} className="no-print inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Tous les contrats
      </button>

      {/* En-tête */}
      <div className="overflow-hidden card">
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${m.couleur}, transparent)` }} />
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-faint">{m.nom} · v{contrat.version_courante || 1}</p>
              <h1 className="font-display mt-1 text-2xl font-bold text-ink sm:text-3xl">{contrat.titre}</h1>
              {contrat.objet && <p className="mt-2 line-clamp-2 text-sm text-muted">{contrat.objet}</p>}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
                {(contrat.pays || contrat.droit_applicable) && <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5" /> {[contrat.ville, contrat.pays].filter(Boolean).join(', ')}{contrat.droit_applicable ? ` · ${contrat.droit_applicable}` : ''}</span>}
                {(contrat.date_debut || contrat.date_fin) && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {fmtDate(contrat.date_debut)} → {fmtDate(contrat.date_fin)}{contrat.duree ? ` (${contrat.duree})` : ''}</span>}
                {contrat.montant_total != null && <span className="inline-flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> {fmtMontant(contrat.montant_total, contrat.devise || 'EUR')}</span>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="flex gap-2"><BadgeStatut statut={contrat.statut} /><BadgeSante sante={contrat.sante} /></span>
              <Btn variant="soft" onClick={() => setModalInfo(true)}><Pencil className="h-4 w-4" /> Modifier les infos</Btn>
            </div>
          </div>

          {/* Navigation par onglets */}
          <nav className="no-print -mx-1 mt-5 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {ONGLETS.map((o) => {
              const actif = onglet === o.id;
              const n = compte(o.id);
              return (
                <button key={o.id} onClick={() => changerOnglet(o.id)}
                  className={`relative flex shrink-0 cursor-pointer items-center gap-1.5 rounded-sm px-3 py-2 text-xs font-medium transition sm:text-sm ${actif ? 'bg-fuchsia text-white' : 'bg-white text-muted hover:text-ink'}`}>
                  <o.icon className="h-4 w-4" /> {o.label}
                  {n != null && n > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${actif ? 'bg-white/30' : o.id === 'alertes' ? 'bg-critique-soft text-critique' : 'bg-white text-muted'}`}>{n}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Contenu */}
      {onglet === 'apercu' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink"><FileText className="h-5 w-5 text-fuchsia" /> État du dossier</h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <MiniStat n={d.contratParties.length} l="Parties" o="parties" go={changerOnglet} />
              <MiniStat n={d.clauses.length} l="Clauses" o="clauses" go={changerOnglet} />
              <MiniStat n={d.engagements.length} l="Engagements" o="engagements" go={changerOnglet} />
              <MiniStat n={d.evenements.length} l="Événements" o="evenements" go={changerOnglet} />
              <MiniStat n={d.echeances.length} l="Échéances" o="echeances" go={changerOnglet} />
              <MiniStat n={d.preuves.length} l="Preuves" o="preuves" go={changerOnglet} />
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <LigneEtat label="Signatures" valeur={`${d.contratParties.filter((p) => p.signature_statut === 'signee').length}/${d.contratParties.length} recueillies`} alerte={d.contratParties.some((p) => p.signature_statut !== 'signee')} />
              <LigneEtat label="Engagements réalisés" valeur={`${d.engagements.filter((g) => g.statut === 'realise').length}/${d.engagements.length}`} />
              <LigneEtat label="Alertes actives" valeur={String(alertesActives)} alerte={alertesActives > 0} />
              <LigneEtat label="Actions ouvertes" valeur={String(d.actions.filter((a) => a.statut === 'a_faire' || a.statut === 'en_cours').length)} />
            </div>
            {!contrat.pays && !contrat.droit_applicable && (
              <p className="mt-3 rounded-sm bg-fuchsia-50 p-3 text-xs text-fuchsia-700">
                Pays et droit applicable non renseignés : l’interprétation reste plus incertaine. Ajoutez-les via « Modifier les infos ».
              </p>
            )}
          </div>
          <div className="card p-5">
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">Timeline — engagements, échéances, événements</h2>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted">La timeline se remplira avec les dates des engagements, échéances et événements.</p>
            ) : (
              <ol className="relative max-h-[420px] space-y-0 overflow-y-auto border-l-2 border-line pl-4">
                {timeline.slice(0, 60).map((t, i) => (
                  <li key={i} className="relative py-2">
                    <span className={`absolute -left-[23px] top-3 h-2.5 w-2.5 rounded-full ${t.type === 'engagement' ? 'bg-fuchsia' : t.type === 'echeance' ? 'bg-fuchsia' : 'bg-success'}`} />
                    <p className="text-xs text-faint">{fmtDate(t.date)} · {t.type === 'engagement' ? 'Engagement' : t.type === 'echeance' ? 'Échéance' : 'Événement'}</p>
                    <p className="truncate text-sm font-medium text-ink">{t.titre}</p>
                    {t.detail && <p className="truncate text-xs text-faint">{t.detail}</p>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
      {onglet === 'parties' && <OngletParties contratId={contrat.id} liens={d.contratParties} annuaire={d.parties} onChange={() => d.rechargerTable('parties')} />}
      {onglet === 'clauses' && <OngletClauses contratId={contrat.id} clauses={d.clauses} onChange={() => d.rechargerTable('clauses')} />}
      {onglet === 'engagements' && <OngletEngagements contratId={contrat.id} engagements={d.engagements} liens={d.contratParties} onChange={() => d.rechargerTable('engagements')} />}
      {onglet === 'evenements' && <OngletEvenements contratId={contrat.id} evenements={d.evenements} engagements={d.engagements} onChange={() => d.rechargerTable('evenements')} />}
      {onglet === 'echeances' && <OngletEcheances contratId={contrat.id} echeances={d.echeances} engagements={d.engagements} devise={contrat.devise} onChange={() => d.rechargerTable('echeances')} />}
      {onglet === 'preuves' && <OngletPreuves contratId={contrat.id} preuves={d.preuves} engagements={d.engagements} evenements={d.evenements} onChange={() => d.rechargerTable('preuves')} />}
      {onglet === 'alertes' && (
        <OngletAlertes contrat={contrat}
          donnees={{ contrat, engagements: d.engagements, echeances: d.echeances, evenements: d.evenements, preuves: d.preuves, clauses: d.clauses, parties: d.contratParties, versions: d.versions }}
          alertes={d.alertes}
          onChange={() => { d.rechargerTable('alertes'); d.rechargerTable('actions'); d.rechargerTable('contrat'); }} />
      )}
      {onglet === 'scenarios' && (
        <OngletScenarios contratId={contrat.id} scenarios={d.scenarios}
          ctx={{ engagements: d.engagements, echeances: d.echeances, evenements: d.evenements, clauses: d.clauses, preuves: d.preuves }}
          droit={contrat.droit_applicable}
          onChange={() => { d.rechargerTable('scenarios'); d.rechargerTable('actions'); }} />
      )}
      {onglet === 'actions' && (
        <OngletActions contratId={contrat.id} actions={d.actions} echeances={d.echeances} evenements={d.evenements} engagements={d.engagements}
          dateFin={contrat.date_fin} statutContrat={contrat.statut} onChange={() => d.rechargerTable('actions')} />
      )}
      {onglet === 'versions' && (
        <OngletVersions contrat={contrat} versions={d.versions}
          snapshot={{ clauses: d.clauses, engagements: d.engagements, echeances: d.echeances, evenements: d.evenements, preuves: d.preuves, parties: d.contratParties, alertes: d.alertes, actions: d.actions }}
          historique={d.historique}
          onChange={() => { d.rechargerTable('versions'); d.rechargerTable('contrat'); d.rechargerTable('historique'); }} />
      )}
      {onglet === 'dossier' && (
        <OngletDossier contrat={contrat} liens={d.contratParties} clauses={d.clauses} engagements={d.engagements} echeances={d.echeances} evenements={d.evenements} preuves={d.preuves} versions={d.versions} />
      )}

      {/* Modal infos */}
      {modalInfo && (
        <Modal large titre="Informations du contrat" sousTitre="Pays et droit applicable : essentiels pour contextualiser le suivi." onClose={() => setModalInfo(false)}>
          <div className="space-y-4">
            <Field label="Titre *"><input value={form.titre || ''} onChange={(e) => setForm({ ...form, titre: e.target.value })} className={inputCls} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Statut">
                <select value={form.statut || 'brouillon'} onChange={(e) => setForm({ ...form, statut: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  {['brouillon', 'actif', 'suspendu', 'termine', 'archive'].map((s) => <option key={s} value={s}>{statutContratLabel(s)}</option>)}
                </select>
              </Field>
              <Field label="Durée"><input value={form.duree || ''} onChange={(e) => setForm({ ...form, duree: e.target.value })} placeholder="Ex. : 12 mois" className={inputCls} /></Field>
            </div>
            <Field label="Objet"><textarea value={form.objet || ''} onChange={(e) => setForm({ ...form, objet: e.target.value })} rows={2} className={inputCls} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Pays"><input value={form.pays || ''} onChange={(e) => setForm({ ...form, pays: e.target.value })} className={inputCls} /></Field>
              <Field label="Droit applicable"><input value={form.droit_applicable || ''} onChange={(e) => setForm({ ...form, droit_applicable: e.target.value })} className={inputCls} /></Field>
              <Field label="Ville"><input value={form.ville || ''} onChange={(e) => setForm({ ...form, ville: e.target.value })} className={inputCls} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Début"><input type="date" value={form.date_debut || ''} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} className={inputCls} /></Field>
              <Field label="Fin"><input type="date" value={form.date_fin || ''} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} className={inputCls} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Montant total"><input value={form.montant_total} onChange={(e) => setForm({ ...form, montant_total: e.target.value })} inputMode="decimal" className={inputCls} /></Field>
              <Field label="Devise"><input value={form.devise || ''} onChange={(e) => setForm({ ...form, devise: e.target.value })} className={inputCls} /></Field>
            </div>
            <Field label="Notes internes"><textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputCls} /></Field>
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModalInfo(false)}>Annuler</Btn>
              <Btn onClick={sauverInfos} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MiniStat({ n, l, o, go }: { n: number; l: string; o: string; go: (o: string) => void }) {
  return (
    <button onClick={() => go(o)} className="cursor-pointer mini-stat p-3 text-center transition hover:bg-white">
      <p className="font-display text-2xl font-bold text-ink">{n}</p>
      <p className="text-[11px] uppercase tracking-wider text-muted">{l}</p>
    </button>
  );
}

function LigneEtat({ label, valeur, alerte }: { label: string; valeur: string; alerte?: boolean }) {
  return (
    <div className="flex items-center justify-between card px-3 py-2">
      <span className="text-muted">{label}</span>
      <strong className={alerte ? 'text-fuchsia' : 'text-ink'}>{valeur}</strong>
    </div>
  );
}

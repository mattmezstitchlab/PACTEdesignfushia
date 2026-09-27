import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Users, ListChecks, History, CalendarClock, FileCheck2,
  Bell, FlaskConical, ListTodo, Pencil, Info, Globe2,
  CalendarDays, Wallet, Boxes, Gauge, Gavel,
} from 'lucide-react';
import { api, logActionObjet } from '../lib/api';
import { fmtDate, fmtMontant } from '../lib/format';
import { universParCode } from '../lib/univers';
import { Spinner, BadgeSante, BadgeStatut, Btn, Field, Modal, inputCls, useToast, MiniStat, LigneEtat, Prudence } from '../components/ui';
import { useObjetData } from '../components/objet/data';
import OngletRelations from '../components/objet/OngletRelations';
import OngletEngagements, { statutLabel as statutEngagementLabel } from '../components/contrat/OngletEngagements';
import OngletEvenements from '../components/contrat/OngletEvenements';
import OngletEcheances from '../components/contrat/OngletEcheances';
import OngletPreuves from '../components/contrat/OngletPreuves';
import OngletAlertes from '../components/contrat/OngletAlertes';
import OngletScenarios from '../components/contrat/OngletScenarios';
import OngletActions from '../components/contrat/OngletActions';
import OngletMetriques from '../components/objet/OngletMetriques';
import OngletDecisions from '../components/objet/OngletDecisions';
import { type ItemTimeline, decouperPhases, PhaseTimeline } from '../components/timeline/Timeline';
import type { ContratPartie } from '../lib/types';

const ONGLETS = [
  { id: 'apercu', label: 'Aperçu', icon: Info },
  { id: 'relations', label: 'Relations', icon: Users },
  { id: 'engagements', label: 'Engagements', icon: ListChecks },
  { id: 'evenements', label: 'Événements', icon: History },
  { id: 'echeances', label: 'Échéances', icon: CalendarClock },
  { id: 'preuves', label: 'Preuves', icon: FileCheck2 },
  { id: 'donnees', label: 'Données', icon: Gauge },
  { id: 'alertes', label: 'Alertes', icon: Bell },
  { id: 'scenarios', label: 'Scénarios', icon: FlaskConical },
  { id: 'actions', label: 'Actions', icon: ListTodo },
  { id: 'decisions', label: 'Décisions', icon: Gavel },
];

// Fiche d'un objet suivi — le cas général du moteur (le contrat, voir
// FicheContrat.tsx, en est le cas historique particulier). Mêmes
// briques génériques : Relation/Engagement/Échéance/Événement/Preuve/
// Alerte/Scénario/Décision + Donnée (métrique) propre aux objets.
export default function FicheObjet() {
  const { id } = useParams();
  const numId = Number(id);
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const onglet = params.get('onglet') || 'apercu';
  const { toastEl, ok, err } = useToast();
  const [modalInfo, setModalInfo] = useState(false);
  const [form, setForm] = useState<any>({});
  const [busy, setBusy] = useState(false);

  const d = useObjetData(isNaN(numId) ? null : numId);
  const { objet } = d;

  const changerOnglet = (o: string) => setParams(o === 'apercu' ? {} : { onglet: o }, { replace: true });

  useEffect(() => {
    if (objet) {
      setForm({
        titre: objet.titre || '', statut: objet.statut || 'brouillon', description: objet.description || '',
        pays: objet.pays || '', droit_applicable: objet.droit_applicable || '',
        date_debut: (objet.date_debut || '').slice(0, 10), date_fin: (objet.date_fin || '').slice(0, 10),
        valeur_declaree: objet.valeur_declaree ?? '', devise: objet.devise || 'EUR', notes: objet.notes || '',
      });
    }
  }, [objet?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Relations adaptées au format attendu par OngletEngagements (QUI /
  // POUR QUI) — même composant, aucune duplication de logique.
  const liensAdapt: ContratPartie[] = useMemo(() => d.relations
    .filter((r) => r.partie_id)
    .map((r) => ({
      id: r.id, contrat_id: 0, partie_id: r.partie_id as number, role: r.role,
      qualite: null, relation: r.type_relation, engagement_resume: null,
      signature_statut: null, signature_date: null, created_at: r.created_at, partie: r.partie,
    })), [d.relations]);

  const timeline = useMemo(() => {
    const items: ItemTimeline[] = [];
    for (const g of d.engagements) {
      if (!g.date_echeance) continue;
      const enRetard = g.statut !== 'realise' && g.statut !== 'annule' && new Date(g.date_echeance).getTime() < Date.now();
      items.push({
        date: g.date_echeance, type: 'engagement', titre: g.titre, detail: statutEngagementLabel(g.statut),
        onglet: 'engagements',
        etat: g.statut === 'realise' ? 'fait' : enRetard ? 'critique' : 'attention',
        nbPreuves: d.preuves.filter((p) => p.engagement_id === g.id).length,
      });
    }
    for (const e of d.echeances) {
      if (!e.date_limite) continue;
      const enRetard = e.statut !== 'realisee' && e.statut !== 'annulee' && new Date(e.date_limite).getTime() < Date.now();
      items.push({
        date: e.date_limite, type: 'echeance', titre: e.titre || 'Échéance', detail: `${e.type || ''}${e.montant ? ` · ${e.montant} ${e.devise || ''}` : ''}`,
        onglet: 'echeances',
        etat: e.statut === 'realisee' ? 'fait' : enRetard ? 'critique' : 'attention',
        nbPreuves: 0,
      });
    }
    for (const ev of d.evenements) {
      const sensible = ['incident', 'impossibilite', 'force_majeure', 'refus'].includes(ev.type || '');
      items.push({
        date: ev.date_evenement || ev.created_at, type: 'evenement', titre: ev.titre || 'Événement', detail: ev.type || '',
        onglet: 'evenements',
        etat: ev.statut === 'conteste' || sensible ? 'critique' : ev.statut === 'a_verifier' ? 'attention' : 'fait',
        nbPreuves: d.preuves.filter((p) => p.evenement_id === ev.id).length,
      });
    }
    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [d.engagements, d.echeances, d.evenements, d.preuves]);

  const phases = useMemo(
    () => decouperPhases(timeline, objet?.date_debut ?? null, objet?.date_fin ?? null),
    [timeline, objet?.date_debut, objet?.date_fin],
  );

  if (d.loading) return <Spinner label="Ouverture de l’objet…" />;
  if (d.erreur || !objet) {
    return (
      <div className="space-y-4">
        <button onClick={() => nav('/objets')} className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Retour aux objets</button>
        <div className="rounded border border-critique bg-critique-soft p-6 text-sm text-critique">{d.erreur || 'Objet introuvable.'}</div>
      </div>
    );
  }

  const u = universParCode(objet.univers);
  const alertesActives = d.alertes.filter((a) => a.statut === 'active').length;
  const compte = (o: string) => {
    if (o === 'relations') return d.relations.length;
    if (o === 'engagements') return d.engagements.length;
    if (o === 'evenements') return d.evenements.length;
    if (o === 'echeances') return d.echeances.length;
    if (o === 'preuves') return d.preuves.length;
    if (o === 'donnees') return d.metriques.length;
    if (o === 'alertes') return alertesActives;
    if (o === 'scenarios') return d.scenarios.length;
    if (o === 'actions') return d.actions.filter((a) => a.statut === 'a_faire' || a.statut === 'en_cours').length;
    if (o === 'decisions') return d.decisions.length;
    return null;
  };

  const sauverInfos = async () => {
    if (!form.titre?.trim()) { err('Le titre est obligatoire.'); return; }
    setBusy(true);
    try {
      await api.objets.update(objet.id, {
        titre: form.titre.trim(), statut: form.statut, description: form.description || null,
        pays: form.pays || null, droit_applicable: form.droit_applicable || null,
        date_debut: form.date_debut || null, date_fin: form.date_fin || null,
        valeur_declaree: form.valeur_declaree === '' ? null : Number(String(form.valeur_declaree).replace(',', '.')) || null,
        devise: form.devise || 'EUR', notes: form.notes || null,
      });
      await logActionObjet(objet.id, 'objet_modifie', 'objet', objet.id, {});
      setModalInfo(false);
      d.rechargerTable('objet');
      ok('Informations mises à jour.');
    } catch (e: any) { err(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      {toastEl}
      <button onClick={() => nav('/objets')} className="no-print inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Tous les objets
      </button>

      {/* En-tête */}
      <div className="overflow-hidden card">
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${u?.couleur || '#e2547e'}, transparent)` }} />
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-faint">{u?.nom || objet.univers} · {objet.type_objet}</p>
              <h1 className="font-display mt-1 text-2xl font-bold text-ink sm:text-3xl">{objet.titre}</h1>
              {objet.description && <p className="mt-2 line-clamp-2 text-sm text-muted">{objet.description}</p>}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
                {(objet.pays || objet.droit_applicable) && <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5" /> {objet.pays}{objet.droit_applicable ? ` · ${objet.droit_applicable}` : ''}</span>}
                {(objet.date_debut || objet.date_fin) && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {fmtDate(objet.date_debut)} → {fmtDate(objet.date_fin)}</span>}
                {objet.valeur_declaree != null && <span className="inline-flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> {fmtMontant(objet.valeur_declaree, objet.devise || 'EUR')} (déclarée)</span>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="flex gap-2"><BadgeStatut statut={objet.statut} /><BadgeSante sante={objet.sante} /></span>
              <Btn variant="soft" onClick={() => setModalInfo(true)}><Pencil className="h-4 w-4" /> Modifier les infos</Btn>
            </div>
          </div>

          <nav className="no-print -mx-1 mt-5 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {ONGLETS.map((o) => {
              const actif = onglet === o.id;
              const n = compte(o.id);
              return (
                <button key={o.id} onClick={() => changerOnglet(o.id)}
                  className={`relative flex shrink-0 cursor-pointer items-center gap-1.5 rounded-sm px-3 py-2.5 text-xs font-medium transition sm:text-sm min-h-[44px] ${actif ? 'bg-fuchsia text-white' : 'bg-white text-muted hover:text-ink'}`}>
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

      {onglet === 'apercu' && (
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink"><Boxes className="h-5 w-5 text-fuchsia" /> État de l’objet</h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              <MiniStat n={d.relations.length} l="Relations" o="relations" go={changerOnglet} />
              <MiniStat n={d.engagements.length} l="Engagements" o="engagements" go={changerOnglet} />
              <MiniStat n={d.evenements.length} l="Événements" o="evenements" go={changerOnglet} />
              <MiniStat n={d.echeances.length} l="Échéances" o="echeances" go={changerOnglet} />
              <MiniStat n={d.preuves.length} l="Preuves" o="preuves" go={changerOnglet} />
              <MiniStat n={d.metriques.length} l="Données" o="donnees" go={changerOnglet} />
            </div>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <LigneEtat label="Engagements réalisés" valeur={`${d.engagements.filter((g) => g.statut === 'realise').length}/${d.engagements.length}`} />
              <LigneEtat label="Alertes actives" valeur={String(alertesActives)} alerte={alertesActives > 0} />
              <LigneEtat label="Actions ouvertes" valeur={String(d.actions.filter((a) => a.statut === 'a_faire' || a.statut === 'en_cours').length)} />
              <LigneEtat label="Décisions enregistrées" valeur={String(d.decisions.length)} />
            </div>
            {!objet.pays && !objet.droit_applicable && (
              <p className="mt-3 rounded-sm bg-fuchsia-50 p-3 text-xs text-fuchsia-700">
                Pays et droit applicable non renseignés : l’interprétation reste plus incertaine. Ajoutez-les via « Modifier les infos ».
              </p>
            )}
          </div>

          <div className="card p-5">
            <h2 className="mb-1 font-display text-lg font-semibold text-ink">Timeline — avant, pendant, après</h2>
            <p className="mb-4 text-sm text-muted">Le même fil conducteur que pour un contrat : chaque étape est reliée à ses engagements, échéances et preuves quand ces liens existent.</p>
            {timeline.length === 0 ? (
              <p className="empty p-6 text-center text-sm text-muted">La timeline se remplira avec les dates des engagements, échéances et événements.</p>
            ) : (
              <div className="timeline-layout">
                <div className="timeline">
                  <PhaseTimeline label="Avant — préparation" items={phases.avant} vide="Aucun élément daté avant le début." changerOnglet={changerOnglet} />
                  <PhaseTimeline label="Pendant — en cours" items={phases.pendant} vide="Aucun élément daté sur la période en cours." changerOnglet={changerOnglet} />
                  <PhaseTimeline label="Après — clôture" items={phases.apres} vide="Rien après le terme pour l’instant." changerOnglet={changerOnglet} />
                </div>
                <aside className="timeline-aside">
                  <div className="card p-3.5">
                    <p className="text-xs font-bold uppercase tracking-widest text-faint">Répartition</p>
                    <p className="mt-1.5 text-sm text-muted">Avant : <strong className="text-ink">{phases.avant.length}</strong></p>
                    <p className="text-sm text-muted">Pendant : <strong className="text-ink">{phases.pendant.length}</strong></p>
                    <p className="text-sm text-muted">Après : <strong className="text-ink">{phases.apres.length}</strong></p>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      )}

      {onglet === 'relations' && <OngletRelations objetId={objet.id} relations={d.relations} annuaire={d.parties} onChange={() => d.rechargerTable('relations')} />}
      {onglet === 'engagements' && (
        <OngletEngagements
          objetId={objet.id} engagements={d.engagements} liens={liensAdapt}
          echeances={d.echeances} evenements={d.evenements} preuves={d.preuves}
          onChange={() => {
            d.rechargerTable('engagements');
            d.rechargerTable('echeances');
            d.rechargerTable('evenements');
            d.rechargerTable('preuves');
          }}
        />
      )}
      {onglet === 'evenements' && <OngletEvenements objetId={objet.id} evenements={d.evenements} engagements={d.engagements} preuves={d.preuves} onChange={() => d.rechargerTable('evenements')} />}
      {onglet === 'echeances' && <OngletEcheances objetId={objet.id} echeances={d.echeances} engagements={d.engagements} devise={objet.devise} onChange={() => d.rechargerTable('echeances')} />}
      {onglet === 'preuves' && <OngletPreuves objetId={objet.id} preuves={d.preuves} engagements={d.engagements} evenements={d.evenements} onChange={() => d.rechargerTable('preuves')} />}
      {onglet === 'donnees' && <OngletMetriques objetId={objet.id} metriques={d.metriques} onChange={() => d.rechargerTable('metriques')} />}
      {onglet === 'alertes' && (
        <OngletAlertes contrat={{ id: objet.id, pays: objet.pays, droit_applicable: objet.droit_applicable, devise: objet.devise, montant_total: objet.valeur_declaree, statut: objet.statut, date_debut: objet.date_debut, date_fin: objet.date_fin }}
          donnees={{ contrat: { id: objet.id, pays: objet.pays, droit_applicable: objet.droit_applicable, devise: objet.devise, montant_total: objet.valeur_declaree, statut: objet.statut, date_debut: objet.date_debut, date_fin: objet.date_fin }, engagements: d.engagements, echeances: d.echeances, evenements: d.evenements, preuves: d.preuves, clauses: [], parties: [], versions: [], entiteRacine: 'objet' }}
          alertes={d.alertes}
          onChange={() => { d.rechargerTable('alertes'); d.rechargerTable('actions'); d.rechargerTable('objet'); }} />
      )}
      {onglet === 'scenarios' && (
        <OngletScenarios objetId={objet.id} scenarios={d.scenarios}
          ctx={{ engagements: d.engagements, echeances: d.echeances, evenements: d.evenements, clauses: [], preuves: d.preuves }}
          droit={objet.droit_applicable}
          onChange={() => { d.rechargerTable('scenarios'); d.rechargerTable('actions'); }} />
      )}
      {onglet === 'actions' && (
        <OngletActions objetId={objet.id} actions={d.actions} echeances={d.echeances} evenements={d.evenements} engagements={d.engagements}
          dateFin={objet.date_fin} statutContrat={objet.statut || 'actif'} onChange={() => d.rechargerTable('actions')} />
      )}
      {onglet === 'decisions' && <OngletDecisions objetId={objet.id} decisions={d.decisions} onChange={() => d.rechargerTable('decisions')} />}

      {modalInfo && (
        <Modal large titre="Informations de l’objet" sousTitre="Pays et droit applicable : essentiels pour contextualiser le suivi." onClose={() => setModalInfo(false)}>
          <div className="space-y-4">
            <Prudence compact />
            <Field label="Titre *"><input value={form.titre || ''} onChange={(e) => setForm({ ...form, titre: e.target.value })} className={inputCls} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Statut">
                <select value={form.statut || 'brouillon'} onChange={(e) => setForm({ ...form, statut: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  {['brouillon', 'actif', 'suspendu', 'termine', 'archive'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Valeur déclarée"><input value={form.valeur_declaree} onChange={(e) => setForm({ ...form, valeur_declaree: e.target.value })} inputMode="decimal" className={inputCls} /></Field>
            </div>
            <Field label="Description"><textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputCls} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Pays"><input value={form.pays || ''} onChange={(e) => setForm({ ...form, pays: e.target.value })} className={inputCls} /></Field>
              <Field label="Droit applicable"><input value={form.droit_applicable || ''} onChange={(e) => setForm({ ...form, droit_applicable: e.target.value })} className={inputCls} /></Field>
              <Field label="Devise"><input value={form.devise || ''} onChange={(e) => setForm({ ...form, devise: e.target.value })} className={inputCls} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Début"><input type="date" value={form.date_debut || ''} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} className={inputCls} /></Field>
              <Field label="Fin"><input type="date" value={form.date_fin || ''} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} className={inputCls} /></Field>
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

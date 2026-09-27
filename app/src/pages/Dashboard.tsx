import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, FileText, AlertTriangle, CalendarClock, Plus,
  ArrowRight, ShieldAlert, BadgeCheck, Activity, Scale, Sparkles, Globe2,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Contrat, Echeance, Alerte, Evenement, Objet } from '../lib/types';
import { fmtDate, fmtMontant, joursRestants, delaiHumain } from '../lib/format';
import { Spinner, BadgeSante, BadgeStatut, Prudence, SectionTitre, Btn } from '../components/ui';

export default function Dashboard() {
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [objets, setObjets] = useState<Objet[]>([]);
  const [echeances, setEcheances] = useState<Echeance[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    (async () => {
      try {
        // Échéances, alertes et événements sont désormais communs aux
        // contrats et aux objets du moteur universel (une même table,
        // rattachée soit à contrat_id, soit à objet_id).
        const [c, o, e, a, evs] = await Promise.all([
          api.contrats.list(),
          api.objets.list(),
          api.echeances.list(),
          api.alertes.list({ statut: 'active' }),
          api.evenements.list(),
        ]);
        setContrats(c);
        setObjets(o);
        setEcheances(e);
        setAlertes(a);
        setEvenements(evs.slice(0, 6));
      } catch (err: any) {
        setErreur(err.message || 'Chargement impossible');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const nomEntite = (x: { contrat_id: number | null; objet_id: number | null }) => x.contrat_id
    ? (contrats.find((c) => c.id === x.contrat_id)?.titre || `Contrat #${x.contrat_id}`)
    : (objets.find((o) => o.id === x.objet_id)?.titre || `Objet #${x.objet_id}`);
  const lienEntite = (x: { contrat_id: number | null; objet_id: number | null }, onglet: string) => x.contrat_id
    ? `/contrats/${x.contrat_id}?onglet=${onglet}`
    : `/objets/${x.objet_id}?onglet=${onglet}`;

  const stats = useMemo(() => {
    const actifs = contrats.filter((c) => c.statut === 'actif').length;
    const critiques = contrats.filter((c) => c.sante === 'critique').length;
    const attention = contrats.filter((c) => c.sante === 'attention').length;
    const montant = contrats.filter((c) => c.statut === 'actif').reduce((s, c) => s + (c.montant_total || 0), 0);
    return { total: contrats.length, actifs, critiques, attention, montant };
  }, [contrats]);

  const prochaines = useMemo(() => {
    return echeances
      .filter((e) => e.statut !== 'realisee' && e.statut !== 'annulee' && e.date_limite)
      .map((e) => ({ ...e, j: joursRestants(e.date_limite) ?? 9999 }))
      .sort((a, b) => a.j - b.j)
      .slice(0, 6);
  }, [echeances]);


  if (loading) return <Spinner label="Ouverture du centre de pilotage…" />;
  if (erreur) return (
    <div className="rounded border border-critique bg-critique-soft p-6 text-sm text-critique">
      <p className="font-semibold">Impossible de charger les données.</p>
      <p className="mt-1">{erreur}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Héro */}
      <div className="hero-band">
        <p className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LayoutDashboard className="h-4 w-4" /> Centre de pilotage
        </p>
        <h1>Chaque pacte est un <em>organisme vivant</em>.</h1>
        <p>
          CONTRAT → PARTIES → ENGAGEMENTS → CONDITIONS → ÉVÉNEMENTS → ÉCHÉANCES → PREUVES → ALERTES →
          ACTIONS → HISTORIQUE → DOSSIER. Le même moteur relie aussi vos projets, œuvres, actifs et carrières —
          quel que soit l'univers, ce qui a été promis, ce qui se passe et ce qui reste à prouver reste traçable.
        </p>
        <div className="hero-actions">
          <Link to="/nouveau"><Btn><Plus className="h-4 w-4" /> Nouveau pacte</Btn></Link>
          <Link to="/nouveau?mode=situation"><Btn variant="soft"><Sparkles className="h-4 w-4" /> Il vient de se passer quelque chose</Btn></Link>
          <Link to="/univers"><Btn variant="ghost"><Globe2 className="h-4 w-4" /> Explorer les univers</Btn></Link>
        </div>
        <div className="hero-stats">
          <Stat chiffre={String(stats.total)} label="Contrats" />
          <Stat chiffre={String(objets.length)} label="Objets suivis" />
          <Stat chiffre={String(stats.attention)} label="À surveiller" accent="attention" />
          <Stat chiffre={String(stats.critiques)} label="Critiques" accent="critique" />
        </div>
      </div>

      <Prudence compact />

      {/* Contrats + échéances */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SectionTitre
            icon={<FileText className="h-5 w-5" />}
            titre="Contrats suivis"
            sous="Santé calculée par le moteur de cohérence : engagements, échéances, événements, preuves."
            action={<Link to="/contrats" className="inline-flex items-center gap-1 text-sm font-medium text-fuchsia hover:text-fuchsia-600">Tout voir <ArrowRight className="h-4 w-4" /></Link>}
          />
          {contrats.length === 0 ? (
            <div className="empty p-8 text-center">
              <Scale className="mx-auto mb-3 h-8 w-8 text-faint" />
              <p className="font-medium text-ink">Aucun contrat pour l’instant</p>
              <p className="mt-1 text-sm text-muted">Créez votre premier engagement en 2 minutes, guidé pas à pas.</p>
              <Link to="/nouveau" className="mt-4 inline-block"><Btn><Plus className="h-4 w-4" /> Créer un contrat</Btn></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {contrats.slice(0, 5).map((c) => (
                <Link key={c.id} to={`/contrats/${c.id}`} className="group block card p-4 transition hover:border-fuchsia-300 hover:bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink group-hover:text-fuchsia-600">{c.titre}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {[c.domaine, c.pays || c.droit_applicable, c.montant_total ? fmtMontant(c.montant_total, c.devise || 'EUR') : null].filter(Boolean).join(' · ') || 'Brouillon en cours'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <BadgeStatut statut={c.statut} />
                      <BadgeSante sante={c.sante} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {stats.montant > 0 && (
            <p className="mt-3 text-sm text-muted">
              Montants suivis (contrats actifs) : <strong className="text-ink">{fmtMontant(stats.montant)}</strong>
              <span className="text-faint"> — indicatif, devises mélangées possibles.</span>
            </p>
          )}
        </div>

        <div className="lg:col-span-2">
          <SectionTitre
            icon={<CalendarClock className="h-5 w-5" />}
            titre="Prochaines échéances"
            sous="Tous contrats confondus."
          />
          <div className="space-y-2.5">
            {prochaines.length === 0 && <p className="card p-5 text-sm text-muted">Aucune échéance à venir. Ajoutez des échéances à vos contrats pour les voir ici.</p>}
            {prochaines.map((e) => (
              <Link key={e.id} to={lienEntite(e, 'echeances')} className="block card p-3.5 transition hover:border-fuchsia-300">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-ink">{e.titre || 'Échéance'}</p>
                  <Delai j={e.j} />
                </div>
                <p className="mt-1 truncate text-xs text-faint">{nomEntite(e)} · {fmtDate(e.date_limite)}{e.montant ? ` · ${fmtMontant(e.montant, e.devise || 'EUR')}` : ''}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Alertes + activité */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionTitre
            icon={<AlertTriangle className="h-5 w-5" />}
            titre="Alertes actives"
            sous="Issues du moteur de cohérence. Les faits d’abord, jamais de certitudes juridiques."
            action={<Link to="/alertes" className="inline-flex items-center gap-1 text-sm font-medium text-fuchsia hover:text-fuchsia-600">Tout voir <ArrowRight className="h-4 w-4" /></Link>}
          />
          <div className="space-y-2.5">
            {alertes.length === 0 && (
              <div className="flex items-center gap-3 rounded border border-success bg-success-soft p-4 text-sm text-success">
                <BadgeCheck className="h-5 w-5 shrink-0" /> Aucune alerte active. Le moteur veille : ouvrez un contrat pour lancer l’analyse.
              </div>
            )}
            {alertes.slice(0, 4).map((a) => (
              <Link key={a.id} to={lienEntite(a, 'alertes')} className="block card p-3.5 transition hover:border-fuchsia-300">
                <div className="flex items-center gap-2">
                  {a.gravite === 'critique'
                    ? <ShieldAlert className="h-4 w-4 shrink-0 text-critique" />
                    : <AlertTriangle className="h-4 w-4 shrink-0 text-fuchsia" />}
                  <p className="truncate text-sm font-medium text-ink">{a.titre}</p>
                </div>
                <p className="mt-1 truncate text-xs text-faint">{nomEntite(a)}</p>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <SectionTitre
            icon={<Activity className="h-5 w-5" />}
            titre="Activité récente"
            sous="Derniers événements enregistrés sur l’ensemble des contrats."
            action={<Link to="/evenements" className="inline-flex items-center gap-1 text-sm font-medium text-fuchsia hover:text-fuchsia-600">Journal global <ArrowRight className="h-4 w-4" /></Link>}
          />
          <div className="space-y-2.5">
            {evenements.length === 0 && <p className="card p-5 text-sm text-muted">Aucun événement enregistré pour l’instant.</p>}
            {evenements.map((ev) => (
              <Link key={ev.id} to={lienEntite(ev, 'evenements')} className="block card p-3.5 transition hover:border-fuchsia-300">
                <p className="truncate text-sm font-medium text-ink">{ev.titre || 'Événement'}</p>
                <p className="mt-1 truncate text-xs text-faint">{nomEntite(ev)} · {fmtDate(ev.date_evenement || ev.created_at, true)}{ev.auteur ? ` · ${ev.auteur}` : ''}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ chiffre, label, accent }: { chiffre: string; label: string; accent?: 'success' | 'attention' | 'critique' }) {
  const color = accent === 'success' ? '#5fd6a4' : accent === 'attention' ? '#f7a9cf' : accent === 'critique' ? '#ff8fa8' : '#fff';
  return (
    <div className="hero-stat">
      <strong style={{ color }}>{chiffre}</strong>
      <small>{label}</small>
    </div>
  );
}

function Delai({ j }: { j: number }) {
  if (j < 0) return <span className="shrink-0 rounded-full bg-critique-soft px-2.5 py-0.5 text-xs font-semibold text-critique">{delaiHumain(j)}</span>;
  if (j <= 7) return <span className="shrink-0 rounded-full bg-fuchsia-100 px-2.5 py-0.5 text-xs font-semibold text-fuchsia">{delaiHumain(j)}</span>;
  return <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-xs text-muted">{delaiHumain(j)}</span>;
}

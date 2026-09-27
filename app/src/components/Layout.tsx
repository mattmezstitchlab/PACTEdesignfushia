import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, GitBranch, Bell, FolderOpen,
  Plus, Scale, Menu, X, FlaskConical, Layers, ShieldCheck, Sparkles,
  Globe2, Boxes, ArrowLeft,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const LIENS = [
  { to: '/', label: 'Pilotage', icon: LayoutDashboard, exact: true },
  { to: '/univers', label: 'Univers', icon: Globe2 },
  { to: '/contrats', label: 'Contrats & pactes', icon: FileText },
  { to: '/objets', label: 'Objets suivis', icon: Boxes },
  { to: '/parties', label: 'Parties', icon: Users },
  { to: '/modeles', label: 'Modèles', icon: Layers },
  { to: '/evenements', label: 'Événements', icon: GitBranch },
  { to: '/alertes', label: 'Alertes', icon: Bell },
  { to: '/dossiers', label: 'Dossiers & litiges', icon: FolderOpen },
  { to: '/analyse', label: 'Analyser un document', icon: FlaskConical },
];

// PACTE distingue deux registres (Phase 6) :
// — DÉCOUVERTE (/decouvrir, /univers/:code) : immersion éditoriale, chrome
//   applicatif masqué, remplacé par une barre flottante minimale (logo ou
//   retour + menu) qui ouvre la même navigation en overlay.
// — APPLICATION (tout le reste) : sidebar + topbar denses, inchangées.
// Aucune route n'est dupliquée, aucune fonctionnalité n'est retirée : la
// navigation complète reste à un clic (bouton menu) depuis n'importe quelle
// page immersive.
export default function Layout({ children }: { children: React.ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  const [alertesActives, setAlertesActives] = useState(0);
  const loc = useLocation();

  const universDetail = /^\/univers\/[^/]+$/.test(loc.pathname);
  const chromeless = loc.pathname === '/decouvrir' || universDetail;

  // Referme le menu quand on change de page — ajustement d'état pendant le
  // rendu (motif recommandé par React) plutôt qu'un effet qui déclenche un
  // rendu en cascade.
  const [dernierChemin, setDernierChemin] = useState(loc.pathname);
  if (loc.pathname !== dernierChemin) {
    setDernierChemin(loc.pathname);
    setOuvert(false);
  }

  useEffect(() => {
    api.alertes.list({ statut: 'active' }).then((a) => setAlertesActives(a.length)).catch(() => {});
  }, [loc.pathname]);

  // Échap referme le menu ouvert en overlay (pertinent surtout sur les
  // pages immersives, où la sidebar n'est jamais visible autrement).
  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOuvert(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ouvert]);

  const titreCourant = LIENS.find((l) => (l.exact ? loc.pathname === l.to : loc.pathname.startsWith(l.to)))?.label
    || (loc.pathname.startsWith('/contrats/') ? 'Fiche contrat' : loc.pathname.startsWith('/nouveau') ? 'Nouveau pacte' : loc.pathname.startsWith('/regles-ia') ? 'Règles & transparence IA' : 'PACTE');

  return (
    <div className="app-shell">
      {ouvert && <div className="sidebar-backdrop no-print" onClick={() => setOuvert(false)} />}
      {/* Sur les pages immersives, la sidebar est hors-écran en permanence
          tant qu'elle n'est pas ouverte : inert évite que le clavier/lecteur
          d'écran y accède avant la barre flottante visible (ordre de
          tabulation correct). */}
      <aside
        className={`sidebar no-print ${ouvert ? 'sidebar-open' : ''} ${chromeless ? 'sidebar-immersive' : ''}`}
        {...(chromeless && !ouvert ? { inert: true } : {})}
      >
        <div className="sidebar-top">
          <Link to="/" className="logo">
            <span className="logo-mark">P<span className="logo-dot">.</span></span>
            PACTE
          </Link>
          <button onClick={() => setOuvert(false)} className="icon-button" aria-label="Fermer le menu" style={{ color: '#fff', display: ouvert ? 'grid' : 'none' }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <Link to="/decouvrir" className="sidebar-discover no-print">
          <Sparkles className="h-3.5 w-3.5" /> Découvrir PACTE
        </Link>

        <p className="sidebar-label">Naviguer</p>
        <nav className="side-nav">
          {LIENS.map((l) => (
            <NavLink key={l.to} to={l.to} end={!!l.exact}
              className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
              <l.icon className="h-4 w-4" /> {l.label}
              {l.to === '/alertes' && alertesActives > 0 && <span className="nav-count">{alertesActives}</span>}
            </NavLink>
          ))}
        </nav>

        <p className="sidebar-label" style={{ marginTop: 28 }}>Gouvernance</p>
        <nav className="side-nav">
          <NavLink to="/regles-ia" className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
            <ShieldCheck className="h-4 w-4" /> Règles & transparence IA
          </NavLink>
        </nav>

        <div className="sidebar-secondary">
          <Link to="/nouveau" className="btn btn-pink full" style={{ marginBottom: 10 }}>
            <Plus className="h-4 w-4" /> Nouveau pacte
          </Link>
          <div className="sidebar-note">
            <strong>Positionnement</strong>
            PACTE organise faits, clauses et preuves. Il n'invente aucune loi, ne promet aucune issue judiciaire
            et signale quand un professionnel doit valider.
          </div>
        </div>
      </aside>

      <div className="app-main">
        {chromeless ? (
          <div className="immersive-bar no-print">
            {universDetail ? (
              <Link to="/univers" className="immersive-back"><ArrowLeft className="h-4 w-4" /> Univers</Link>
            ) : (
              <Link to="/" className="immersive-logo" aria-label="Aller au tableau de bord PACTE">P<span className="logo-dot">.</span></Link>
            )}
            <button className="immersive-menu-btn" onClick={() => setOuvert(true)} aria-label="Ouvrir le menu">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <header className="app-topbar no-print">
            <div className="flex items-center gap-3">
              <button className="mobile-menu-btn" onClick={() => setOuvert(true)} aria-label="Ouvrir le menu"><Menu className="h-5 w-5" /></button>
              <p className="breadcrumb">{titreCourant}</p>
            </div>
            <div className="top-right">
              <Link to="/nouveau?mode=situation" className="btn btn-outline btn-sm" title="Signaler une situation" aria-label="Signaler une situation">
                <Sparkles className="h-4 w-4" /> <span className="hidden sm:inline">Signaler une situation</span>
              </Link>
              <Link to="/nouveau" className="btn btn-pink btn-sm" title="Nouveau pacte" aria-label="Nouveau pacte">
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nouveau pacte</span>
              </Link>
            </div>
          </header>
        )}

        <main className={chromeless ? 'app-content-immersive' : 'app-content'}>{children}</main>

        <footer className={`app-footer no-print ${chromeless ? 'app-footer-minimal' : ''}`}>
          <span>PACTE — un moteur universel pour tout accord structuré · vos données restent la source de vérité.</span>
          <span className="flex items-center gap-1.5"><Scale className="h-3.5 w-3.5" /> Information générale, pas un avis juridique.</span>
        </footer>
      </div>
    </div>
  );
}

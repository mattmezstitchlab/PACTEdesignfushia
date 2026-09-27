import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, GitBranch, Bell, FolderOpen,
  Plus, Scale, Menu, X, FlaskConical, Layers, ShieldCheck, Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const LIENS = [
  { to: '/', label: 'Pilotage', icon: LayoutDashboard, exact: true },
  { to: '/contrats', label: 'Contrats & pactes', icon: FileText },
  { to: '/parties', label: 'Parties', icon: Users },
  { to: '/modeles', label: 'Modèles', icon: Layers },
  { to: '/evenements', label: 'Événements', icon: GitBranch },
  { to: '/alertes', label: 'Alertes', icon: Bell },
  { to: '/dossiers', label: 'Dossiers & litiges', icon: FolderOpen },
  { to: '/analyse', label: 'Analyser un document', icon: FlaskConical },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  const [alertesActives, setAlertesActives] = useState(0);
  const loc = useLocation();

  useEffect(() => { setOuvert(false); }, [loc.pathname]);
  useEffect(() => {
    api.alertes.list({ statut: 'active' }).then((a) => setAlertesActives(a.length)).catch(() => {});
  }, [loc.pathname]);

  const titreCourant = LIENS.find((l) => (l.exact ? loc.pathname === l.to : loc.pathname.startsWith(l.to)))?.label
    || (loc.pathname.startsWith('/contrats/') ? 'Fiche contrat' : loc.pathname.startsWith('/nouveau') ? 'Nouveau pacte' : loc.pathname.startsWith('/regles-ia') ? 'Règles & transparence IA' : 'PACTE');

  return (
    <div className="app-shell">
      {ouvert && <div className="sidebar-backdrop no-print" onClick={() => setOuvert(false)} />}
      <aside className={`sidebar no-print ${ouvert ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top">
          <Link to="/" className="logo">
            <span className="logo-mark">P<span className="logo-dot">.</span></span>
            PACTE
          </Link>
          <button onClick={() => setOuvert(false)} className="icon-button" style={{ color: '#fff', display: ouvert ? 'grid' : 'none' }}>
            <X className="h-5 w-5" />
          </button>
        </div>

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
        <header className="app-topbar no-print">
          <div className="flex items-center gap-3">
            <button className="mobile-menu-btn" onClick={() => setOuvert(true)}><Menu className="h-5 w-5" /></button>
            <p className="breadcrumb">{titreCourant}</p>
          </div>
          <div className="top-right">
            <Link to="/nouveau?mode=situation" className="btn btn-outline btn-sm">
              <Sparkles className="h-4 w-4" /> Signaler une situation
            </Link>
            <Link to="/nouveau" className="btn btn-pink btn-sm">
              <Plus className="h-4 w-4" /> Nouveau pacte
            </Link>
          </div>
        </header>

        <main className="app-content">{children}</main>

        <footer className="app-footer no-print">
          <span>PACTE — un moteur universel pour tout accord structuré · vos données restent la source de vérité.</span>
          <span className="flex items-center gap-1.5"><Scale className="h-3.5 w-3.5" /> Information générale, pas un avis juridique.</span>
        </footer>
      </div>
    </div>
  );
}

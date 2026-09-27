import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe2, ArrowUpRight } from 'lucide-react';
import { api } from '../lib/api';
import type { Objet } from '../lib/types';
import { UNIVERS } from '../lib/univers';
import { Spinner } from '../components/ui';

// Portes d'entrée éditoriales : chaque Univers n'est pas une application
// séparée mais une configuration du même moteur (voir src/lib/univers.ts).
// Cette page assume une densité « découverte », volontairement plus basse
// que le Dashboard : grandes compositions typographiques et chromatiques,
// pas de tableau de bord ni d'accumulation de badges.
export default function Univers() {
  const [objets, setObjets] = useState<Objet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.objets.list().then(setObjets).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const compte = (code: string) => objets.filter((o) => o.univers === code).length;

  if (loading) return <Spinner label="Chargement des univers…" />;

  return (
    <div className="space-y-8">
      <div className="editorial-hero reveal">
        <span className="eyebrow">{UNIVERS.length} univers · un seul moteur</span>
        <h1>Un moteur. <em>Dix-neuf mondes.</em></h1>
        <p className="lede">
          Chaque univers est une porte d’entrée vers ce que PACTE peut organiser pour vous : relier des personnes,
          suivre des objets, dater des événements, verser des preuves, observer des données, examiner des scénarios —
          et vous laisser décider. Aucun univers n’est une application séparée : c’est la même source de vérité,
          configurée pour votre domaine.
        </p>
      </div>

      <div className="gate-grid">
        {UNIVERS.map((u, i) => (
          <Link
            key={u.code}
            to={`/univers/${u.code}`}
            className="gate-panel reveal"
            style={{ ['--u-color' as any]: u.couleur, animationDelay: `${Math.min(i, 8) * 40}ms` }}
          >
            <span className="gate-panel-media">
              {u.media?.cover ? (
                <img src={u.media.cover} alt={u.media.alt || u.nom} loading="lazy" />
              ) : (
                <span className="gate-panel-fallback" data-letter={u.nom[0]} aria-hidden="true" />
              )}
            </span>
            <span className="gate-panel-scrim" aria-hidden="true" />
            <span className="gate-panel-body">
              <span className="gate-panel-eyebrow">{compte(u.code) > 0 ? `${compte(u.code)} objet(s) suivi(s)` : 'Univers disponible'}</span>
              <h3>{u.nom}</h3>
              <p>{u.manifeste}</p>
              <span className="gate-vocab">
                {u.vocabulaire.slice(0, 4).map((v) => <span key={v}>{v}</span>)}
              </span>
              <span className="gate-panel-cta">Explorer cet univers <ArrowUpRight className="h-3.5 w-3.5" /></span>
            </span>
          </Link>
        ))}
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="flex items-center gap-2 text-sm text-muted"><Globe2 className="h-4 w-4 text-fuchsia" /> Vous ne trouvez pas votre univers ? Le moteur reste le même : créez un objet et choisissez la configuration la plus proche.</p>
        <Link to="/objets/nouveau" className="btn btn-pink btn-sm">Créer un objet</Link>
      </div>
    </div>
  );
}

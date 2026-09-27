import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe2, ArrowRight, Plus } from 'lucide-react';
import { api } from '../lib/api';
import type { Objet } from '../lib/types';
import { UNIVERS } from '../lib/univers';
import { Spinner } from '../components/ui';

// Catalogue des univers : ce ne sont pas des applications séparées mais
// des configurations (libellés, types d'objets suggérés, points de
// vigilance) du même moteur Objet/Relation/Engagement/Événement/Preuve/
// Alerte/Scénario/Décision — le contrat en est le cas historique.
export default function Univers() {
  const [objets, setObjets] = useState<Objet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.objets.list().then(setObjets).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const compte = (code: string) => objets.filter((o) => o.univers === code).length;

  if (loading) return <Spinner label="Chargement des univers…" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink sm:text-3xl"><Globe2 className="h-6 w-6 text-fuchsia" /> Univers</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          {UNIVERS.length} univers — chacun n’est qu’une configuration du même moteur : mêmes relations, mêmes engagements,
          mêmes échéances, mêmes preuves, mêmes alertes, mêmes scénarios. Aucun univers n’est une application séparée.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {UNIVERS.map((u) => {
          const n = compte(u.code);
          return (
            <div key={u.code} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 h-9 w-1.5 shrink-0 rounded-full" style={{ background: u.couleur }} />
                  <div>
                    <p className="font-semibold text-ink">{u.nom}</p>
                    <p className="mt-0.5 text-xs text-faint">{n} objet(s) suivi(s)</p>
                  </div>
                </div>
              </div>
              <p className="mt-3 flex-1 text-sm text-muted">{u.description}</p>
              {u.vigilance[0] && <p className="mt-3 rounded-sm bg-fuchsia-50 p-2.5 text-xs text-fuchsia-700">{u.vigilance[0]}</p>}
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <Link to={`/objets?univers=${u.code}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-fuchsia hover:underline">
                  Voir les objets <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link to={`/objets/nouveau?univers=${u.code}`} className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink">
                  <Plus className="h-3.5 w-3.5" /> Ajouter
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

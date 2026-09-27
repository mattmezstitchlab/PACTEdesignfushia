import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowUpRight, Plus, ShieldAlert } from 'lucide-react';
import { api } from '../lib/api';
import type { Objet } from '../lib/types';
import { universParCode } from '../lib/univers';
import { fmtDate, fmtMontant } from '../lib/format';
import { Spinner, BadgeSante, BadgeStatut, Empty } from '../components/ui';

// « CONTEXTE » — la page immersive d'un univers (étape entre la Landing
// et l'application réelle). Toujours la même structure de données
// (src/lib/univers.ts) : aucun composant ni route par métier.
//
// Phase 6 : chrome applicatif masqué par Layout (barre flottante
// « ← Univers » + menu) pour une immersion complète sous la photo ;
// palette stricte noir / blanc, sans teinte par univers ; plus aucun
// bouton fuchsia sur cette page (le seul CTA reste noir).
export default function UniversDetail() {
  const { code } = useParams();
  const u = universParCode(code);
  const [objets, setObjets] = useState<Objet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.objets.list({ univers: u.code }).then(setObjets).catch(() => setObjets([])).finally(() => setLoading(false));
  }, [u.code]);

  return (
    <div>
      <div className="univers-hero reveal">
        <span className="univers-hero-media" aria-hidden="true">
          {u.media?.cover ? <img src={u.media.cover} alt={u.media.alt || u.nom} fetchPriority="high" decoding="async" /> : <span className="univers-hero-fallback" />}
        </span>
        <span className="univers-hero-scrim" aria-hidden="true" />
        {u.media?.credit && <span className="univers-credit">{u.media.credit}</span>}
        <div className="univers-hero-body">
          <span className="eyebrow">Univers · {objets.length} objet(s) suivi(s)</span>
          <h1>{u.nom}</h1>
          <p className="lede">{u.manifeste}</p>
        </div>
      </div>

      {/* Ordre volontaire — y compris en pile mobile : structurer → exemples →
          objets déjà suivis → vigilance → entrer dans l'univers (CTA en dernier). */}
      <div className="univers-detail-body">
        <div className="detail-grid">
          <div className="space-y-8">
            <div>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">Ce que PACTE peut structurer ici</h2>
              <p className="mb-4 text-sm text-muted" style={{ maxWidth: '62ch', lineHeight: 1.7 }}>{u.description}</p>
              <ul className="univers-vocab-plain">
                {u.vocabulaire.map((v) => <li key={v}>{v}</li>)}
              </ul>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">Le même moteur, ici comme partout</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
                {['Objets', 'Relations', 'Engagements', 'Événements', 'Preuves', 'Données', 'Analyses', 'Scénarios', 'Décisions'].map((b) => (
                  <span key={b} className="rounded-sm border border-line bg-white px-2.5 py-2 text-center text-[11px] font-semibold text-muted">{b}</span>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">Exemples</h2>
              <ul className="space-y-2.5">
                {u.exemples.map((ex) => (
                  <li key={ex} className="flex gap-2.5 text-sm text-muted"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--n-graphite)' }} /> {ex}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-3 font-display text-base font-semibold text-ink">Objets déjà suivis</h2>
              {loading ? <Spinner label="Chargement…" /> : objets.length === 0 ? (
                <Empty titre="Aucun objet pour l’instant" texte="Créez le premier objet de cet univers." />
              ) : (
                <div className="space-y-2">
                  {objets.slice(0, 6).map((o) => (
                    <Link key={o.id} to={`/objets/${o.id}`} className="block card p-3 transition hover:border-fuchsia-300">
                      <p className="truncate text-sm font-medium text-ink">{o.titre}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-faint">
                        <BadgeStatut statut={o.statut} /> <BadgeSante sante={o.sante} />
                        {o.valeur_declaree != null && <span>· {fmtMontant(o.valeur_declaree, o.devise || 'EUR')}</span>}
                      </p>
                      <p className="mt-1 text-[11px] text-faint">Créé le {fmtDate(o.created_at)}</p>
                    </Link>
                  ))}
                  {objets.length > 6 && (
                    <Link to={`/objets?univers=${u.code}`} className="link-more justify-center">Voir les {objets.length} objets <ArrowUpRight className="h-3.5 w-3.5" /></Link>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="notice">
              <ShieldAlert className="h-[18px] w-[18px]" />
              <p><strong>Point de vigilance</strong> {u.vigilance[0]}</p>
            </div>

            <div>
              <h2 className="mb-3 font-display text-base font-semibold text-ink">Entrer dans cet univers</h2>
              <div className="flex flex-col gap-2">
                <Link to={`/objets/nouveau?univers=${u.code}`} className="btn btn-dark full"><Plus className="h-4 w-4" /> Créer un objet {u.nom.toLowerCase()}</Link>
                <Link to={`/objets?univers=${u.code}`} className="btn btn-outline full">Voir les objets suivis <ArrowUpRight className="h-4 w-4" /></Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

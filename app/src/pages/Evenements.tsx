import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, Search } from 'lucide-react';
import { api } from '../lib/api';
import type { Contrat, Evenement } from '../lib/types';
import { fmtDate, typeEvenementLabel } from '../lib/format';
import { Spinner, Empty, inputCls } from '../components/ui';

// Journal global : tous les événements, tous contrats confondus.
export default function Evenements() {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filtre, setFiltre] = useState('');

  useEffect(() => {
    Promise.all([api.evenements.list(), api.contrats.list()])
      .then(([evs, cs]) => { setEvenements(evs); setContrats(cs); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const types = useMemo(() => [...new Set(evenements.map((e) => e.type || 'autre'))], [evenements]);

  const liste = evenements
    .filter((e) => !filtre || e.type === filtre)
    .filter((e) => {
      if (!q.trim()) return true;
      const c = contrats.find((x) => x.id === e.contrat_id)?.titre || '';
      return `${e.titre} ${e.description || ''} ${c}`.toLowerCase().includes(q.trim().toLowerCase());
    })
    .sort((a, b) => new Date(b.date_evenement || b.created_at).getTime() - new Date(a.date_evenement || a.created_at).getTime());

  if (loading) return <Spinner label="Chargement du journal…" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Journal des événements</h1>
        <p className="mt-1 text-sm text-muted">{evenements.length} événement(s) · tous contrats confondus, du plus récent au plus ancien.</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (titre, description, contrat…)" className={`${inputCls} pl-10`} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFiltre('')} className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium ${filtre === '' ? 'bg-fuchsia text-white' : 'bg-white text-muted hover:text-ink'}`}>Tous</button>
          {types.map((t) => (
            <button key={t} onClick={() => setFiltre(filtre === t ? '' : t)} className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium ${filtre === t ? 'bg-fuchsia text-white' : 'bg-white text-muted hover:text-ink'}`}>
              {typeEvenementLabel(t)}
            </button>
          ))}
        </div>
      </div>

      {liste.length === 0 ? (
        <Empty icon={<History className="h-8 w-8" />} titre="Aucun événement" texte="Les événements enregistrés dans chaque contrat apparaîtront ici." />
      ) : (
        <ol className="relative space-y-3 border-l-2 border-line pl-5">
          {liste.slice(0, 120).map((ev) => (
            <li key={ev.id} className="relative">
              <span className="absolute -left-[27px] top-4 h-3 w-3 rounded-full bg-fuchsia" />
              <Link to={`/contrats/${ev.contrat_id}?onglet=evenements`} className="block card p-4 transition hover:border-fuchsia-300">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-muted">{typeEvenementLabel(ev.type)}</span>
                  <strong className="font-semibold text-ink">{ev.titre}</strong>
                </p>
                <p className="mt-1 text-xs text-faint">
                  {contrats.find((c) => c.id === ev.contrat_id)?.titre || `Contrat #${ev.contrat_id}`} · {fmtDate(ev.date_evenement || ev.created_at, true)}{ev.auteur ? ` · ${ev.auteur}` : ''}
                </p>
                {ev.description && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{ev.description}</p>}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Boxes, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import type { Objet } from '../lib/types';
import { fmtDate, fmtMontant } from '../lib/format';
import { Spinner, BadgeSante, BadgeStatut, Btn, Empty, inputCls } from '../components/ui';
import { UNIVERS, universParCode } from '../lib/univers';

const FILTRES = [
  { v: '', l: 'Tous' },
  { v: 'brouillon', l: 'Brouillons' },
  { v: 'actif', l: 'Actifs' },
  { v: 'suspendu', l: 'Suspendus' },
  { v: 'termine', l: 'Terminés' },
  { v: 'archive', l: 'Archivés' },
];

// Objets suivis — le cas général du moteur universel (le contrat en
// est un cas particulier, listé séparément sous « Contrats & pactes »).
export default function Objets() {
  const [objets, setObjets] = useState<Objet[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filtre, setFiltre] = useState('');
  const [params] = useSearchParams();
  const universInit = params.get('univers') || '';
  const [univers, setUnivers] = useState(universInit);
  const nav = useNavigate();

  useEffect(() => {
    api.objets.list().then(setObjets).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const liste = useMemo(() => objets.filter((o) => {
    if (filtre && o.statut !== filtre) return false;
    if (univers && o.univers !== univers) return false;
    if (!q.trim()) return true;
    const s = `${o.titre} ${o.description || ''} ${o.pays || ''} ${o.type_objet}`.toLowerCase();
    return s.includes(q.trim().toLowerCase());
  }), [objets, filtre, univers, q]);

  if (loading) return <Spinner label="Chargement des objets suivis…" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Objets suivis</h1>
          <p className="mt-1 text-sm text-muted">
            {objets.length} objet(s) · projets, œuvres, actifs, biens, missions, dossiers — le même moteur que les contrats, appliqué à tout ce que vous suivez.
          </p>
        </div>
        <Btn onClick={() => nav('/objets/nouveau')}><Plus className="h-4 w-4" /> Nouvel objet</Btn>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un objet (titre, type, pays…)" className={`${inputCls} pl-10`} />
        </div>
        <select value={univers} onChange={(e) => setUnivers(e.target.value)} className={inputCls + ' cursor-pointer sm:w-56'}>
          <option value="">Tous les univers</option>
          {UNIVERS.map((u) => <option key={u.code} value={u.code}>{u.nom}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTRES.map((f) => (
          <button key={f.v} onClick={() => setFiltre(f.v)} className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition ${filtre === f.v ? 'bg-fuchsia text-white' : 'bg-white text-muted hover:text-ink'}`}>{f.l}</button>
        ))}
      </div>

      {liste.length === 0 ? (
        <Empty
          icon={<Boxes className="h-8 w-8" />}
          titre={objets.length === 0 ? 'Aucun objet suivi pour l’instant' : 'Aucun résultat'}
          texte={objets.length === 0 ? 'Un objet peut être un projet, une œuvre, un actif, un bien, une mission ou un dossier — créez-en un pour commencer à le relier, l’observer et le suivre.' : 'Essayez un autre mot-clé, un autre univers ou un autre filtre.'}
          action={objets.length === 0 ? <Link to="/objets/nouveau"><Btn><Plus className="h-4 w-4" /> Créer mon premier objet</Btn></Link> : undefined}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {liste.map((o) => {
            const u = universParCode(o.univers);
            return (
              <Link key={o.id} to={`/objets/${o.id}`} className="group card p-5 transition hover:border-fuchsia-300 hover:bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 h-10 w-1.5 shrink-0 rounded-full" style={{ background: u?.couleur || '#e2547e' }} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink group-hover:text-fuchsia-600">{o.titre}</p>
                      <p className="mt-0.5 text-xs text-muted">{u?.nom || o.univers} · {o.type_objet}{o.pays ? ` · ${o.pays}` : ''}{o.valeur_declaree ? ` · ${fmtMontant(o.valeur_declaree, o.devise || 'EUR')}` : ''}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-fuchsia" />
                </div>
                {o.description && <p className="mt-3 line-clamp-2 text-sm text-muted">{o.description}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  <BadgeStatut statut={o.statut} />
                  <BadgeSante sante={o.sante} />
                  <span className="ml-auto text-xs text-faint">
                    {o.date_debut ? `${fmtDate(o.date_debut)}${o.date_fin ? ` → ${fmtDate(o.date_fin)}` : ''}` : `Créé le ${fmtDate(o.created_at)}`}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

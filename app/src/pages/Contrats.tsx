import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import type { Contrat } from '../lib/types';
import { fmtDate, fmtMontant } from '../lib/format';
import { Spinner, BadgeSante, BadgeStatut, Btn, Empty, inputCls } from '../components/ui';
import { modeleParCode } from '../lib/modeles';

const FILTRES = [
  { v: '', l: 'Tous' },
  { v: 'brouillon', l: 'Brouillons' },
  { v: 'actif', l: 'Actifs' },
  { v: 'suspendu', l: 'Suspendus' },
  { v: 'termine', l: 'Terminés' },
  { v: 'archive', l: 'Archivés' },
];

export default function Contrats() {
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filtre, setFiltre] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    api.contrats.list().then(setContrats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const liste = contrats.filter((c) => {
    if (filtre && c.statut !== filtre) return false;
    if (!q.trim()) return true;
    const s = `${c.titre} ${c.objet || ''} ${c.domaine || ''} ${c.pays || ''}`.toLowerCase();
    return s.includes(q.trim().toLowerCase());
  });

  if (loading) return <Spinner label="Chargement des contrats…" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Contrats & pactes</h1>
          <p className="mt-1 text-sm text-muted">
            {contrats.length} dossier(s) · chaque contrat est décomposé en données structurées — le document n’en est que la représentation lisible.
          </p>
        </div>
        <Btn onClick={() => nav('/nouveau')}><Plus className="h-4 w-4" /> Nouveau contrat</Btn>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un contrat (titre, objet, pays…)" className={`${inputCls} pl-10`} />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTRES.map((f) => (
            <button
              key={f.v}
              onClick={() => setFiltre(f.v)}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition ${filtre === f.v ? 'bg-fuchsia text-white' : 'bg-white text-muted hover:text-ink'}`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {liste.length === 0 ? (
        <Empty
          icon={<FileText className="h-8 w-8" />}
          titre={contrats.length === 0 ? 'Aucun contrat pour l’instant' : 'Aucun résultat'}
          texte={contrats.length === 0 ? 'Créez votre premier contrat en répondant à quelques questions simples — PACTE structure le reste.' : 'Essayez un autre mot-clé ou un autre filtre.'}
          action={contrats.length === 0 ? <Link to="/nouveau"><Btn><Plus className="h-4 w-4" /> Créer mon premier contrat</Btn></Link> : undefined}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {liste.map((c) => {
            const m = modeleParCode(c.type_modele);
            return (
              <Link key={c.id} to={`/contrats/${c.id}`} className="group card p-5 transition hover:border-fuchsia-300 hover:bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 h-10 w-1.5 shrink-0 rounded-full" style={{ background: m.couleur }} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink group-hover:text-fuchsia-600">{c.titre}</p>
                      <p className="mt-0.5 text-xs text-muted">{m.nom}{c.pays ? ` · ${c.pays}` : ''}{c.montant_total ? ` · ${fmtMontant(c.montant_total, c.devise || 'EUR')}` : ''}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-fuchsia" />
                </div>
                {c.objet && <p className="mt-3 line-clamp-2 text-sm text-muted">{c.objet}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  <BadgeStatut statut={c.statut} />
                  <BadgeSante sante={c.sante} />
                  <span className="ml-auto text-xs text-faint">
                    {c.date_debut ? `${fmtDate(c.date_debut)}${c.date_fin ? ` → ${fmtDate(c.date_fin)}` : ''}` : `Créé le ${fmtDate(c.created_at)}`}
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

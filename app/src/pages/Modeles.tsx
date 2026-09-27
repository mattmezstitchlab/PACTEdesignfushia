import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Plus, Check } from 'lucide-react';
import { MODELES } from '../lib/modeles';
import { Btn, Prudence } from '../components/ui';

// Bibliothèque des modèles : le domaine ne change que les modèles,
// champs, clauses et règles — le moteur reste universel.
export default function Modeles() {
  const nav = useNavigate();
  const [ouvert, setOuvert] = useState<string | null>('pacte_prive');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Bibliothèque de modèles</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Le même moteur universel (engagements, échéances, événements, preuves, alertes, scénarios) s’applique à tous les domaines.
          Seuls les modèles, champs, clauses types et règles changent. Chaque modèle est une trame informative — faites valider les enjeux importants par un professionnel.
        </p>
      </div>

      <Prudence compact />

      <div className="space-y-3">
        {MODELES.map((m) => {
          const estOuvert = ouvert === m.code;
          return (
            <div key={m.code} className={`overflow-hidden rounded border transition ${estOuvert ? 'border-line bg-white' : 'border-line bg-white'}`}>
              <button onClick={() => setOuvert(estOuvert ? null : m.code)} className="flex w-full cursor-pointer items-center gap-4 p-4 text-left sm:p-5">
                <span className="h-12 w-1.5 shrink-0 rounded-full" style={{ background: m.couleur }} />
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-white text-muted">
                  <Layers className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{m.nom}</span>
                  <span className="mt-0.5 block truncate text-sm text-muted">{m.description}</span>
                </span>
                <span className="hidden shrink-0 gap-4 text-center sm:flex">
                  <span><strong className="block text-lg text-ink">{m.clauses.length}</strong><span className="text-[11px] uppercase text-faint">Clauses</span></span>
                  <span><strong className="block text-lg text-ink">{m.engagements.length}</strong><span className="text-[11px] uppercase text-faint">Engagements</span></span>
                  <span><strong className="block text-lg text-ink">{m.roles.length}</strong><span className="text-[11px] uppercase text-faint">Rôles</span></span>
                </span>
              </button>
              {estOuvert && (
                <div className="border-t border-line p-4 sm:p-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Clauses types</p>
                      <ul className="space-y-1.5">
                        {m.clauses.map((c, i) => (
                          <li key={i} className="card px-3 py-2 text-xs text-muted">
                            <span className="font-semibold text-fuchsia-700">{c.categorie}</span> — {c.titre}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Engagements types</p>
                      <ul className="space-y-1.5">
                        {m.engagements.map((e, i) => (
                          <li key={i} className="card px-3 py-2 text-xs text-muted">
                            <Check className="mr-1.5 inline h-3 w-3 text-success" />{e.titre}
                            <span className="block pl-5 text-faint">{e.quand_texte}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Rôles & vigilance</p>
                      <p className="card px-3 py-2 text-xs text-muted">
                        {m.roles.map((r) => `${r.role} (${r.qualite})`).join(' · ')}
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {m.vigilance.map((v, i) => (
                          <li key={i} className="rounded-sm bg-fuchsia-soft px-3 py-2 text-xs text-attention">{v}</li>
                        ))}
                      </ul>
                      <div className="mt-3">
                        <Btn onClick={() => nav(`/nouveau?modele=${m.code}`)}><Plus className="h-4 w-4" /> Utiliser ce modèle</Btn>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-faint">
        Un domaine manque ? Le modèle « Accord universel » couvre tout le reste — <Link to="/nouveau" className="text-fuchsia hover:underline">créer un contrat</Link>.
      </p>
    </div>
  );
}

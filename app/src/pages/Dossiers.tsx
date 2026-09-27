import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { api } from '../lib/api';
import type { Contrat } from '../lib/types';
import { fmtDate } from '../lib/format';
import { Spinner, Empty, BadgeStatut, BadgeSante } from '../components/ui';
import { modeleParCode } from '../lib/modeles';

// Dossiers finaux : prêts à imprimer / exporter quand le contrat est complet.
export default function Dossiers() {
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [compteurs, setCompteurs] = useState<Record<number, { clauses: number; engagements: number; preuves: number; signatures: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const cs = await api.contrats.list();
        setContrats(cs);
        const c: Record<number, { clauses: number; engagements: number; preuves: number; signatures: string }> = {};
        for (const contrat of cs.slice(0, 40)) {
          try {
            const [cls, engs, prs, cps] = await Promise.all([
              api.clauses.list({ contrat_id: contrat.id }),
              api.engagements.list({ contrat_id: contrat.id }),
              api.preuves.list({ contrat_id: contrat.id }),
              api.contratParties.list({ contrat_id: contrat.id }),
            ]);
            const sig = cps.filter((p) => p.signature_statut === 'signee').length;
            c[contrat.id] = { clauses: cls.length, engagements: engs.length, preuves: prs.length, signatures: `${sig}/${cps.length}` };
          } catch { /* ignore un contrat */ }
        }
        setCompteurs(c);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spinner label="Préparation des dossiers…" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Dossiers finaux</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Chaque dossier final est la représentation lisible et imprimable des données structurées : identité, parties, clauses,
          engagements, échéances, journal, preuves, signatures, versions. Un dossier est « prêt » quand il contient des clauses,
          des engagements, des preuves et toutes les signatures.
        </p>
      </div>

      {contrats.length === 0 ? (
        <Empty icon={<FolderOpen className="h-8 w-8" />} titre="Aucun dossier" texte="Créez un contrat pour générer son dossier final." />
      ) : (
        <div className="space-y-3">
          {contrats.map((c) => {
            const k = compteurs[c.id];
            const pret = k && k.clauses > 0 && k.engagements > 0 && k.preuves > 0 && k.signatures.split('/')[0] === k.signatures.split('/')[1] && k.signatures !== '0/0';
            const m = modeleParCode(c.type_modele);
            return (
              <Link key={c.id} to={`/contrats/${c.id}?onglet=dossier`} className="group block card p-5 transition hover:border-fuchsia-300">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ background: m.couleur }} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink group-hover:text-fuchsia-600">{c.titre}</p>
                      <p className="mt-0.5 text-xs text-faint">Mis à jour le {fmtDate(c.updated_at || c.created_at)} · v{c.version_courante || 1}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-2">
                    <BadgeStatut statut={c.statut} />
                    <BadgeSante sante={c.sante} />
                    {k ? (
                      pret
                        ? <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Dossier prêt</span>
                        : <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-muted"><Circle className="h-3.5 w-3.5" /> À compléter</span>
                    ) : null}
                    <ArrowRight className="h-4 w-4 text-faint transition group-hover:translate-x-0.5 group-hover:text-fuchsia" />
                  </span>
                </div>
                {k && (
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-xs text-muted">
                    <span><strong className="text-ink">{k.clauses}</strong> clause(s)</span>
                    <span><strong className="text-ink">{k.engagements}</strong> engagement(s)</span>
                    <span><strong className="text-ink">{k.preuves}</strong> preuve(s)</span>
                    <span>Signatures : <strong className="text-ink">{k.signatures}</strong></span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

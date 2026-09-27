import { useMemo, useState } from 'react';
import { FolderOpen, Printer, FileText, ListChecks, Users, CalendarClock, History, FileCheck2, Scale, Download } from 'lucide-react';
import type { Alerte, Clause, Contrat, ContratPartie, Echeance, Engagement, Evenement, Preuve, Version } from '../../lib/types';
import { fmtDate, fmtDateLong, fmtMontant, typeEvenementLabel, typePreuveLabel } from '../../lib/format';
import { logAction } from '../../lib/api';
import { Btn, Prudence, useToast } from '../ui';

// Dossier final : le document généré est une REPRÉSENTATION LISIBLE des
// données structurées — jamais l'unique source de vérité. Impression / PDF
// via le navigateur, sommaire complet, mentions de prudence.
export default function OngletDossier({ contrat, liens, clauses, engagements, echeances, evenements, preuves, versions, alertes }: {
  contrat: Contrat;
  liens: ContratPartie[];
  clauses: Clause[];
  engagements: Engagement[];
  echeances: Echeance[];
  evenements: Evenement[];
  preuves: Preuve[];
  versions: Version[];
  alertes: Alerte[];
}) {
  const { toastEl, ok } = useToast();
  const [sections, setSections] = useState<Record<string, boolean>>({
    identite: true, parties: true, clauses: true, engagements: true,
    echeances: true, evenements: true, contestes: true, preuves: true, signatures: true, versions: true,
  });

  const evenementsContestes = useMemo(
    () => evenements.filter((e) => e.statut === 'a_verifier' || e.statut === 'conteste'),
    [evenements],
  );
  const alertesNonResolues = useMemo(
    () => alertes.filter((a) => a.statut === 'active' || a.statut === 'reconnue'),
    [alertes],
  );

  const toggle = (k: string) => setSections((s) => ({ ...s, [k]: !s[k] }));

  const groupes = useMemo(() => {
    const g = new Map<string, Clause[]>();
    for (const c of [...clauses].sort((a, b) => (a.ordre || 0) - (b.ordre || 0))) {
      const k = c.categorie || 'DIVERS';
      if (!g.has(k)) g.set(k, []);
      g.get(k)!.push(c);
    }
    return [...g.entries()];
  }, [clauses]);

  const imprimer = async () => {
    await logAction(contrat.id, 'dossier_genere', 'contrat', contrat.id, { sections: Object.keys(sections).filter((k) => sections[k]) });
    ok('Dossier préparé — utilisez l’impression / PDF du navigateur.');
    setTimeout(() => window.print(), 400);
  };

  const exporterJSON = () => {
    const dossier = {
      genere_le: new Date().toISOString(),
      application: 'PACTE — dossier final (représentation lisible, source de vérité = données structurées)',
      contrat, parties: liens, clauses, engagements, echeances, evenements, preuves, versions,
    };
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pacte-dossier-${contrat.id}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const nomPartie = (id: number | null) => liens.find((l) => l.partie_id === id)?.partie?.nom || '—';

  return (
    <div className="space-y-4">
      {toastEl}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 card p-4">
        <div>
          <p className="font-semibold text-ink">Dossier final du contrat</p>
          <p className="mt-0.5 text-sm text-muted">Cochez les sections, imprimez ou exportez. Le document reste une représentation lisible des données.</p>
        </div>
        <span className="flex gap-2">
          <Btn variant="soft" onClick={exporterJSON}><Download className="h-4 w-4" /> Export JSON</Btn>
          <Btn onClick={imprimer}><Printer className="h-4 w-4" /> Imprimer / PDF</Btn>
        </span>
      </div>

      <div className="no-print flex flex-wrap gap-2">
        {[
          ['identite', 'Identité'], ['parties', 'Parties'], ['clauses', 'Clauses'],
          ['engagements', 'Engagements'], ['echeances', 'Échéances'], ['evenements', 'Événements'],
          ['contestes', 'Points à vérifier / contestés'], ['preuves', 'Preuves'], ['signatures', 'Signatures'], ['versions', 'Versions'],
        ].map(([k, l]) => (
          <button key={k} onClick={() => toggle(k)} className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition ${sections[k] ? 'bg-fuchsia text-white' : 'bg-white text-faint'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ============ DOCUMENT IMPRIMABLE ============ */}
      <div className="overflow-hidden rounded border border-line bg-white text-ink shadow-2xl">
        <div className="dossier-head px-6 py-8 sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: '#f2a9c9' }}>PACTE — Dossier final</p>
          <h1 className="font-display mt-2 text-2xl font-bold sm:text-3xl">{contrat.titre}</h1>
          <p className="mt-2 text-sm" style={{ opacity: .75 }}>
            {contrat.domaine || 'Accord'} · v{contrat.version_courante || 1} · Généré le {fmtDateLong(new Date().toISOString())}
          </p>
          <p className="dossier-head-note mt-3 max-w-3xl rounded-sm p-3 text-xs leading-relaxed">
            Ce document est une représentation lisible, générée automatiquement à partir des données structurées du dossier PACTE.
            En cas de divergence, les données horodatées et les pièces versées priment. Document informatif : il ne constitue pas un avis juridique.
          </p>
        </div>

        <div className="space-y-8 px-6 py-8 sm:px-10">
          {sections.identite && (
            <DocSection icon={<FileText className="h-4 w-4" />} titre="1. Identité du contrat">
              <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                <DT k="Objet" v={contrat.objet || '—'} />
                <DT k="Domaine" v={contrat.domaine || '—'} />
                <DT k="Statut" v={contrat.statut} />
                <DT k="Pays" v={contrat.pays || 'Non renseigné (recommandé)'} />
                <DT k="Droit applicable" v={contrat.droit_applicable || 'Non renseigné (recommandé)'} />
                <DT k="Ville" v={contrat.ville || '—'} />
                <DT k="Période" v={`${fmtDate(contrat.date_debut)} → ${fmtDate(contrat.date_fin)}${contrat.duree ? ` (${contrat.duree})` : ''}`} />
                <DT k="Montant total" v={contrat.montant_total ? fmtMontant(contrat.montant_total, contrat.devise || 'EUR') : '—'} />
              </dl>
              {contrat.notes && <p className="mt-3 rounded-sm bg-ivoire p-3 text-sm">Notes : {contrat.notes}</p>}
            </DocSection>
          )}

          {sections.parties && (
            <DocSection icon={<Users className="h-4 w-4" />} titre={`2. Parties (${liens.length})`}>
              <div className="grid gap-3 sm:grid-cols-2">
                {liens.map((l) => (
                  <div key={l.id} className="rounded-sm border border-line p-4 text-sm">
                    <p className="font-bold">{l.partie?.nom}</p>
                    <p className="text-faint">{l.role}{l.qualite ? ` — ${l.qualite}` : ''}</p>
                    {l.partie && <p className="mt-1.5 text-xs text-faint">
                      {[l.partie.adresse, l.partie.ville, l.partie.pays].filter(Boolean).join(', ')}
                      {l.partie.email ? ` · ${l.partie.email}` : ''}{l.partie.telephone ? ` · ${l.partie.telephone}` : ''}
                      {l.partie.identifiant_national ? ` · ${l.partie.identifiant_national}` : ''}
                      {l.partie.representant_nom ? ` · Rep. : ${l.partie.representant_nom} (${l.partie.representant_qualite || ''})` : ''}
                    </p>}
                    {l.relation && <p className="mt-1 text-xs"><strong>Relation :</strong> {l.relation}</p>}
                    {l.engagement_resume && <p className="mt-1 text-xs"><strong>Engagement :</strong> {l.engagement_resume}</p>}
                    <p className="mt-1.5 text-xs font-semibold">Signature : {l.signature_statut === 'signee' ? `Signé le ${fmtDate(l.signature_date)}` : l.signature_statut === 'refusee' ? 'Refusée' : 'En attente'}</p>
                  </div>
                ))}
              </div>
            </DocSection>
          )}

          {sections.clauses && (
            <DocSection icon={<FileText className="h-4 w-4" />} titre={`3. Clauses (${clauses.length})`}>
              {groupes.length === 0 ? <p className="text-sm text-faint">Aucune clause structurée.</p> : groupes.map(([cat, items]) => (
                <div key={cat} className="mb-4">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-faint">{cat}</p>
                  {items.map((c, i) => (
                    <div key={c.id} className="mb-2 rounded-sm bg-ivoire p-3.5 text-sm">
                      <p className="font-semibold">{i + 1}. {c.titre}</p>
                      <p className="mt-1 whitespace-pre-wrap leading-relaxed text-faint">{c.contenu}</p>
                      {c.incertitude && <p className="mt-1.5 text-xs italic text-attention">Incertitude signalée : {c.incertitude}</p>}
                    </div>
                  ))}
                </div>
              ))}
            </DocSection>
          )}

          {sections.engagements && (
            <DocSection icon={<ListChecks className="h-4 w-4" />} titre={`4. Engagements suivis (${engagements.length})`}>
              {engagements.length === 0 ? <p className="text-sm text-faint">Aucun engagement.</p> : (
                <div className="-mx-1 overflow-x-auto px-1">
                <table className="w-full min-w-[560px] text-left text-xs sm:text-sm">
                  <thead><tr className="border-b-2 border-line text-left text-xs uppercase text-faint">
                    <th className="py-2 pr-3">Engagement</th><th className="py-2 pr-3">Qui → Pour qui</th><th className="py-2 pr-3">Quand</th><th className="py-2">Statut</th>
                  </tr></thead>
                  <tbody>
                    {engagements.map((g) => (
                      <tr key={g.id} className="border-b border-line align-top">
                        <td className="py-2.5 pr-3"><strong>{g.titre}</strong>{g.description ? <><br /><span className="text-faint">{g.description}</span></> : null}{g.conditions ? <><br /><span className="text-xs text-faint">Conditions : {g.conditions}</span></> : null}{g.si_non_rempli ? <><br /><span className="text-xs text-faint">Si non rempli : {g.si_non_rempli}</span></> : null}</td>
                        <td className="py-2.5 pr-3">{g.qui_partie_id ? nomPartie(g.qui_partie_id) : g.qui_texte || '—'} → {g.pour_qui_partie_id ? nomPartie(g.pour_qui_partie_id) : g.pour_qui_texte || '—'}</td>
                        <td className="py-2.5 pr-3">{g.date_echeance ? fmtDate(g.date_echeance) : g.quand_texte || '—'}{g.lieu ? <><br />{g.lieu}</> : null}</td>
                        <td className="py-2.5">{g.statut}{g.preuve_attendue ? <><br /><span className="text-xs text-faint">Preuve : {g.preuve_attendue}</span></> : null}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </DocSection>
          )}

          {sections.echeances && (
            <DocSection icon={<CalendarClock className="h-4 w-4" />} titre={`5. Échéances (${echeances.length})`}>
              {echeances.length === 0 ? <p className="text-sm text-faint">Aucune échéance.</p> : (
                <div className="-mx-1 overflow-x-auto px-1">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead><tr className="border-b-2 border-line text-xs uppercase text-faint">
                    <th className="py-2 pr-3">Échéance</th><th className="py-2 pr-3">Type</th><th className="py-2 pr-3">Date limite</th><th className="py-2 pr-3">Montant</th><th className="py-2">Statut</th>
                  </tr></thead>
                  <tbody>
                    {echeances.map((e) => (
                      <tr key={e.id} className="border-b border-line">
                        <td className="py-2 pr-3 font-medium">{e.titre}</td>
                        <td className="py-2 pr-3">{e.type}</td>
                        <td className="py-2 pr-3">{fmtDate(e.date_limite)}</td>
                        <td className="py-2 pr-3">{e.montant ? fmtMontant(e.montant, e.devise || contrat.devise || 'EUR') : '—'}</td>
                        <td className="py-2">{e.statut}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </DocSection>
          )}

          {sections.evenements && (
            <DocSection icon={<History className="h-4 w-4" />} titre={`6. Journal des événements (${evenements.length})`}>
              {evenements.length === 0 ? <p className="text-sm text-faint">Aucun événement.</p> : (
                <ol className="space-y-2.5">
                  {[...evenements].sort((a, b) => new Date(a.date_evenement || a.created_at).getTime() - new Date(b.date_evenement || b.created_at).getTime()).map((ev) => (
                    <li key={ev.id} className="rounded-sm bg-ivoire p-3 text-sm">
                      <p><span className="font-semibold">{fmtDate(ev.date_evenement || ev.created_at, true)}</span> — <strong>{typeEvenementLabel(ev.type)}</strong> : {ev.titre}{ev.auteur ? ` (${ev.auteur})` : ''}</p>
                      {ev.description && <p className="mt-0.5 whitespace-pre-wrap text-faint">{ev.description}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </DocSection>
          )}

          {sections.contestes && (
            <DocSection icon={<Scale className="h-4 w-4" />} titre={`7. Points à vérifier / contestés (${evenementsContestes.length + alertesNonResolues.length})`}>
              {evenementsContestes.length === 0 && alertesNonResolues.length === 0 ? (
                <p className="text-sm text-faint">Aucun point contesté ni signalement non résolu à ce jour — cette section évoluera avec le dossier.</p>
              ) : (
                <div className="space-y-3">
                  {evenementsContestes.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-faint">Événements déclarés « à vérifier » ou « contestés »</p>
                      <ul className="space-y-1.5 text-sm">
                        {evenementsContestes.map((ev) => (
                          <li key={ev.id} className="rounded-sm bg-ivoire p-3">
                            <strong>{typeEvenementLabel(ev.type)}</strong> — {ev.titre} <span className="text-faint">({fmtDate(ev.date_evenement || ev.created_at, true)}{ev.auteur ? ` · déclaré par ${ev.auteur}` : ''} · statut : {ev.statut === 'conteste' ? 'contesté' : 'à vérifier'})</span>
                            {ev.description && <p className="mt-0.5 text-faint">{ev.description}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {alertesNonResolues.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-faint">Signalements du moteur de cohérence non résolus</p>
                      <ul className="space-y-1.5 text-sm">
                        {alertesNonResolues.map((a) => (
                          <li key={a.id} className="rounded-sm bg-ivoire p-3">
                            <strong>{a.titre}</strong> <span className="text-faint">({a.gravite === 'critique' ? 'critique' : a.gravite === 'attention' ? 'à surveiller' : 'information'})</span>
                            {a.message && <p className="mt-0.5 text-faint">{a.message}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-xs italic text-faint">Ces éléments sont des déclarations ou des signalements à vérifier — ils ne constituent ni une faute établie, ni une conclusion juridique.</p>
                </div>
              )}
            </DocSection>
          )}

          {sections.preuves && (
            <DocSection icon={<FileCheck2 className="h-4 w-4" />} titre={`8. Chaîne documentaire (${preuves.length} pièces)`}>
              {preuves.length === 0 ? <p className="text-sm text-faint">Aucune pièce versée.</p> : (
                <div className="-mx-1 overflow-x-auto px-1">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead><tr className="border-b-2 border-line text-xs uppercase text-faint">
                    <th className="py-2 pr-3">#</th><th className="py-2 pr-3">Pièce</th><th className="py-2 pr-3">Type</th><th className="py-2 pr-3">Date</th><th className="py-2">Empreinte</th>
                  </tr></thead>
                  <tbody>
                    {preuves.map((p, i) => (
                      <tr key={p.id} className="border-b border-line">
                        <td className="py-2 pr-3 font-mono">{preuves.length - i}</td>
                        <td className="py-2 pr-3 font-medium">{p.titre}</td>
                        <td className="py-2 pr-3">{typePreuveLabel(p.type)}</td>
                        <td className="py-2 pr-3">{fmtDate(p.date_preuve || p.created_at)}</td>
                        <td className="py-2 font-mono text-xs break-all">{p.empreinte || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </DocSection>
          )}

          {sections.signatures && (
            <DocSection icon={<Scale className="h-4 w-4" />} titre="9. Signatures">
              <div className="grid gap-4 sm:grid-cols-2">
                {liens.map((l) => (
                  <div key={l.id} className="rounded-sm border border-line p-4">
                    <p className="text-sm font-bold">{l.partie?.nom}</p>
                    <p className="text-xs text-faint">{l.role}</p>
                    <div className="mt-8 border-t border-line pt-2 text-xs text-faint">
                      Signature {l.signature_statut === 'signee' ? `— signé le ${fmtDate(l.signature_date)}` : '— date : …… / …… / …………'}
                    </div>
                  </div>
                ))}
              </div>
            </DocSection>
          )}

          {sections.versions && versions.length > 0 && (
            <DocSection icon={<FolderOpen className="h-4 w-4" />} titre={`10. Versions conservées (${versions.length})`}>
              <ul className="space-y-1.5 text-sm">
                {[...versions].sort((a, b) => (a.numero || 0) - (b.numero || 0)).map((v) => (
                  <li key={v.id} className="rounded-sm bg-ivoire px-3 py-2">
                    <strong>v{v.numero}</strong> — {v.titre} <span className="text-faint">({fmtDate(v.created_at)} · {v.statut})</span>
                    {v.resume && <><br /><span className="text-faint">{v.resume}</span></>}
                  </li>
                ))}
              </ul>
            </DocSection>
          )}

          <div className="rounded border-2 border-line p-4 text-xs leading-relaxed text-faint">
            <p className="font-bold text-ink">Mentions importantes</p>
            <p className="mt-1">
              Fait pour servir et valoir ce que de droit, à partir des données horodatées du dossier PACTE.
              Le présent dossier ne préjuge d’aucune interprétation juridique définitive et ne remplace ni l’avis d’un avocat,
              ni les actes authentiques éventuellement requis (notaire, enregistrement). En cas de litige, seules les pièces
              originales et le droit applicable {contrat.droit_applicable ? `(${contrat.droit_applicable})` : 'identifié au dossier'} permettront d’apprécier la situation.
            </p>
          </div>
        </div>
      </div>

      <div className="no-print"><Prudence /></div>
    </div>
  );
}

function DocSection({ icon, titre, children }: { icon: React.ReactNode; titre: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 border-b-2 border-line pb-2 text-base font-bold uppercase tracking-wide">
        <span className="text-faint">{icon}</span> {titre}
      </h2>
      {children}
    </section>
  );
}

function DT({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 font-semibold text-faint">{k} :</dt>
      <dd>{v}</dd>
    </div>
  );
}

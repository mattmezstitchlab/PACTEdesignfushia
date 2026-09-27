import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Upload, Check, ArrowRight } from 'lucide-react';
import { analyserDocument } from '../lib/analyse';
import type { AnalyseDocument } from '../lib/types';
import { Btn, Prudence, inputCls, useToast } from '../components/ui';

// Page d'analyse autonome : coller un texte → comprendre → créer un contrat.
export default function Analyse() {
  const nav = useNavigate();
  const { toastEl, ok, err } = useToast();
  const [texte, setTexte] = useState('');
  const [analyse, setAnalyse] = useState<AnalyseDocument | null>(null);

  const lancer = () => {
    if (texte.trim().length < 100) { err('Collez un texte plus complet (au moins quelques phrases).'); return; }
    setAnalyse(analyserDocument(texte));
    ok('Analyse terminée.');
  };

  const lireFichier = async (f: File | undefined) => {
    if (!f) return;
    try {
      const t = await f.text();
      if (!t.trim()) { err('Fichier illisible : copiez-collez le texte.'); return; }
      setTexte(t.slice(0, 20000));
      ok('Texte chargé.');
    } catch { err('Lecture impossible.'); }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {toastEl}
      <div>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Analyser un document</h1>
        <p className="mt-1 text-sm text-muted">
          Collez le texte d’un contrat existant : PACTE détecte les informations, engagements, échéances et clauses,
          et relève des points de vigilance. Analyse locale et indicative — chaque proposition cite sa source.
        </p>
      </div>

      <Prudence />

      <div className="card p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-line px-4 py-2.5 text-sm text-ink hover:border-fuchsia-400">
            <Upload className="h-4 w-4" /> Charger un fichier texte
            <input type="file" accept=".txt,.md,.text" className="hidden" onChange={(e) => lireFichier(e.target.files?.[0])} />
          </label>
          <span className="text-xs text-faint">ou collez le texte ci-dessous ({texte.length} caractères)</span>
          <span className="ml-auto"><Btn onClick={lancer}><Sparkles className="h-4 w-4" /> Analyser</Btn></span>
        </div>
        <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={10} placeholder="Collez ici le texte du contrat…" className={inputCls + ' font-mono text-xs leading-relaxed'} />
      </div>

      {analyse && (
        <div className="space-y-4">
          <div className="rounded border border-fuchsia-200 bg-fuchsia-50 p-4 text-sm">
            <p className="font-semibold text-fuchsia-600">Confiance : {analyse.score_confiance}</p>
            <p className="mt-1 text-muted">
              {analyse.engagements_proposes.length} engagement(s) · {analyse.echeances_proposees.length} échéance(s) · {analyse.clauses_proposees.length} clause(s) détectés · {analyse.points_vigilance.length} point(s) de vigilance.
            </p>
            <div className="mt-3">
              <Btn onClick={() => nav('/nouveau')}>Créer un contrat depuis cette analyse <ArrowRight className="h-4 w-4" /></Btn>
            </div>
          </div>

          {analyse.infos_detectees.length > 0 && (
            <Section titre="Informations détectées">
              {analyse.infos_detectees.map((i, k) => (
                <div key={k} className="card p-3 text-sm"><strong className="text-ink">{i.etiquette} : </strong><span className="text-muted">{i.valeur}</span><p className="mt-1 text-xs italic text-faint">« {i.extrait.slice(0, 200)}… »</p></div>
              ))}
            </Section>
          )}
          {analyse.engagements_proposes.length > 0 && (
            <Section titre={`Engagements détectés (${analyse.engagements_proposes.length})`}>
              {analyse.engagements_proposes.map((g, k) => (
                <div key={k} className="card p-3 text-sm">
                  <p className="font-medium text-ink"><Check className="mr-1.5 inline h-3.5 w-3.5 text-success" />{g.titre}</p>
                  {g.quand_texte && <p className="mt-0.5 text-xs text-fuchsia-700">{g.quand_texte}</p>}
                  <p className="mt-1 text-xs italic text-faint">« {g.extrait.slice(0, 180)}… »</p>
                </div>
              ))}
            </Section>
          )}
          {analyse.echeances_proposees.length > 0 && (
            <Section titre={`Échéances détectées (${analyse.echeances_proposees.length})`}>
              {analyse.echeances_proposees.map((g, k) => (
                <div key={k} className="card p-3 text-sm"><p className="text-ink">{g.titre}</p><p className="text-xs text-muted">{g.date_limite || 'sans date'}{g.montant ? ` · ${g.montant}` : ''}</p></div>
              ))}
            </Section>
          )}
          {analyse.clauses_proposees.length > 0 && (
            <Section titre={`Clauses détectées (${analyse.clauses_proposees.length})`}>
              {analyse.clauses_proposees.map((g, k) => (
                <div key={k} className="card p-3 text-sm"><p className="text-ink"><span className="mr-2 rounded bg-white px-1.5 py-0.5 text-[10px]">{g.categorie}</span>{g.titre}</p></div>
              ))}
            </Section>
          )}
          <Section titre="Points de vigilance">
            {analyse.points_vigilance.map((v, k) => (
              <div key={k} className="rounded-sm bg-fuchsia-50 p-3 text-sm text-attention">{v}</div>
            ))}
          </Section>

          <p className="text-center text-xs text-faint">
            Pour importer ces éléments dans un contrat structuré, passez par <Link to="/nouveau" className="text-fuchsia hover:underline">l’assistant de création (mode Import)</Link>.
          </p>
        </div>
      )}
    </div>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="card p-4">
      <h2 className="mb-2.5 font-display text-base font-semibold text-ink">{titre}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

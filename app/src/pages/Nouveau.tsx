import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, FileText, Sparkles, Upload, Plus,
  Users, CalendarDays, Globe2, Target, ListChecks, FilePlus2, GitBranch,
} from 'lucide-react';
import { api, logAction, fichierVersBase64 } from '../lib/api';
import { MODELES, modeleParCode } from '../lib/modeles';
import { analyserDocument } from '../lib/analyse';
import type { AnalyseDocument, Partie } from '../lib/types';
import { Btn, Field, inputCls, Modal, Prudence, useToast } from '../components/ui';

// ============================================================
// Assistant de création : 4 modes (nouveau / import / avenant /
// situation), puis quelques questions simples — jamais un long
// formulaire initial.
// ============================================================

type Mode = 'nouveau' | 'import' | 'avenant' | 'situation';

export default function Nouveau() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { toastEl, ok, err } = useToast();
  const modeInitial = (params.get('mode') as Mode) || 'nouveau';
  const [etape, setEtape] = useState(0);
  const [mode, setMode] = useState<Mode>(modeInitial);
  const [modele, setModele] = useState('pacte_prive');
  const [reponses, setReponses] = useState<Record<string, string>>({});
  const [contratCible, setContratCible] = useState<number | null>(null);
  const [contratsExistants, setContratsExistants] = useState<{ id: number; titre: string }[]>([]);
  const [partiesExistantes, setPartiesExistantes] = useState<Partie[]>([]);
  const [partiesChoisies, setPartiesChoisies] = useState<number[]>([]);
  const [nouvellesParties, setNouvellesParties] = useState<{ nom: string; role: string }[]>([{ nom: '', role: '' }]);
  const [texteImport, setTexteImport] = useState('');
  const [analyse, setAnalyse] = useState<AnalyseDocument | null>(null);
  const [selections, setSelections] = useState({ eng: new Set<number>(), ech: new Set<number>(), clauses: new Set<number>() });
  const [creation, setCreation] = useState(false);
  const [modalPartie, setModalPartie] = useState(false);

  const def = modeleParCode(modele);

  useEffect(() => {
    api.contrats.list().then((cs) => {
      setContratsExistants(cs.map((c) => ({ id: c.id, titre: c.titre })));
      const presetId = Number(params.get('contrat'));
      if (presetId) setContratCible(presetId);
    }).catch(() => {});
    api.parties.list().then(setPartiesExistantes).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: string, v: string) => setReponses((r) => ({ ...r, [k]: v }));

  const titrePropose = useMemo(() => {
    const o = (reponses.objet || '').trim();
    if (o.length > 4) return `${def.nom} — ${o.slice(0, 60)}${o.length > 60 ? '…' : ''}`;
    return `${def.nom} — ${new Date().toLocaleDateString('fr-FR')}`;
  }, [reponses.objet, def.nom]);

  const lancerAnalyse = () => {
    if (texteImport.trim().length < 100) {
      err('Collez un texte plus complet (au moins quelques phrases) pour lancer l’analyse.');
      return;
    }
    const a = analyserDocument(texteImport);
    setAnalyse(a);
    setSelections({
      eng: new Set(a.engagements_proposes.map((_, i) => i)),
      ech: new Set(a.echeances_proposees.map((_, i) => i)),
      clauses: new Set(a.clauses_proposees.map((_, i) => i)),
    });
    ok('Analyse terminée — vérifiez et sélectionnez les éléments à importer.');
  };

  const lireFichier = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 400000) { err('Fichier trop volumineux pour l’analyse (400 Ko max).'); return; }
    try {
      const txt = await f.text();
      if (!txt.trim()) { err('Impossible de lire ce fichier (PDF/image non lisible en texte). Copiez-collez le contenu.'); return; }
      setTexteImport(txt.slice(0, 20000));
      ok('Texte chargé — lancez l’analyse.');
    } catch {
      err('Lecture impossible : copiez-collez le texte du document.');
    }
  };

  const toggleSel = (groupe: 'eng' | 'ech' | 'clauses', i: number) => {
    setSelections((s) => {
      const n = new Set(s[groupe]);
      if (n.has(i)) n.delete(i); else n.add(i);
      return { ...s, [groupe]: n };
    });
  };

  const peutContinuer = () => {
    if (etape === 0) return true;
    if (etape === 1) {
      if ((mode === 'avenant' || mode === 'situation') && !contratCible) return false;
      if (mode === 'import' && texteImport.trim().length < 20) return false;
      return true;
    }
    if (etape === 2) return true;
    if (etape === 3) return (reponses.objet || '').trim().length >= 4;
    return true;
  };

  const creer = async () => {
    setCreation(true);
    try {
      // 1. Parties : réutiliser + créer
      const idsParties: number[] = [...partiesChoisies];
      for (const np of nouvellesParties) {
        if (!np.nom.trim()) continue;
        const p = await api.parties.create({ nom: np.nom.trim(), role_defaut: np.role || null });
        idsParties.push(p.id);
      }

      // 2. Contrat (ou rattachement si avenant/situation)
      let contratId = contratCible;
      let estNouveau = false;
      if (mode === 'nouveau' || mode === 'import') {
        const c = await api.contrats.create({
          titre: (reponses.titre || titrePropose).slice(0, 160),
          type_modele: modele,
          domaine: def.nom,
          statut: 'brouillon',
          objet: reponses.objet || null,
          pays: reponses.pays || null,
          droit_applicable: reponses.droit || null,
          ville: reponses.ville || null,
          date_debut: reponses.debut || null,
          date_fin: reponses.fin || null,
          duree: reponses.duree || null,
          montant_total: reponses.montant ? Number(reponses.montant.replace(',', '.')) || null : null,
          devise: reponses.devise || 'EUR',
          notes: mode === 'import' ? 'Créé par import et analyse d’un document existant.' : null,
          sante: 'saine',
          version_courante: 1,
        });
        contratId = c.id;
        estNouveau = true;
        await logAction(c.id, 'contrat_cree', 'contrat', c.id, { mode, modele });
      }
      if (!contratId) throw new Error('Contrat cible manquant');

      // 3. Rattacher les parties avec rôles
      const rolesDef = def.roles;
      let idx = 0;
      for (const pid of idsParties) {
        const existantes = await api.contratParties.list({ contrat_id: contratId, partie_id: pid });
        if (existantes.length === 0) {
          const r = rolesDef[idx % rolesDef.length];
          await api.contratParties.create({
            contrat_id: contratId, partie_id: pid,
            role: r.role, qualite: r.qualite, signature_statut: 'non_signee',
          });
          idx++;
        }
      }
      // Rôles saisis pour nouvelles parties
      if (nouvellesParties.some((n) => n.nom.trim() && n.role.trim())) {
        const cps = await api.contratParties.list({ contrat_id: contratId });
        for (const np of nouvellesParties) {
          if (!np.nom.trim() || !np.role.trim()) continue;
          const p = partiesExistantes.find((x) => x.nom === np.nom.trim());
          void p;
          const cp = cps.find((x) => idsParties.includes(x.partie_id) && x.role === rolesDef[cps.indexOf(x) % rolesDef.length]?.role);
          void cp;
        }
      }

      if (estNouveau) {
        // 4a. Clauses du modèle (+ importées si sélectionnées)
        let ordre = 1;
        for (const cl of def.clauses) {
          await api.clauses.create({
            contrat_id: contratId, categorie: cl.categorie, titre: cl.titre,
            contenu: personnaliser(cl.contenu, reponses), ordre: ordre++, statut: 'active',
          });
        }
        if (mode === 'import' && analyse) {
          for (const i of selections.clauses) {
            const cl = analyse.clauses_proposees[i];
            await api.clauses.create({
              contrat_id: contratId, categorie: cl.categorie, titre: cl.titre.slice(0, 120),
              contenu: cl.contenu, ordre: ordre++, statut: 'en_discussion',
              incertitude: 'Clause importée automatiquement — relisez et validez.',
            });
          }
        }
        // 4b. Engagements du modèle (+ importés)
        for (const eg of def.engagements) {
          await api.engagements.create({
            contrat_id: contratId, titre: eg.titre, quand_texte: eg.quand_texte,
            conditions: eg.conditions || null, preuve_attendue: eg.preuve_attendue || null,
            si_non_rempli: eg.si_non_rempli || null, statut: 'a_faire', priorite: eg.priorite,
          });
        }
        if (mode === 'import' && analyse) {
          for (const i of selections.eng) {
            const eg = analyse.engagements_proposes[i];
            await api.engagements.create({
              contrat_id: contratId, titre: eg.titre.slice(0, 160), description: eg.description,
              quand_texte: eg.quand_texte || null, date_echeance: eg.date_echeance,
              conditions: eg.conditions || null, preuve_attendue: eg.preuve_attendue || null,
              statut: 'a_faire', priorite: 'normale',
            });
          }
          for (const i of selections.ech) {
            const eh = analyse.echeances_proposees[i];
            await api.echeances.create({
              contrat_id: contratId, titre: eh.titre.slice(0, 160), type: eh.type,
              date_limite: eh.date_limite, montant: eh.montant,
              statut: eh.date_limite ? 'a_venir' : 'a_venir', notes: `Importé : ${eh.extrait.slice(0, 200)}`,
            });
          }
          await api.evenements.create({
            contrat_id: contratId, type: 'document', titre: 'Import et analyse d’un document',
            description: `Document analysé localement. Confiance : ${analyse.score_confiance} ${analyse.points_vigilance.length} point(s) de vigilance relevé(s).`,
            date_evenement: new Date().toISOString(), auteur: 'Utilisateur', statut: 'actif',
          });
          for (const pv of analyse.points_vigilance.slice(0, 6)) {
            await api.alertes.create({
              contrat_id: contratId, code: 'IMPORT_VIGILANCE', gravite: 'attention',
              titre: 'Point de vigilance (import)', message: pv,
              entite_type: 'contrat', entite_id: contratId, statut: 'active',
              action_suggeree: 'Relire le document source et valider les éléments importés.',
            });
          }
        }
        // 4c. Version initiale (jamais d’écrasement silencieux ensuite)
        await api.versions.create({
          contrat_id: contratId, numero: 1,
          titre: mode === 'import' ? 'Version initiale (import)' : 'Version initiale',
          resume: 'Création du contrat — structure générée depuis le modèle « ' + def.nom + ' ».',
          statut: 'validee',
          snapshot: { clauses: def.clauses.length, engagements: def.engagements.length, reponses },
        });
      }

      // 5. Modes avenant / situation
      if (mode === 'avenant' && contratId) {
        const versions = await api.versions.list({ contrat_id: contratId });
        const num = (versions.reduce((m, v) => Math.max(m, v.numero || 0), 0) || 1) + 1;
        await api.versions.create({
          contrat_id: contratId, numero: num, titre: `Avenant n°${num - 1} (brouillon)`,
          resume: reponses.objet || 'Modification envisagée — à rédiger puis faire signer.',
          statut: 'brouillon', snapshot: { reponses },
        });
        await api.evenements.create({
          contrat_id: contratId, type: 'avenant', titre: `Avenant n°${num - 1} envisagé`,
          description: reponses.objet || 'Modification à formaliser.',
          date_evenement: new Date().toISOString(), auteur: 'Utilisateur', statut: 'actif',
        });
        await logAction(contratId, 'avenant_cree', 'contrat', contratId, { numero: num });
      }
      if (mode === 'situation' && contratId) {
        await api.evenements.create({
          contrat_id: contratId, type: 'communication', titre: 'Analyse d’une situation',
          description: reponses.objet || 'Situation à analyser.',
          date_evenement: new Date().toISOString(), auteur: 'Utilisateur', statut: 'actif',
        });
        await logAction(contratId, 'situation_analysee', 'contrat', contratId, { objet: reponses.objet });
      }

      await logAction(contratId, estNouveau ? 'contrat_cree' : mode === 'avenant' ? 'avenant_initie' : 'situation_enregistree', 'contrat', contratId, { mode });
      ok(mode === 'avenant' ? 'Avenant initié — rédigez-le puis faites-le signer.' : mode === 'situation' ? 'Situation enregistrée — consultez les scénarios.' : 'Contrat créé — complétez-le à votre rythme.');
      nav(`/contrats/${contratId}`);
    } catch (e: any) {
      err(e.message || 'Création impossible');
    } finally {
      setCreation(false);
    }
  };

  const etapes = mode === 'import'
    ? ['Mode', 'Document', 'Analyse', 'Questions', 'Parties', 'Récapitulatif']
    : ['Mode', 'Base', 'Modèle', 'Questions', 'Parties', 'Récapitulatif'];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {toastEl}
      <div>
        <button onClick={() => nav(-1)} className="mb-3 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Formaliser, importer, amender, analyser</h1>
        <p className="mt-1 text-sm text-muted">Quelques questions simples suffisent — PACTE structure tout le reste, quel que soit le type d’accord.</p>
      </div>

      {/* Progression */}
      <ol className="flex flex-wrap items-center gap-1.5">
        {etapes.map((l, i) => (
          <li key={l} className="flex items-center gap-1.5">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i < etape ? 'bg-success text-white' : i === etape ? 'bg-fuchsia text-white' : 'bg-white text-faint border border-line'}`}>
              {i < etape ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={`mr-2 hidden text-xs sm:inline ${i === etape ? 'font-semibold text-ink' : 'text-faint'}`}>{l}</span>
          </li>
        ))}
      </ol>

      <div className="card p-5 sm:p-8">
        {/* ÉTAPE 0 — Mode */}
        {etape === 0 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">Que souhaitez-vous faire ?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <ModeCard actif={mode === 'nouveau'} onClick={() => setMode('nouveau')} icon={<FilePlus2 className="h-5 w-5" />} titre="Nouveau contrat / pacte" texte="Partir d’une page blanche guidée par un modèle." />
              <ModeCard actif={mode === 'import'} onClick={() => setMode('import')} icon={<Upload className="h-5 w-5" />} titre="Importer & analyser" texte="Coller un contrat existant, détecter engagements et échéances." />
              <ModeCard actif={mode === 'avenant'} onClick={() => setMode('avenant')} icon={<GitBranch className="h-5 w-5" />} titre="Avenant" texte="Modifier un contrat existant sans écraser l’historique." />
              <ModeCard actif={mode === 'situation'} onClick={() => setMode('situation')} icon={<Sparkles className="h-5 w-5" />} titre="Analyser une situation" texte="Un retard, un litige, un doute ? Enregistrez et éclairez." />
            </div>
            <Prudence compact />
          </div>
        )}

        {/* ÉTAPE 1 — Base / Document / Cible */}
        {etape === 1 && (mode === 'avenant' || mode === 'situation') && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-ink">Sur quel contrat ?</h2>
            <Field label="Contrat concerné">
              <select value={contratCible || ''} onChange={(e) => setContratCible(Number(e.target.value) || null)} className={inputCls + ' cursor-pointer'}>
                <option value="">— Choisir —</option>
                {contratsExistants.map((c) => <option key={c.id} value={c.id}>{c.titre}</option>)}
              </select>
            </Field>
            {contratsExistants.length === 0 && <p className="text-sm text-muted">Aucun contrat existant : créez d’abord un nouveau contrat.</p>}
          </div>
        )}
        {etape === 1 && (mode === 'nouveau') && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-ink">Un document existant ?</h2>
            <p className="text-sm text-muted">Si vous avez déjà un contrat écrit, le mode « Importer » l’analysera. Sinon, continuez : le modèle fournira la trame.</p>
            <div className="flex gap-2">
              <Btn variant="soft" onClick={() => setMode('import')}><Upload className="h-4 w-4" /> J’ai un document à analyser</Btn>
            </div>
          </div>
        )}
        {etape === 1 && mode === 'import' && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-ink">Collez le texte du contrat</h2>
            <p className="text-sm text-muted">L’analyse est locale et indicative : chaque proposition citera son extrait source, et vous validerez tout avant import. Rien n’est inventé.</p>
            <div className="flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-line px-4 py-2.5 text-sm text-ink hover:border-fuchsia-400">
                <Upload className="h-4 w-4" /> Charger un fichier texte
                <input type="file" accept=".txt,.md,.text,.csv" className="hidden" onChange={(e) => lireFichier(e.target.files?.[0])} />
              </label>
              <span className="text-xs text-faint">.txt / .md (PDF : copiez-collez le texte)</span>
            </div>
            <textarea value={texteImport} onChange={(e) => setTexteImport(e.target.value)} rows={10} placeholder="Collez ici l’intégralité du contrat (entre…, article 1…, montants, dates…)" className={inputCls + ' font-mono text-xs leading-relaxed'} />
            <p className="text-xs text-faint">{texteImport.length} caractères</p>
          </div>
        )}

        {/* ÉTAPE 2 — Analyse ou modèle */}
        {etape === 2 && mode === 'import' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold text-ink">Analyse du document</h2>
              <Btn onClick={lancerAnalyse}><Sparkles className="h-4 w-4" /> Lancer l’analyse</Btn>
            </div>
            {!analyse && <p className="text-sm text-muted">Cliquez sur « Lancer l’analyse » pour détecter les parties, engagements, échéances et clauses.</p>}
            {analyse && (
              <div className="space-y-4">
                <div className="rounded border border-fuchsia-200 bg-fuchsia-50 p-4 text-sm">
                  <p className="font-semibold text-fuchsia-600">Confiance : {analyse.score_confiance}</p>
                  <p className="mt-1 text-muted">{analyse.engagements_proposes.length} engagement(s) · {analyse.echeances_proposees.length} échéance(s) · {analyse.clauses_proposees.length} clause(s) détectés. Cochez ce que vous voulez importer.</p>
                </div>
                {analyse.infos_detectees.length > 0 && (
                  <Bloc titre="Informations détectées" items={analyse.infos_detectees.map((i) => `${i.etiquette} : ${i.valeur}`)} />
                )}
                <SelectListe titre={`Engagements proposés (${selections.eng.size}/${analyse.engagements_proposes.length})`} n={analyse.engagements_proposes.length} sel={selections.eng} onToggle={(i) => toggleSel('eng', i)}
                  rend={(i) => { const g = analyse.engagements_proposes[i]; return (<><p className="text-sm font-medium text-ink">{g.titre}</p>{g.quand_texte && <p className="text-xs text-fuchsia-700">{g.quand_texte}</p>}<p className="mt-1 text-xs italic text-faint">« {g.extrait.slice(0, 160)}… »</p></>); }} />
                <SelectListe titre={`Échéances proposées (${selections.ech.size}/${analyse.echeances_proposees.length})`} n={analyse.echeances_proposees.length} sel={selections.ech} onToggle={(i) => toggleSel('ech', i)}
                  rend={(i) => { const g = analyse.echeances_proposees[i]; return (<><p className="text-sm font-medium text-ink">{g.titre}</p><p className="text-xs text-muted">{g.date_limite || 'sans date'}{g.montant ? ` · ${g.montant}` : ''}</p></>); }} />
                <SelectListe titre={`Clauses proposées (${selections.clauses.size}/${analyse.clauses_proposees.length})`} n={analyse.clauses_proposees.length} sel={selections.clauses} onToggle={(i) => toggleSel('clauses', i)}
                  rend={(i) => { const g = analyse.clauses_proposees[i]; return (<><p className="text-sm font-medium text-ink"><span className="mr-2 rounded bg-white px-1.5 py-0.5 text-[10px] text-muted">{g.categorie}</span>{g.titre}</p><p className="mt-1 line-clamp-2 text-xs text-muted">{g.contenu.slice(0, 200)}…</p></>); }} />
                {analyse.points_vigilance.length > 0 && <Bloc titre="Points de vigilance relevés" items={analyse.points_vigilance} alerte />}
              </div>
            )}
          </div>
        )}
        {etape === 2 && mode !== 'import' && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-ink">
              {mode === 'nouveau' ? 'Quel type d’accord ?' : 'Le modèle restera celui du contrat — vérifiez le domaine'}
            </h2>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {MODELES.map((m) => (
                <button key={m.code} onClick={() => setModele(m.code)} className={`cursor-pointer rounded border p-4 text-left transition ${modele === m.code ? 'border-fuchsia-400 bg-fuchsia-50' : 'border-line bg-white hover:border-line'}`}>
                  <span className="mb-2 inline-block h-2.5 w-8 rounded-full" style={{ background: m.couleur }} />
                  <p className="font-semibold text-ink">{m.nom}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{m.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ÉTAPE 3 — Questions simples */}
        {etape === 3 && (
          <div className="space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">
              {mode === 'avenant' ? 'Que voulez-vous modifier ?' : mode === 'situation' ? 'Décrivez la situation' : 'Quelques questions simples'}
            </h2>
            <Field label={mode === 'nouveau' || mode === 'import' ? 'Quel est l’objectif de cet accord ? *' : 'Décrivez en quelques phrases *'}>
              <textarea value={reponses.objet || ''} onChange={(e) => set('objet', e.target.value)} rows={3} placeholder={mode === 'situation' ? 'Ex. : le prestataire a deux semaines de retard sur la livraison…' : 'Ex. : prêter 2 000 € à mon frère, remboursés en 10 mois'} className={inputCls} />
            </Field>
            {(mode === 'nouveau' || mode === 'import') && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Pays"><input value={reponses.pays || ''} onChange={(e) => set('pays', e.target.value)} placeholder="Ex. : France" className={inputCls} /></Field>
                  <Field label="Droit applicable"><input value={reponses.droit || ''} onChange={(e) => set('droit', e.target.value)} placeholder="Ex. : droit français" className={inputCls} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ville"><input value={reponses.ville || ''} onChange={(e) => set('ville', e.target.value)} placeholder="Ex. : Lyon" className={inputCls} /></Field>
                  <Field label="Durée"><input value={reponses.duree || ''} onChange={(e) => set('duree', e.target.value)} placeholder="Ex. : 12 mois" className={inputCls} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Début"><input type="date" value={reponses.debut || ''} onChange={(e) => set('debut', e.target.value)} className={inputCls} /></Field>
                  <Field label="Fin"><input type="date" value={reponses.fin || ''} onChange={(e) => set('fin', e.target.value)} className={inputCls} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Montant total (optionnel)"><input value={reponses.montant || ''} onChange={(e) => set('montant', e.target.value)} placeholder="Ex. : 2000" inputMode="decimal" className={inputCls} /></Field>
                  <Field label="Devise">
                    <select value={reponses.devise || 'EUR'} onChange={(e) => set('devise', e.target.value)} className={inputCls + ' cursor-pointer'}>
                      {['EUR', 'USD', 'CHF', 'GBP', 'CAD', 'XOF', 'XAF', 'MAD', 'TND', 'DZD'].map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                </div>
                {def.questions.filter((qq) => qq.cle !== 'objet').map((qq) => (
                  <Field key={qq.cle} label={qq.question}>
                    <input value={reponses[qq.cle] || ''} onChange={(e) => set(qq.cle, e.target.value)} placeholder={qq.exemple} className={inputCls} />
                  </Field>
                ))}
              </>
            )}
            {(mode === 'avenant' || mode === 'situation') && (
              <p className="card p-4 text-sm text-muted">
                {mode === 'avenant'
                  ? 'Décrivez la modification envisagée. Un brouillon d’avenant sera créé : la version actuelle restera intacte jusqu’à signature.'
                  : 'Décrivez les faits (qui, quoi, quand). Une fois enregistré, le moteur de scénarios vous aidera à relier faits, clauses et preuves.'}
              </p>
            )}
          </div>
        )}

        {/* ÉTAPE 4 — Parties */}
        {etape === 4 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-ink">Qui sont les parties ?</h2>
            <p className="text-sm text-muted">Une personne peut participer à plusieurs contrats : réutilisez l’annuaire ou créez de nouvelles fiches (complétées plus tard).</p>
            {partiesExistantes.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Annuaire — sélectionner</p>
                <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto">
                  {partiesExistantes.map((p) => (
                    <button key={p.id} onClick={() => setPartiesChoisies((s) => s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id])}
                      className={`cursor-pointer rounded-full px-3.5 py-1.5 text-sm transition ${partiesChoisies.includes(p.id) ? 'bg-fuchsia font-semibold text-white' : 'bg-white text-muted hover:bg-white'}`}>
                      {p.nom}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Nouvelles parties</p>
              <div className="space-y-2">
                {nouvellesParties.map((np, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-2">
                    <input value={np.nom} onChange={(e) => { const n = [...nouvellesParties]; n[i].nom = e.target.value; setNouvellesParties(n); }} placeholder={`Nom de la partie ${i + 1} (ex. : Marie Dupont)`} className={inputCls} />
                    <input value={np.role} onChange={(e) => { const n = [...nouvellesParties]; n[i].role = e.target.value; setNouvellesParties(n); }} placeholder={`Rôle (ex. : ${def.roles[i % def.roles.length]?.role || 'partie'})`} className={inputCls} />
                  </div>
                ))}
                <button onClick={() => setNouvellesParties((n) => [...n, { nom: '', role: '' }])} className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm text-fuchsia hover:text-fuchsia-600">
                  <Plus className="h-4 w-4" /> Ajouter une partie
                </button>
              </div>
            </div>
            <div className="card p-4 text-sm text-muted">
              Rôles suggérés par le modèle « {def.nom} » : {def.roles.map((r) => r.role).join(' · ')}. Les fiches détaillées (IDENTITÉ / RÔLE / RELATION / ENGAGEMENT) se complètent ensuite dans le contrat.
            </div>
          </div>
        )}

        {/* ÉTAPE 5 — Récap */}
        {etape === 5 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-ink">Récapitulatif</h2>
            <dl className="space-y-2.5 card p-5 text-sm">
              <Ligne k="Action" v={mode === 'nouveau' ? 'Nouveau contrat' : mode === 'import' ? 'Import + nouveau contrat' : mode === 'avenant' ? `Avenant (${contratsExistants.find((c) => c.id === contratCible)?.titre})` : `Situation (${contratsExistants.find((c) => c.id === contratCible)?.titre})`} />
              {(mode === 'nouveau' || mode === 'import') && <>
                <Ligne k="Titre" v={titrePropose} />
                <Ligne k="Modèle" v={def.nom} />
                <Ligne k="Objet" v={reponses.objet || '—'} />
                <Ligne k="Pays / droit" v={[reponses.pays, reponses.droit].filter(Boolean).join(' · ') || 'À compléter (recommandé)'} />
                <Ligne k="Contenu généré" v={`${def.clauses.length} clauses types + ${def.engagements.length} engagements types${mode === 'import' && analyse ? ` + ${selections.eng.size} engagement(s), ${selections.ech.size} échéance(s), ${selections.clauses.size} clause(s) importés` : ''}`} />
              </>}
              {(mode === 'avenant' || mode === 'situation') && <Ligne k="Description" v={reponses.objet || '—'} />}
              <Ligne k="Parties" v={`${partiesChoisies.length} de l’annuaire + ${nouvellesParties.filter((n) => n.nom.trim()).length} nouvelle(s)`} />
            </dl>
            {(mode === 'nouveau' || mode === 'import') && def.vigilance.length > 0 && (
              <div className="rounded border border-fuchsia-200 bg-fuchsia-soft p-4 text-sm text-attention">
                <p className="mb-1.5 font-semibold text-attention">Points de vigilance du modèle « {def.nom} »</p>
                <ul className="list-disc space-y-1 pl-5">{def.vigilance.map((v, i) => <li key={i}>{v}</li>)}</ul>
              </div>
            )}
            <Prudence compact />
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
          <Btn variant="ghost" onClick={() => setEtape(Math.max(0, etape - 1))} disabled={etape === 0}>
            <ArrowLeft className="h-4 w-4" /> Précédent
          </Btn>
          {etape < 5 ? (
            <Btn onClick={() => { if (etape === 1 && mode === 'import' && texteImport.trim().length >= 100 && !analyse) lancerAnalyse(); setEtape(etape + 1); }} disabled={!peutContinuer()}>
              Continuer <ArrowRight className="h-4 w-4" />
            </Btn>
          ) : (
            <Btn onClick={creer} disabled={creation || !peutContinuer()}>
              {creation ? 'Création…' : mode === 'nouveau' || mode === 'import' ? 'Créer le contrat' : mode === 'avenant' ? 'Initier l’avenant' : 'Enregistrer la situation'} <Check className="h-4 w-4" />
            </Btn>
          )}
        </div>
      </div>
      {modalPartie && <Modal titre="x" onClose={() => setModalPartie(false)}><p /></Modal>}
    </div>
  );
}

function personnaliser(contenu: string, r: Record<string, string>): string {
  let c = contenu;
  if (r.pays) c = c.replace(/\[PAYS\]/g, r.pays);
  return c;
}

function ModeCard({ actif, onClick, icon, titre, texte }: { actif: boolean; onClick: () => void; icon: React.ReactNode; titre: string; texte: string }) {
  return (
    <button onClick={onClick} className={`cursor-pointer rounded border p-4 text-left transition ${actif ? 'border-fuchsia-400 bg-fuchsia-50' : 'border-line bg-white hover:border-line'}`}>
      <span className={`mb-2 inline-flex rounded-sm p-2 ${actif ? 'bg-fuchsia text-white' : 'bg-white text-muted'}`}>{icon}</span>
      <p className="font-semibold text-ink">{titre}</p>
      <p className="mt-1 text-xs text-muted">{texte}</p>
    </button>
  );
}

function Ligne({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
      <dt className="text-faint">{k}</dt>
      <dd className="text-ink">{v}</dd>
    </div>
  );
}

function Bloc({ titre, items, alerte }: { titre: string; items: string[]; alerte?: boolean }) {
  return (
    <div className={`rounded border p-4 ${alerte ? 'border-fuchsia-200 bg-fuchsia-50' : 'border-line bg-white'}`}>
      <p className={`mb-2 text-sm font-semibold ${alerte ? 'text-fuchsia-600' : 'text-ink'}`}>{titre}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted">{items.map((i, k) => <li key={k}>{i}</li>)}</ul>
    </div>
  );
}

function SelectListe({ titre, n, sel, onToggle, rend }: { titre: string; n: number; sel: Set<number>; onToggle: (i: number) => void; rend: (i: number) => React.ReactNode }) {
  if (n === 0) return null;
  return (
    <div className="card p-4">
      <p className="mb-2 text-sm font-semibold text-ink">{titre}</p>
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {Array.from({ length: n }).map((_, i) => (
          <button key={i} onClick={() => onToggle(i)} className={`block w-full cursor-pointer rounded-sm border p-3 text-left transition ${sel.has(i) ? 'border-success bg-success/5' : 'border-line opacity-60 hover:opacity-100'}`}>
            <span className={`mb-1.5 inline-flex h-5 w-5 items-center justify-center rounded-md border ${sel.has(i) ? 'border-success bg-success text-ink' : 'border-line'}`}>
              {sel.has(i) && <Check className="h-3.5 w-3.5" />}
            </span>
            {rend(i)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function IconRef() {
  void FileText; void Users; void CalendarDays; void Globe2; void Target; void ListChecks; void fichierVersBase64;
  return null;
}

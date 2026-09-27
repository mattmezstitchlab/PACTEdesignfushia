// ============================================================
// PACTE — Hero conversationnel (nouvelle porte d'entrée du Dashboard).
//
// Principe : « L'utilisateur donne ce qu'il sait. L'agent structure.
// L'agent identifie ce qui manque. L'utilisateur confirme. PACTE
// construit le dossier. » — Rien n'est jamais créé sans confirmation
// humaine explicite ; rien n'est jamais annoncé comme créé s'il ne
// l'est pas réellement (voir creerDossier ci-dessous : appels réels à
// l'API, mêmes primitives que l'assistant classique /nouveau).
//
// Ce composant ne remplace pas /nouveau (qui reste disponible, en lien
// discret, pour la création pas à pas) : il devient la porte d'entrée
// UNIQUE mise en avant, ce qui rend redondante l'ancienne paire de
// boutons « Nouveau pacte » / « Signaler une situation » (mêmes deux
// entrées vers le même écran — audit du 27/09).
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Pencil, Sparkles } from 'lucide-react';
import { comprendre, type Comprehension } from '../../lib/comprendre';
import { modeleParCode } from '../../lib/modeles';
import { universParCode } from '../../lib/univers';
import { api, logAction } from '../../lib/api';
import { fmtMontant } from '../../lib/format';

type Etape = 'saisie' | 'analyse' | 'lecture' | 'creation' | 'erreur';

const EXEMPLES = [
  'Créer un contrat avec mon photographe…',
  'Organiser une prestation…',
  'Préparer l’achat d’un bien…',
  'Comprendre une situation…',
];

export default function PacteHeroConversationnel() {
  const nav = useNavigate();
  const [etape, setEtape] = useState<Etape>('saisie');
  const [texte, setTexte] = useState('');
  const [comprehension, setComprehension] = useState<Comprehension | null>(null);
  const [nomContrepartie, setNomContrepartie] = useState('');
  const [champsEdites, setChampsEdites] = useState<Record<string, string>>({});
  const [champEnEdition, setChampEnEdition] = useState<string | null>(null);
  const [erreur, setErreur] = useState('');
  const [reduceMotion, setReduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const zoneRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const f = () => setReduceMotion(mq.matches);
    mq.addEventListener?.('change', f);
    return () => mq.removeEventListener?.('change', f);
  }, []);

  const lancer = () => {
    if (texte.trim().length < 6) return;
    setEtape('analyse');
    // Micro-délai volontairement perceptible (le visuel se réorganise
    // pendant ce court instant) — pas une fausse attente : c'est le temps
    // du calcul + du rendu de la proposition structurée.
    window.setTimeout(() => {
      setComprehension(comprendre(texte));
      setEtape('lecture');
    }, reduceMotion ? 0 : 550);
  };

  const valeurChamp = (cle: string, defaut: string) => champsEdites[cle] ?? defaut;

  const creerDossier = async () => {
    if (!comprehension) return;
    setEtape('creation');
    setErreur('');
    try {
      const modele = modeleParCode(valeurChamp('modele_code', comprehension.modele_code.valeur || 'universel'));
      const roleFinal = valeurChamp('role', comprehension.role_contrepartie.valeur || 'Partie prenante');
      const nom = nomContrepartie.trim();
      const montant = comprehension.montant.valeur;
      const devise = comprehension.devise.valeur || 'EUR';
      const dateEvenement = comprehension.evenement_date.valeur;
      const titre = nom
        ? `${modele.nom} — ${nom}`
        : `${modele.nom} — ${new Date().toLocaleDateString('fr-FR')}`;

      // 1. Contrat (mêmes primitives que /nouveau — aucun second moteur)
      const c = await api.contrats.create({
        titre: titre.slice(0, 160),
        type_modele: modele.code,
        domaine: modele.nom,
        statut: 'brouillon',
        objet: comprehension.prestation.valeur || texte,
        pays: null,
        droit_applicable: null,
        ville: null,
        date_debut: dateEvenement,
        date_fin: null,
        duree: null,
        montant_total: montant,
        devise,
        notes: `Créé depuis l'entrée conversationnelle. Description initiale : « ${texte} »`,
        sante: 'saine',
        version_courante: 1,
      });
      await logAction(c.id, 'contrat_cree', 'contrat', c.id, { mode: 'conversationnel', intention: comprehension.intention });

      // 2. Partie (si un nom a été confirmé) + rattachement avec rôle
      if (nom) {
        const p = await api.parties.create({ nom, type: null, role_defaut: roleFinal });
        await api.contratParties.create({
          contrat_id: c.id, partie_id: p.id, role: roleFinal, qualite: null,
          signature_statut: 'non_signee',
        });
      }

      // 3. Clauses + engagements types du modèle détecté (structure de
      // base identique à celle produite par l'assistant classique).
      let ordre = 1;
      for (const cl of modele.clauses) {
        await api.clauses.create({
          contrat_id: c.id, categorie: cl.categorie, titre: cl.titre,
          contenu: cl.contenu, ordre: ordre++, statut: 'active',
        });
      }
      for (const eg of modele.engagements) {
        await api.engagements.create({
          contrat_id: c.id, titre: eg.titre, quand_texte: eg.quand_texte,
          conditions: eg.conditions || null, preuve_attendue: eg.preuve_attendue || null,
          si_non_rempli: eg.si_non_rempli || null, statut: 'a_faire', priorite: eg.priorite,
        });
      }

      // 4. Échéance d'acompte, si détectée et si un montant existe.
      if (comprehension.acompte_pourcentage.valeur && montant) {
        const montantAcompte = Math.round(montant * (comprehension.acompte_pourcentage.valeur / 100) * 100) / 100;
        await api.echeances.create({
          contrat_id: c.id, titre: 'Acompte', type: 'paiement',
          date_limite: null, montant: montantAcompte, devise, statut: 'a_venir',
          notes: `${comprehension.acompte_pourcentage.valeur} % du montant total, détecté depuis la description initiale.`,
        });
      }

      // 5. Version initiale (traçabilité — jamais d'écrasement silencieux)
      await api.versions.create({
        contrat_id: c.id, numero: 1, titre: 'Version initiale (entrée conversationnelle)',
        resume: `Dossier structuré à partir d'une description en langage naturel, modèle « ${modele.nom} ».`,
        statut: 'validee',
        snapshot: { texte, comprehension },
      });

      nav(`/contrats/${c.id}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'La création du dossier a échoué — rien n’a été enregistré.';
      setErreur(message);
      setEtape('erreur');
    }
  };

  const recommencer = () => {
    setEtape('saisie'); setTexte(''); setComprehension(null);
    setNomContrepartie(''); setChampsEdites({}); setChampEnEdition(null); setErreur('');
  };

  const univers = comprehension?.univers_code.valeur ? universParCode(comprehension.univers_code.valeur) : null;
  const modeleActuel = comprehension ? modeleParCode(valeurChamp('modele_code', comprehension.modele_code.valeur || 'universel')) : null;

  return (
    <div className={`pacte-hero ${etape !== 'saisie' ? 'is-active' : ''}`}>
      <div className="pacte-hero-visuel" aria-hidden="true">
        <img src="/hero/pacte-structure.jpg" alt="" role="presentation" />
      </div>

      <div className="pacte-hero-corps">
        <p className="pacte-hero-kicker">PACTE</p>
        <h1 className="pacte-hero-titre">Comprendre ce qui vous lie.</h1>

        {etape === 'saisie' && (
          <div className="pacte-champ-wrap">
            <textarea
              ref={zoneRef}
              className="pacte-champ"
              placeholder="Décrivez ce que vous voulez faire…"
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); lancer(); } }}
              rows={3}
              aria-label="Décrivez ce que vous voulez faire"
            />
            <button
              type="button"
              className="pacte-champ-envoyer"
              onClick={lancer}
              disabled={texte.trim().length < 6}
              aria-label="Envoyer"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {etape === 'saisie' && (
          <p className="pacte-hero-exemples">
            {EXEMPLES.map((ex, i) => (
              <span key={ex}>
                <button type="button" className="pacte-exemple" onClick={() => setTexte(ex.replace('…', ''))}>{ex}</button>
                {i < EXEMPLES.length - 1 && <span className="pacte-exemple-sep"> · </span>}
              </span>
            ))}
          </p>
        )}

        {etape === 'analyse' && (
          <div className="pacte-analyse" role="status" aria-live="polite">
            <Sparkles className="h-4 w-4" />
            <span>Je structure ce que vous venez d’écrire…</span>
          </div>
        )}

        {etape === 'lecture' && comprehension && modeleActuel && (
          <div className="pacte-lecture" role="group" aria-label="Ce que PACTE a compris">
            <p className="pacte-lecture-titre">J’ai compris.</p>
            <p className="pacte-lecture-phrase">
              {comprehension.intention === 'situation'
                ? 'Vous décrivez une situation en cours.'
                : `Vous préparez : ${modeleActuel.nom.toLowerCase()}${univers ? ` (contexte pressenti : ${univers.nom})` : ''}.`}
            </p>

            <dl className="pacte-champs-compris">
              <ChampLigne
                label="Événement"
                valeur={comprehension.evenement_date.valeur ? new Date(comprehension.evenement_date.valeur).toLocaleDateString('fr-FR') : null}
                confiance={comprehension.evenement_date.confiance}
                enEdition={champEnEdition === 'date'}
                onEditer={() => setChampEnEdition('date')}
                onValider={(v) => { setChampsEdites((c) => ({ ...c, date: v })); setChampEnEdition(null); }}
                type="date"
              />
              <ChampLigne
                label="Prestation"
                valeur={valeurChamp('prestation', comprehension.prestation.valeur || '')}
                confiance={comprehension.prestation.confiance}
                enEdition={champEnEdition === 'prestation'}
                onEditer={() => setChampEnEdition('prestation')}
                onValider={(v) => { setChampsEdites((c) => ({ ...c, prestation: v })); setChampEnEdition(null); }}
              />
              <ChampLigne
                label="Montant"
                valeur={comprehension.montant.valeur ? fmtMontant(comprehension.montant.valeur, comprehension.devise.valeur || 'EUR') : null}
                confiance={comprehension.montant.confiance}
                enEdition={champEnEdition === 'montant'}
                onEditer={() => setChampEnEdition('montant')}
                onValider={(v) => { setChampsEdites((c) => ({ ...c, montant: v })); setChampEnEdition(null); }}
              />
              {comprehension.acompte_pourcentage.valeur && (
                <ChampLigne
                  label="Paiement"
                  valeur={`${comprehension.acompte_pourcentage.valeur} % d’acompte`}
                  confiance={comprehension.acompte_pourcentage.confiance}
                  enEdition={false}
                  onEditer={() => {}}
                  onValider={() => {}}
                  lectureSeule
                />
              )}
              <ChampLigne
                label="Engagement"
                valeur={modeleActuel.nom}
                confiance={comprehension.modele_code.confiance}
                enEdition={champEnEdition === 'modele_code'}
                onEditer={() => setChampEnEdition('modele_code')}
                onValider={(v) => { setChampsEdites((c) => ({ ...c, modele_code: v })); setChampEnEdition(null); }}
              />
            </dl>

            <div className="pacte-question">
              <p className="pacte-question-label">Il me manque une information</p>
              <p className="pacte-question-texte">{comprehension.question_manquante}</p>
              <input
                className="pacte-question-input"
                value={nomContrepartie}
                onChange={(e) => setNomContrepartie(e.target.value)}
                placeholder="Nom, prénom ou raison sociale"
                autoFocus
              />
            </div>

            <div className="pacte-lecture-actions">
              <button type="button" className="pacte-btn-ghost" onClick={recommencer}>Recommencer</button>
              <button type="button" className="pacte-btn-plein" onClick={creerDossier}>
                Confirmer et créer le dossier <Check className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {etape === 'creation' && (
          <div className="pacte-analyse" role="status" aria-live="polite">
            <Sparkles className="h-4 w-4" />
            <span>Création du dossier…</span>
          </div>
        )}

        {etape === 'erreur' && (
          <div className="pacte-erreur" role="alert">
            <p>{erreur}</p>
            <button type="button" className="pacte-btn-ghost" onClick={() => setEtape('lecture')}>Réessayer</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChampLigne({ label, valeur, confiance, enEdition, onEditer, onValider, type, lectureSeule }: {
  label: string;
  valeur: string | null;
  confiance: 'sure' | 'a_confirmer' | 'inconnue';
  enEdition: boolean;
  onEditer: () => void;
  onValider: (v: string) => void;
  type?: string;
  lectureSeule?: boolean;
}) {
  const [brouillon, setBrouillon] = useState(valeur || '');
  return (
    <div className="pacte-champ-ligne">
      <dt>{label}</dt>
      <dd>
        {enEdition ? (
          <span className="pacte-champ-edit">
            <input
              autoFocus
              type={type === 'date' ? 'date' : 'text'}
              className="pacte-champ-edit-input"
              value={brouillon}
              onChange={(e) => setBrouillon(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onValider(brouillon); }}
            />
            <button type="button" onClick={() => onValider(brouillon)} aria-label="Valider"><Check className="h-3.5 w-3.5" /></button>
          </span>
        ) : (
          <span className="pacte-champ-valeur">
            {valeur || <em>Non détecté</em>}
            {confiance === 'a_confirmer' && <span className="pacte-tag-confirmer">à confirmer</span>}
            {!lectureSeule && (
              <button type="button" className="pacte-champ-modifier" onClick={() => { setBrouillon(valeur || ''); onEditer(); }} aria-label={`Modifier ${label}`}>
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </span>
        )}
      </dd>
    </div>
  );
}

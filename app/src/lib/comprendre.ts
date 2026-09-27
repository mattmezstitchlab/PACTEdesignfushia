// ============================================================
// PACTE — Moteur de compréhension du langage naturel (100 % local).
// Même philosophie que lib/analyse.ts : aucune donnée envoyée à un
// service tiers, aucune certitude inventée. Chaque champ porte un
// niveau de confiance ('sure' | 'a_confirmer' | 'inconnue') ; rien
// n'est jamais écrit dans le moteur PACTE sans validation humaine
// explicite (voir components/hero/PacteHeroConversationnel.tsx).
//
// Ce module ne remplace ni ne duplique le moteur : il produit une
// PROPOSITION structurée à partir des mêmes vocabulaires déjà utilisés
// par l'assistant classique (/nouveau) — lib/modeles.ts (types de
// pactes) et lib/univers.ts (contexte). GAIA comprend, PACTE structure,
// l'humain décide.
// ============================================================
import { MODELES } from './modeles';
import { UNIVERS } from './univers';

export type Confiance = 'sure' | 'a_confirmer' | 'inconnue';

export interface Champ<T> {
  valeur: T | null;
  confiance: Confiance;
}

export interface Comprehension {
  texte: string;
  intention: 'nouveau' | 'situation';
  modele_code: Champ<string>;
  univers_code: Champ<string>;
  role_contrepartie: Champ<string>;
  prestation: Champ<string>;
  evenement_date: Champ<string>; // ISO yyyy-mm-dd
  montant: Champ<number>;
  devise: Champ<string>;
  acompte_pourcentage: Champ<number>;
  question_manquante: string | null;
}

const MOIS: Record<string, string> = {
  janvier: '01', fevrier: '02', février: '02', mars: '03', avril: '04', mai: '05',
  juin: '06', juillet: '07', aout: '08', août: '08', septembre: '09', octobre: '10',
  novembre: '11', decembre: '12', décembre: '12',
};

function detecterDate(texte: string): Champ<string> {
  let m = texte.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) {
    let a = parseInt(m[3], 10);
    if (a < 100) a += 2000;
    return { valeur: `${a}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`, confiance: 'sure' };
  }
  m = texte.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return { valeur: `${m[1]}-${m[2]}-${m[3]}`, confiance: 'sure' };
  const bas = texte.toLowerCase();
  m = bas.match(/(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(\d{4})/);
  if (m) return { valeur: `${m[3]}-${MOIS[m[2]]}-${m[1].padStart(2, '0')}`, confiance: 'sure' };
  return { valeur: null, confiance: 'inconnue' };
}

function detecterMontant(texte: string): { montant: Champ<number>; devise: Champ<string> } {
  const t = texte.replace(/[\u202f\u00a0]/g, ' ');
  // (?!\w) plutôt que \b : un montant suivi d'une ponctuation (ex. « 1 500 €, »)
  // doit être détecté — \b échoue quand le symbole de devise (non alphanumérique)
  // est immédiatement suivi d'un signe de ponctuation (non alphanumérique lui
  // aussi) : aucune frontière \w/\W ne s'y forme. Bug identifié et corrigé le
  // 27/09 lors de la vérification fonctionnelle du hero conversationnel.
  const m = t.match(/(\d[\d\s.,]*)\s?(€|euros?|EUR|FCFA|F\s?CFA|\$|USD|CHF|£|MAD|DT|DA)(?!\w)/i);
  if (!m) return { montant: { valeur: null, confiance: 'inconnue' }, devise: { valeur: null, confiance: 'inconnue' } };
  const n = parseFloat(m[1].replace(/\s/g, '').replace(',', '.'));
  if (isNaN(n)) return { montant: { valeur: null, confiance: 'inconnue' }, devise: { valeur: null, confiance: 'inconnue' } };
  const symbole = m[2].toLowerCase();
  const devise = symbole.includes('€') || symbole.includes('euro') ? 'EUR'
    : symbole.includes('$') || symbole.includes('usd') ? 'USD'
    : symbole.includes('chf') ? 'CHF' : symbole.includes('£') ? 'GBP' : 'EUR';
  return { montant: { valeur: n, confiance: 'sure' }, devise: { valeur: devise, confiance: 'sure' } };
}

function detecterAcompte(texte: string): Champ<number> {
  const m = texte.match(/(\d{1,3})\s?%\s*(?:d['’]\s*)?(?:acompte|avance|arrhes)?/i) || texte.match(/acompte\s+de\s+(\d{1,3})\s?%/i);
  if (!m) return { valeur: null, confiance: 'inconnue' };
  const n = parseInt(m[1], 10);
  if (isNaN(n) || n <= 0 || n > 100) return { valeur: null, confiance: 'inconnue' };
  return { valeur: n, confiance: 'sure' };
}

// Vocabulaire élargi : le langage courant ne reprend pas les libellés
// formels des modèles (lib/modeles.ts) — on relie donc des mots du
// quotidien vers les codes de modèles déjà existants (aucun nouveau
// modèle créé ici).
const SYNONYMES_MODELE: Record<string, string[]> = {
  freelance: ['photographe', 'graphiste', 'développeur', 'developpeur', 'designer', 'consultant', 'coach', 'traducteur', 'rédacteur', 'redacteur', 'vidéaste', 'videaste', 'webmaster', 'indépendant', 'independant', 'freelance', 'mission', 'pigiste'],
  prestation_pro: ['prestataire', 'prestation', 'service', 'société', 'societe', 'agence', 'sous-traitance'],
  location: ['loyer', 'locataire', 'bailleur', 'bail', 'louer', 'location', 'loue'],
  vente: ['vendre', 'achat', 'acheteur', 'vendeur', 'vente'],
  commercial: ['fournisseur', 'distribution', 'cgv', 'client professionnel'],
  partenariat: ['partenaire', 'association', 'joint-venture', 'apport'],
  pacte_prive: ['prêt', 'pret', 'prêter', 'preter', 'rembourser', 'entraide', 'ami', 'famille'],
};

function detecterModele(texte: string): Champ<string> {
  const bas = texte.toLowerCase();
  const scores: Record<string, number> = {};
  for (const modele of MODELES) {
    let score = 0;
    if (bas.includes(modele.nom.toLowerCase())) score += 3;
    for (const mot of modele.description.toLowerCase().split(/[^a-zàâäéèêëïîôöùûüç]+/)) {
      if (mot.length > 4 && bas.includes(mot)) score += 1;
    }
    if (score > 0) scores[modele.code] = (scores[modele.code] || 0) + score;
  }
  for (const [code, mots] of Object.entries(SYNONYMES_MODELE)) {
    for (const mot of mots) {
      if (bas.includes(mot)) scores[code] = (scores[code] || 0) + 2;
    }
  }
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return { valeur: 'universel', confiance: 'a_confirmer' };
  return { valeur: entries[0][0], confiance: entries.length > 1 && entries[0][1] === entries[1][1] ? 'a_confirmer' : 'a_confirmer' };
}

const MOTS_CLES_UNIVERS: Record<string, string[]> = {
  personnel: ['famille', 'ami', 'mariage', 'maison', 'quotidien', 'proche', 'couple'],
  professionnel: ['mission', 'client', 'travail', 'boulot'],
  entreprise: ['entreprise', 'société', 'societe', 'boîte', 'boite', 'salarié', 'salarie', 'associé', 'associe'],
  projets: ['projet', 'chantier', 'lancer', 'construire'],
  spectacle: ['spectacle', 'intermittent', 'cachet', 'tournée', 'tournee', 'scène', 'scene'],
  art: ['œuvre', 'oeuvre', 'tableau', 'exposition', 'artiste', 'galerie', 'peinture'],
  musique: ['musicien', 'chanson', 'morceau', 'concert', 'guitare', 'saxophone', 'dj', 'groupe', 'album'],
  audiovisuel: ['film', 'vidéo', 'video', 'tournage', 'montage', 'photographe', 'photo', 'caméra', 'camera'],
  propriete_intellectuelle: ['brevet', 'marque', "droit d'auteur", 'licence'],
  immobilier: ['maison', 'appartement', 'immobilier', 'notaire', 'bien immobilier', 'acheter une maison'],
  biens_actifs: ['bijou', 'montre', 'collection', 'objet de valeur'],
  commerce: ['boutique', 'commande', 'sav', 'magasin'],
  associations: ['association', 'bénévole', 'benevole', 'adhérent', 'adherent'],
  recherche: ['laboratoire', 'recherche', 'chercheur', 'étude', 'etude'],
  formation: ['formation', 'école', 'ecole', 'carrière', 'carriere', 'diplôme', 'diplome'],
  voyage: ['voyage', 'séjour', 'sejour', 'hôtel', 'hotel', 'billet', 'vacances'],
  assurance: ['assurance', 'sinistre', 'assureur'],
  financement: ['financement', 'investisseur', 'levée de fonds', 'levee de fonds'],
  finance_marches: ['bourse', 'actions', 'portefeuille', 'marché financier', 'marche financier'],
};

function detecterUnivers(texte: string): Champ<string> {
  const bas = texte.toLowerCase();
  const scores: Record<string, number> = {};
  for (const [code, mots] of Object.entries(MOTS_CLES_UNIVERS)) {
    for (const mot of mots) if (bas.includes(mot)) scores[code] = (scores[code] || 0) + 1;
  }
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return { valeur: null, confiance: 'inconnue' };
  // Toujours "à confirmer" : un contexte proposé par le moteur n'est
  // jamais présenté comme une certitude (cf. philosophie GAIA × PACTE).
  const code = UNIVERS.some((u) => u.code === entries[0][0]) ? entries[0][0] : null;
  return { valeur: code, confiance: 'a_confirmer' };
}

const ROLES_CONNUS = [
  'photographe', 'traiteur', 'dj', 'fleuriste', 'wedding planner', 'avocat', 'notaire',
  'agence', 'artisan', 'coach', 'développeur', 'developpeur', 'designer', 'graphiste',
  'architecte', 'déménageur', 'demenageur', 'plombier', 'électricien', 'electricien',
  'comptable', 'consultant', 'vidéaste', 'videaste', 'décorateur', 'decorateur',
  'locataire', 'bailleur', 'prestataire', 'freelance', 'indépendant', 'independant',
  'maçon', 'macon', 'serrurier', 'peintre', 'paysagiste', 'professeur', 'formateur',
  'traducteur', 'rédacteur', 'redacteur',
];

function detecterRole(texte: string): Champ<string> {
  const bas = texte.toLowerCase();
  for (const role of ROLES_CONNUS) {
    if (bas.includes(role)) return { valeur: role, confiance: 'sure' };
  }
  return { valeur: null, confiance: 'inconnue' };
}

function detecterPrestation(texte: string, role: Champ<string>): Champ<string> {
  // Faute de repérage plus fin, la prestation reprend le texte tel
  // quel (raccourci) : c'est toujours ce que l'utilisateur a réellement
  // écrit — jamais une reformulation inventée.
  const t = texte.trim();
  if (role.valeur) return { valeur: `Prestation — ${role.valeur}`, confiance: 'a_confirmer' };
  if (t.length > 0) return { valeur: t.length > 90 ? `${t.slice(0, 90)}…` : t, confiance: 'a_confirmer' };
  return { valeur: null, confiance: 'inconnue' };
}

const SIGNAUX_SITUATION = [
  'problème', 'probleme', 'il y a eu', 'en retard', 'retard', 'annulé', 'annule',
  "n'a pas", 'ne respecte pas', 'litige', 'conflit', 'je viens de', 'vient de se passer',
  'incident', 'impayé', 'impaye', 'ne répond plus', 'ne repond plus',
];

function detecterIntention(texte: string): 'nouveau' | 'situation' {
  const bas = texte.toLowerCase();
  return SIGNAUX_SITUATION.some((s) => bas.includes(s)) ? 'situation' : 'nouveau';
}

export function comprendre(texteBrut: string): Comprehension {
  const texte = texteBrut.trim();
  const role = detecterRole(texte);
  const { montant, devise } = detecterMontant(texte);
  const modele = detecterModele(texte);

  let question_manquante: string | null = null;
  if (role.valeur) {
    question_manquante = `Quel est le nom (ou la raison sociale) de votre ${role.valeur} ?`;
  } else {
    question_manquante = 'Avec qui souhaitez-vous conclure cet accord ?';
  }

  return {
    texte,
    intention: detecterIntention(texte),
    modele_code: modele,
    univers_code: detecterUnivers(texte),
    role_contrepartie: role,
    prestation: detecterPrestation(texte, role),
    evenement_date: detecterDate(texte),
    montant,
    devise,
    acompte_pourcentage: detecterAcompte(texte),
    question_manquante,
  };
}

// ============================================================
// PACTE — Types du système vivant d'engagements
// CONTRAT → PARTIES → ENGAGEMENTS → CONDITIONS → ÉVÉNEMENTS →
// ÉCHÉANCES → PREUVES → ALERTES → ACTIONS → HISTORIQUE → DOSSIER
// ============================================================

export interface Contrat {
  id: number;
  titre: string;
  type_modele: string | null;
  domaine: string | null;
  statut: string;
  objet: string | null;
  pays: string | null;
  droit_applicable: string | null;
  ville: string | null;
  date_debut: string | null;
  date_fin: string | null;
  duree: string | null;
  montant_total: number | null;
  devise: string | null;
  notes: string | null;
  sante: string | null;
  version_courante: number;
  created_at: string;
  updated_at: string;
}

export interface Partie {
  id: number;
  nom: string;
  type: string | null;
  role_defaut: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
  pays: string | null;
  identifiant_national: string | null;
  statut_professionnel: string | null;
  representant_nom: string | null;
  representant_qualite: string | null;
  notes: string | null;
  created_at: string;
}

export interface ContratPartie {
  id: number;
  contrat_id: number;
  partie_id: number;
  role: string | null;
  qualite: string | null;
  relation: string | null;
  engagement_resume: string | null;
  signature_statut: string | null;
  signature_date: string | null;
  created_at: string;
  partie?: Partie;
}

export interface Clause {
  id: number;
  contrat_id: number;
  categorie: string | null;
  titre: string | null;
  contenu: string | null;
  ordre: number | null;
  statut: string | null;
  incertitude: string | null;
  created_at: string;
}

export interface Engagement {
  id: number;
  contrat_id: number | null;
  objet_id: number | null;
  titre: string;
  description: string | null;
  qui_partie_id: number | null;
  qui_texte: string | null;
  pour_qui_partie_id: number | null;
  pour_qui_texte: string | null;
  quand_texte: string | null;
  date_echeance: string | null;
  lieu: string | null;
  conditions: string | null;
  preuve_attendue: string | null;
  si_non_rempli: string | null;
  statut: string | null;
  priorite: string | null;
  created_at: string;
  updated_at: string;
}

export interface Echeance {
  id: number;
  contrat_id: number | null;
  objet_id: number | null;
  engagement_id: number | null;
  titre: string | null;
  type: string | null;
  date_limite: string | null;
  montant: number | null;
  devise: string | null;
  statut: string | null;
  notes: string | null;
  created_at: string;
}

export interface Evenement {
  id: number;
  contrat_id: number | null;
  objet_id: number | null;
  type: string | null;
  titre: string | null;
  description: string | null;
  date_evenement: string | null;
  auteur: string | null;
  statut: string | null;
  engagement_ids: number[] | null;
  created_at: string;
}

export interface Preuve {
  id: number;
  contrat_id: number | null;
  objet_id: number | null;
  titre: string | null;
  type: string | null;
  description: string | null;
  fichier_url: string | null;
  fichier_nom: string | null;
  engagement_id: number | null;
  evenement_id: number | null;
  auteur: string | null;
  date_preuve: string | null;
  empreinte: string | null;
  created_at: string;
}

export interface Alerte {
  id: number;
  contrat_id: number | null;
  objet_id: number | null;
  code: string | null;
  gravite: string | null;
  titre: string | null;
  message: string | null;
  entite_type: string | null;
  entite_id: number | null;
  statut: string | null;
  action_suggeree: string | null;
  created_at: string;
}

export interface Action {
  id: number;
  contrat_id: number | null;
  objet_id: number | null;
  titre: string | null;
  description: string | null;
  priorite: string | null;
  statut: string | null;
  echeance: string | null;
  alerte_id: number | null;
  responsable: string | null;
  created_at: string;
  updated_at: string;
}

export interface Scenario {
  id: number;
  contrat_id: number | null;
  objet_id: number | null;
  nom: string | null;
  declencheur: string | null;
  declencheur_type: string | null;
  condition_verif: string | null;
  engagements_cibles: number[] | null;
  clauses_mots_cles: string | null;
  actions_suggerees: string | null;
  note_prudence: string | null;
  actif: boolean | null;
  created_at: string;
}

export interface Version {
  id: number;
  contrat_id: number | null;
  objet_id: number | null;
  numero: number | null;
  titre: string | null;
  resume: string | null;
  statut: string | null;
  snapshot: any;
  created_at: string;
}

export interface Historique {
  id: number;
  contrat_id: number | null;
  objet_id: number | null;
  acteur: string | null;
  action: string | null;
  entite_type: string | null;
  entite_id: number | null;
  details: any;
  created_at: string;
}


export interface Modele {
  id: number;
  code: string | null;
  nom: string | null;
  description: string | null;
  couleur: string | null;
  icone: string | null;
  donnees: any;
  created_at: string;
}

// ============================================================
// MOTEUR UNIVERSEL — PACTE ne gère pas que des contrats : il structure
// ce qui relie personnes, organisations, objets, projets, engagements,
// événements, documents, valeurs et décisions dans le temps.
// Le contrat (ci-dessus) reste un cas particulier de l'OBJET universel ;
// les mêmes briques (Engagement/Échéance/Événement/Preuve/Alerte/
// Scénario/Version/Historique) sont réutilisées telles quelles — elles
// portent désormais soit contrat_id, soit objet_id, jamais les deux à
// la fois. Aucune table ni logique n'est dupliquée.
// ============================================================

// OBJET — ce que le moteur suit dans le temps quand ce n'est pas un
// contrat au sens strict : projet, œuvre, actif, bien, mission, dossier,
// carrière, portefeuille… Le champ `univers` ne fait que configurer les
// libellés/suggestions ; il ne détermine jamais l'architecture.
export interface Objet {
  id: number;
  univers: string;
  type_objet: string;
  titre: string;
  description: string | null;
  statut: string | null;
  pays: string | null;
  droit_applicable: string | null;
  devise: string | null;
  valeur_declaree: number | null;
  date_debut: string | null;
  date_fin: string | null;
  notes: string | null;
  sante: string | null;
  created_at: string;
  updated_at: string;
}

// RELATION — ce qui relie une entité (personne/organisation, via la
// table `parties` déjà existante — aucune identité n'est recréée) à un
// objet, un contrat, ou une autre entité : propriété, participation,
// collaboration, représentation, prestation, partenariat, responsabilité,
// utilisation, licence… Le rôle appartient à la relation, pas à l'identité.
export interface Relation {
  id: number;
  type_relation: string;
  role: string | null;
  partie_id: number | null;
  objet_id: number | null;
  contrat_id: number | null;
  autre_partie_id: number | null;
  date_debut: string | null;
  date_fin: string | null;
  statut: string | null;
  notes: string | null;
  created_at: string;
  partie?: Partie;
  autre_partie?: Partie;
}

// DONNÉE — valeur, mesure, montant, quantité, date, état, indicateur
// observé pour un objet ou un contrat. Toujours daté et sourcé ; jamais
// présenté comme une prédiction (voir lib/analyseValeur.ts).
export interface Metrique {
  id: number;
  objet_id: number | null;
  contrat_id: number | null;
  libelle: string;
  valeur: number | null;
  unite: string | null;
  date_mesure: string | null;
  source: string | null;
  statut: string | null; // declaree | documentee | confirmee | a_verifier
  notes: string | null;
  created_at: string;
}

// DÉCISION — ce que l'humain décide finalement, distinct de toute
// suggestion, simulation ou analyse IA. Toujours horodatée et rattachée
// à ce qui a éclairé la décision (analyses, scénarios, alertes).
export interface Decision {
  id: number;
  objet_id: number | null;
  contrat_id: number | null;
  titre: string;
  description: string | null;
  decideur: string | null;
  fondee_sur: string | null;
  date_decision: string;
  created_at: string;
}

export const TYPES_RELATION = [
  'propriete', 'participation', 'collaboration', 'representation', 'prestation',
  'partenariat', 'responsabilite', 'utilisation', 'licence', 'autre',
];

export const TYPES_OBJET = [
  'projet', 'oeuvre', 'actif', 'bien', 'mission', 'dossier', 'carriere', 'portefeuille', 'autre',
];


// ---- Types dérivés (moteurs) ----

export interface AlerteCalculee {
  code: string;
  gravite: 'info' | 'attention' | 'critique';
  titre: string;
  message: string;
  entite_type: string;
  entite_id: number | null;
  action_suggeree: string;
}

export interface Anticipation {
  horizon_jours: number;
  titre: string;
  description: string;
  source: string;
  preparation: string;
}

export interface EvaluationScenario {
  scenario: Scenario;
  evenements_declencheurs: Evenement[];
  echeances_concernees: Echeance[];
  engagements_concernes: Engagement[];
  clauses_correspondantes: Clause[];
  preuves_liees: Preuve[];
  actions_possibles: string[];
  niveau_confiance: string;
  avertissement: string;
}

export interface AnalyseDocument {
  infos_detectees: { etiquette: string; valeur: string; extrait: string }[];
  engagements_proposes: {
    titre: string;
    description: string;
    quand_texte: string;
    date_echeance: string | null;
    conditions: string;
    preuve_attendue: string;
    extrait: string;
  }[];
  echeances_proposees: {
    titre: string;
    type: string;
    date_limite: string | null;
    montant: number | null;
    extrait: string;
  }[];
  clauses_proposees: { categorie: string; titre: string; contenu: string; extrait: string }[];
  points_vigilance: string[];
  score_confiance: string;
}

// ANALYSE DE VALEUR — jamais « valeur future = X ». Toujours :
// valeur observée + données + évolution + facteurs + scénarios + incertitude.
export interface AnalyseValeur {
  valeur_observee: number | null;
  devise: string | null;
  date_observation: string | null;
  nb_mesures: number;
  evolution: { date: string; valeur: number }[];
  variation_pct: number | null;
  facteurs: string[];
  donnees_manquantes: string[];
  incertitude: string;
}

export const CATEGORIES_CLAUSES = [
  'OBJET',
  'OBLIGATIONS',
  'DROITS',
  'CONDITIONS',
  'PRIX & PAIEMENTS',
  'LIVRABLES',
  'ÉCHÉANCES',
  'VALIDATIONS',
  'ANNULATION',
  'MODIFICATION',
  'RÉSILIATION',
  'RESPONSABILITÉS',
  'ÉVÉNEMENTS EXCEPTIONNELS',
  'PREUVES',
  'SIGNATURES',
  'DIVERS',
];

export const TYPES_EVENEMENT = [
  'paiement',
  'retard',
  'modification',
  'annulation',
  'absence',
  'demande',
  'validation',
  'refus',
  'livraison',
  'reception',
  'incident',
  'impossibilite',
  'force_majeure',
  'communication',
  'document',
  'signature',
  'avenant',
  'autre',
];

export const TYPES_PREUVE = [
  'contrat_signe',
  'avenant',
  'facture',
  'recu_paiement',
  'releve',
  'bon_livraison',
  'proces_verbal',
  'courriel',
  'courrier',
  'message',
  'photo',
  'attestation',
  'identite',
  'autre',
];

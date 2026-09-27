// ============================================================
// PACTE — Catalogue des UNIVERS.
// Un Univers ne fait QUE configurer des libellés, un vocabulaire
// éditorial et des points de vigilance : il ne détermine JAMAIS
// l'architecture. Le moteur (Objet → Relation → Engagement → Échéance
// → Événement → Preuve → Alerte → Scénario → Décision) reste unique et
// partagé par tous les univers, y compris ContractOS (le contrat en
// est le cas particulier historique).
//
// Cette configuration alimente à la fois :
// - le formulaire de création d'objet (typesObjets) ;
// - les pages « portes d'entrée » éditoriales (/univers et
//   /univers/:code) — manifeste, vocabulaire, exemples, media.
// Aucune nouvelle table, aucun nouveau composant par univers : un seul
// moteur, une seule collection de configurations.
// ============================================================

// Emplacement des visuels d'un univers. Tous les champs sont optionnels
// et volontairement vides tant qu'aucune source d'images réelle n'est
// branchée (voir README) : PACTE ne fabrique jamais de fausses photos
// présentées comme du contenu réel. En leur absence, l'interface
// affiche un fond typographique/chromatique (couleurAccent) au lieu
// d'une image inventée.
export interface UniversMedia {
  cover?: string;
  coverMobile?: string;
  video?: string;
  credit?: string;
  alt?: string;
}

export interface UniversDef {
  code: string;
  nom: string;
  description: string;
  couleur: string;
  typesObjets: { code: string; label: string }[];
  vigilance: string[];
  /** Phrase manifeste courte affichée en grand sur la porte d'entrée éditoriale. */
  manifeste: string;
  /** Vocabulaire concret de l'univers (objets, relations, événements, preuves, données mêlés) — éditorial, pas un nouveau modèle. */
  vocabulaire: string[];
  /** Exemples concrets et courts de ce que PACTE peut organiser dans cet univers. */
  exemples: string[];
  /** Visuels — voir UniversMedia. Absent tant qu'aucune source réelle n'est branchée. */
  media?: UniversMedia;
}

export const UNIVERS: UniversDef[] = [
  {
    code: 'personnel', nom: 'Personnel', couleur: '#7c6cf0',
    description: 'Pactes privés, vie familiale, mariage, union, achats communs, engagements entre proches.',
    manifeste: 'Ce qui se dit en famille mérite aussi d’être écrit.',
    typesObjets: [{ code: 'dossier', label: 'Dossier personnel' }, { code: 'projet', label: 'Projet familial' }, { code: 'bien', label: 'Bien commun' }],
    vocabulaire: ['Foyer', 'Proche', 'Bien commun', 'Achat partagé', 'Promesse', 'Répartition', 'Événement de vie', 'Preuve écrite'],
    exemples: ['Un achat commun entre concubins', 'Une répartition de frais de famille', 'Un prêt entre proches'],
    vigilance: ['Même entre proches, l’écrit signé change tout en cas de désaccord.'],
  },
  {
    code: 'professionnel', nom: 'Professionnel', couleur: '#0ea5a5',
    description: 'Prestations, freelance, missions, clients, fournisseurs.',
    manifeste: 'Chaque mission mérite un périmètre écrit et suivi.',
    typesObjets: [{ code: 'mission', label: 'Mission' }, { code: 'projet', label: 'Projet client' }],
    vocabulaire: ['Client', 'Prestataire', 'Mission', 'Livrable', 'Facture', 'Échéance', 'Preuve de livraison', 'Litige de mission'],
    exemples: ['Une mission freelance avec livrables datés', 'Un différend sur un périmètre de prestation'],
    vigilance: ['Le périmètre écrit précisément évite l’essentiel des litiges de mission.'],
  },
  {
    code: 'entreprise', nom: 'Entreprise', couleur: '#2563eb',
    description: 'Associés, collaborateurs, clients, fournisseurs, actifs, décisions, obligations.',
    manifeste: 'Une entreprise se gouverne aussi par ses preuves.',
    typesObjets: [{ code: 'dossier', label: 'Dossier société' }, { code: 'actif', label: 'Actif d’entreprise' }, { code: 'projet', label: 'Projet interne' }],
    vocabulaire: ['Associé', 'Collaborateur', 'Fournisseur', 'Actif', 'Décision', 'Obligation', 'Procès-verbal', 'Engagement contractuel'],
    exemples: ['Un pacte d’associés et ses engagements', 'Le suivi d’un actif d’entreprise sur plusieurs années'],
    vigilance: ['Les décisions engageant la société méritent une traçabilité écrite systématique.'],
  },
  {
    code: 'projets', nom: 'Projets', couleur: '#d97706',
    description: 'Création d’entreprise, application, film, album, exposition, chantier, événement, voyage, recherche, campagne, association…',
    manifeste: 'Tout projet mérite une mémoire de ce qui a été décidé.',
    typesObjets: [{ code: 'projet', label: 'Projet' }],
    vocabulaire: ['Porteur de projet', 'Contributeur', 'Jalon', 'Budget', 'Décision', 'Risque', 'Livrable', 'Bilan'],
    exemples: ['Le lancement d’une application avec ses jalons', 'Un chantier suivi de la préparation à la réception'],
    vigilance: ['Un projet sans budget ni échéances tracés dérive plus facilement.'],
  },
  {
    code: 'spectacle', nom: 'Spectacle & intermittence', couleur: '#e2547e',
    description: 'Artistes, techniciens, producteurs, compagnies, représentations, répétitions, engagements, rémunérations, justificatifs.',
    manifeste: 'Une carrière d’intermittent se construit cachet après cachet, preuve après preuve.',
    typesObjets: [{ code: 'carriere', label: 'Chronologie professionnelle' }, { code: 'projet', label: 'Production / spectacle' }],
    vocabulaire: ['Artiste', 'Technicien', 'Producteur', 'Compagnie', 'Cachet', 'Répétition', 'Représentation', 'Heures déclarées', 'Justificatif'],
    exemples: ['La chronologie professionnelle d’un technicien du spectacle', 'Le suivi d’une production de sa création à sa tournée'],
    vigilance: ['Les simulations (cachets, heures, droits) ne sont jamais des droits acquis.'],
  },
  {
    code: 'art', nom: 'Art', couleur: '#9333ea',
    description: 'Œuvres, artistes, propriétaires, provenance, acquisition, vente, exposition, prêt, restauration, expertise, certificat, assurance, transport, stockage.',
    manifeste: 'Comprendre une œuvre dans toute son histoire.',
    typesObjets: [{ code: 'oeuvre', label: 'Œuvre' }],
    vocabulaire: ['Œuvre', 'Artiste', 'Propriétaire', 'Provenance', 'Exposition', 'Vente', 'Expertise', 'Certificat', 'Assurance', 'Transport', 'Restauration', 'Valeur observée'],
    exemples: ['La provenance complète d’une toile depuis son acquisition', 'Le suivi d’une œuvre prêtée pour une exposition'],
    vigilance: ['PACTE ne garantit jamais une valeur future — seulement des observations datées et sourcées.'],
  },
  {
    code: 'musique', nom: 'Musique', couleur: '#16a34a',
    description: 'Œuvres, auteurs, compositeurs, interprètes, producteurs, masters, éditions, licences, distribution, concerts, royalties.',
    manifeste: 'Une œuvre musicale porte autant de droits que d’auteurs.',
    typesObjets: [{ code: 'oeuvre', label: 'Œuvre musicale' }, { code: 'projet', label: 'Projet / tournée' }],
    vocabulaire: ['Auteur', 'Compositeur', 'Interprète', 'Producteur', 'Master', 'Édition', 'Licence', 'Distribution', 'Royalties', 'Concert'],
    exemples: ['La répartition des droits d’un titre entre auteurs', 'Le suivi d’une tournée et de ses cachets'],
    vigilance: ['Distinguez toujours propriété, droit, licence et cession (voir Propriété intellectuelle).'],
  },
  {
    code: 'audiovisuel', nom: 'Audiovisuel', couleur: '#0891b2',
    description: 'Films, séries, vidéos, scénarios, producteurs, acteurs, techniciens, tournages, droits, financements, diffusion.',
    manifeste: 'Un tournage engage autant de personnes que de droits.',
    typesObjets: [{ code: 'projet', label: 'Production audiovisuelle' }, { code: 'oeuvre', label: 'Œuvre' }],
    vocabulaire: ['Producteur', 'Réalisateur', 'Acteur', 'Technicien', 'Scénario', 'Tournage', 'Droit de diffusion', 'Financement', 'Distribution'],
    exemples: ['Le financement d’un film poste par poste', 'Le suivi des droits de diffusion d’une série'],
    vigilance: ['Les financements et droits de diffusion doivent être tracés poste par poste.'],
  },
  {
    code: 'propriete_intellectuelle', nom: 'Propriété intellectuelle', couleur: '#475569',
    description: 'Marques, logiciels, photographies, textes, créations, licences, cessions, droits, territoires, durées.',
    manifeste: 'Propriété, droit, licence et cession ne sont jamais la même chose.',
    typesObjets: [{ code: 'oeuvre', label: 'Création protégée' }],
    vocabulaire: ['Créateur', 'Marque', 'Logiciel', 'Licence', 'Cession', 'Territoire', 'Durée', 'Redevance'],
    exemples: ['La cession territoriale d’une licence logicielle', 'Le dépôt et le suivi d’une marque'],
    vigilance: ['Séparez toujours propriété, droit, licence, cession et utilisation.'],
  },
  {
    code: 'immobilier', nom: 'Immobilier', couleur: '#b45309',
    description: 'Biens, propriétaires, locataires, baux, achats, ventes, travaux, diagnostics, assurances, incidents.',
    manifeste: 'Un bien se documente dès le premier état des lieux.',
    typesObjets: [{ code: 'bien', label: 'Bien immobilier' }],
    vocabulaire: ['Propriétaire', 'Locataire', 'Bail', 'État des lieux', 'Travaux', 'Diagnostic', 'Loyer', 'Incident'],
    exemples: ['Le suivi complet d’une location, du bail à l’état des lieux de sortie', 'Un chantier de travaux et ses preuves'],
    vigilance: ['L’état des lieux d’entrée est la pièce la plus déterminante.'],
  },
  {
    code: 'biens_actifs', nom: 'Biens & actifs', couleur: '#65a30d',
    description: 'Véhicules, camping-cars, bateaux, instruments, matériel professionnel, machines, équipements.',
    manifeste: 'Un bien qui dure se raconte par ses entretiens.',
    typesObjets: [{ code: 'actif', label: 'Bien / actif' }],
    vocabulaire: ['Propriétaire', 'Acheteur', 'Entretien', 'Réparation', 'Facture', 'État', 'Revente'],
    exemples: ['L’historique d’entretien d’un véhicule avant revente', 'Le suivi d’un instrument professionnel prêté'],
    vigilance: ['Photographiez et datez l’état du bien à chaque étape (achat, prêt, entretien, revente).'],
  },
  {
    code: 'commerce', nom: 'Commerce', couleur: '#c026d3',
    description: 'Commandes, achats, ventes, livraisons, garanties, retours, paiements, remboursements, SAV.',
    manifeste: 'Une commande se défend avec ses preuves, pas ses souvenirs.',
    typesObjets: [{ code: 'dossier', label: 'Dossier commande / SAV' }],
    vocabulaire: ['Client', 'Vendeur', 'Commande', 'Livraison', 'Garantie', 'Retour', 'Remboursement', 'Réclamation'],
    exemples: ['Un litige de livraison non conforme', 'Le suivi d’une garantie et de son SAV'],
    vigilance: ['Conservez systématiquement les preuves de commande, paiement et livraison.'],
  },
  {
    code: 'associations', nom: 'Associations', couleur: '#059669',
    description: 'Membres, dirigeants, statuts, décisions, projets, financements, dons, dépenses.',
    manifeste: 'Une association se gouverne par ses comptes rendus.',
    typesObjets: [{ code: 'dossier', label: 'Dossier association' }, { code: 'projet', label: 'Projet associatif' }],
    vocabulaire: ['Membre', 'Dirigeant', 'Statuts', 'Assemblée', 'Décision', 'Don', 'Dépense', 'Financement'],
    exemples: ['Le compte rendu d’une assemblée générale', 'Le suivi d’un financement associatif fléché'],
    vigilance: ['Les décisions d’assemblée méritent un compte rendu écrit versé au dossier.'],
  },
  {
    code: 'recherche', nom: 'Recherche', couleur: '#4338ca',
    description: 'Hypothèses, expériences, résultats, sources, versions, collaborations, publications.',
    manifeste: 'Une hypothèse n’est pas un résultat.',
    typesObjets: [{ code: 'projet', label: 'Projet de recherche' }],
    vocabulaire: ['Chercheur', 'Collaborateur', 'Hypothèse', 'Expérience', 'Donnée observée', 'Résultat', 'Publication', 'Source'],
    exemples: ['Le suivi d’un protocole de recherche et de ses versions', 'Une collaboration inter-laboratoires tracée'],
    vigilance: ['Distinguez toujours donnée observée, hypothèse et résultat validé.'],
  },
  {
    code: 'formation', nom: 'Formation & carrière', couleur: '#0d9488',
    description: 'Diplômes, certifications, compétences, missions, expériences, portfolio, preuves.',
    manifeste: 'Un parcours se prouve autant qu’il se raconte.',
    typesObjets: [{ code: 'carriere', label: 'Parcours professionnel' }],
    vocabulaire: ['Diplôme', 'Certification', 'Compétence', 'Expérience', 'Employeur', 'Mission', 'Attestation'],
    exemples: ['Un portfolio de missions avec attestations', 'Le suivi d’une certification professionnelle'],
    vigilance: ['Conservez les preuves (attestations, certificats) au fil de l’eau, pas a posteriori.'],
  },
  {
    code: 'voyage', nom: 'Voyage', couleur: '#f59e0b',
    description: 'Voyageurs, réservations, transports, hébergements, paiements, documents, événements.',
    manifeste: 'Un voyage bien documenté se défend en cas d’imprévu.',
    typesObjets: [{ code: 'dossier', label: 'Dossier voyage' }],
    vocabulaire: ['Voyageur', 'Réservation', 'Transport', 'Hébergement', 'Assurance voyage', 'Incident', 'Remboursement'],
    exemples: ['Un dossier d’annulation de vol et son remboursement', 'Le suivi d’un séjour et de ses réservations'],
    vigilance: ['Versez billets, confirmations et assurances dès leur réception.'],
  },
  {
    code: 'assurance', nom: 'Assurance', couleur: '#dc2626',
    description: 'Objet assuré, contrat, couverture, événement, déclaration, preuves, échanges, indemnisation.',
    manifeste: 'Un sinistre se documente à chaud, pas après coup.',
    typesObjets: [{ code: 'dossier', label: 'Dossier sinistre' }, { code: 'actif', label: 'Bien assuré' }],
    vocabulaire: ['Assuré', 'Assureur', 'Objet assuré', 'Sinistre', 'Déclaration', 'Expertise', 'Indemnisation'],
    exemples: ['La déclaration d’un sinistre avec ses preuves datées', 'Le suivi d’une indemnisation jusqu’à son terme'],
    vigilance: ['Déclarez et documentez un sinistre le plus tôt possible, avec preuves datées.'],
  },
  {
    code: 'financement', nom: 'Financement', couleur: '#7c3aed',
    description: 'Prêts, crédits, investissements, échéanciers, remboursements, garanties, financement participatif.',
    manifeste: 'Un échéancier tenu à jour évite le désaccord.',
    typesObjets: [{ code: 'dossier', label: 'Dossier de financement' }],
    vocabulaire: ['Prêteur', 'Emprunteur', 'Échéancier', 'Remboursement', 'Garantie', 'Investisseur', 'Contrepartie'],
    exemples: ['Un prêt entre particuliers et son échéancier', 'Le suivi d’une levée de fonds participative'],
    vigilance: ['Un échéancier non tenu à jour est la première cause de désaccord sur un prêt.'],
  },
  {
    code: 'finance_marches', nom: 'Finance & marchés', couleur: '#111827',
    description: 'Actions, obligations, ETF, fonds, crypto-actifs, devises, matières premières, portefeuilles, transactions, événements de marché.',
    manifeste: 'Observer un marché n’est jamais le prédire.',
    typesObjets: [{ code: 'portefeuille', label: 'Portefeuille' }, { code: 'actif', label: 'Actif financier' }],
    vocabulaire: ['Portefeuille', 'Actif financier', 'Transaction', 'Observation', 'Signal', 'Hypothèse', 'Scénario', 'Incertitude'],
    exemples: ['Le suivi daté d’un portefeuille et de ses transactions', 'L’historique d’observations sur un actif, sans promesse de gain'],
    vigilance: ['PACTE observe et structure ; il ne recommande, ne garantit ni ne manipule aucune valeur de marché.'],
  },
];

export function universParCode(code: string | null | undefined): UniversDef {
  return UNIVERS.find((u) => u.code === code) || UNIVERS[0];
}

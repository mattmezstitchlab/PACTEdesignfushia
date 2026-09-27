// ============================================================
// PACTE — Catalogue des UNIVERS.
// Un Univers ne fait QUE configurer des libellés, des types d'objets
// suggérés et des points de vigilance : il ne détermine jamais
// l'architecture. Le moteur (Objet → Relation → Engagement → Échéance
// → Événement → Preuve → Alerte → Scénario → Décision) reste unique et
// partagé par tous les univers, y compris ContractOS (le contrat en
// est le cas particulier historique).
// ============================================================

export interface UniversDef {
  code: string;
  nom: string;
  description: string;
  couleur: string;
  typesObjets: { code: string; label: string }[];
  vigilance: string[];
}

export const UNIVERS: UniversDef[] = [
  {
    code: 'personnel', nom: 'Personnel', couleur: '#7c6cf0',
    description: 'Pactes privés, vie familiale, mariage, union, achats communs, engagements entre proches.',
    typesObjets: [{ code: 'dossier', label: 'Dossier personnel' }, { code: 'projet', label: 'Projet familial' }, { code: 'bien', label: 'Bien commun' }],
    vigilance: ['Même entre proches, l’écrit signé change tout en cas de désaccord.'],
  },
  {
    code: 'professionnel', nom: 'Professionnel', couleur: '#0ea5a5',
    description: 'Prestations, freelance, missions, clients, fournisseurs.',
    typesObjets: [{ code: 'mission', label: 'Mission' }, { code: 'projet', label: 'Projet client' }],
    vigilance: ['Le périmètre écrit précisément évite l’essentiel des litiges de mission.'],
  },
  {
    code: 'entreprise', nom: 'Entreprise', couleur: '#2563eb',
    description: 'Associés, collaborateurs, clients, fournisseurs, actifs, décisions, obligations.',
    typesObjets: [{ code: 'dossier', label: 'Dossier société' }, { code: 'actif', label: 'Actif d’entreprise' }, { code: 'projet', label: 'Projet interne' }],
    vigilance: ['Les décisions engageant la société méritent une traçabilité écrite systématique.'],
  },
  {
    code: 'projets', nom: 'Projets', couleur: '#d97706',
    description: 'Création d’entreprise, application, film, album, exposition, chantier, événement, voyage, recherche, campagne, association…',
    typesObjets: [{ code: 'projet', label: 'Projet' }],
    vigilance: ['Un projet sans budget ni échéances tracés dérive plus facilement.'],
  },
  {
    code: 'spectacle', nom: 'Spectacle & intermittence', couleur: '#e2547e',
    description: 'Artistes, techniciens, producteurs, compagnies, représentations, répétitions, engagements, rémunérations, justificatifs.',
    typesObjets: [{ code: 'carriere', label: 'Chronologie professionnelle' }, { code: 'projet', label: 'Production / spectacle' }],
    vigilance: ['Les simulations (cachets, heures, droits) ne sont jamais des droits acquis : voir lib/intermittence.ts.'],
  },
  {
    code: 'art', nom: 'Art', couleur: '#9333ea',
    description: 'Œuvres, artistes, propriétaires, provenance, acquisition, vente, exposition, prêt, restauration, expertise, certificat, assurance, transport, stockage.',
    typesObjets: [{ code: 'oeuvre', label: 'Œuvre' }],
    vigilance: ['PACTE ne garantit jamais une valeur future — seulement des observations datées et sourcées.'],
  },
  {
    code: 'musique', nom: 'Musique', couleur: '#16a34a',
    description: 'Œuvres, auteurs, compositeurs, interprètes, producteurs, masters, éditions, licences, distribution, concerts, royalties.',
    typesObjets: [{ code: 'oeuvre', label: 'Œuvre musicale' }, { code: 'projet', label: 'Projet / tournée' }],
    vigilance: ['Distinguez toujours propriété, droit, licence et cession (voir Propriété intellectuelle).'],
  },
  {
    code: 'audiovisuel', nom: 'Audiovisuel', couleur: '#0891b2',
    description: 'Films, séries, vidéos, scénarios, producteurs, acteurs, techniciens, tournages, droits, financements, diffusion.',
    typesObjets: [{ code: 'projet', label: 'Production audiovisuelle' }, { code: 'oeuvre', label: 'Œuvre' }],
    vigilance: ['Les financements et droits de diffusion doivent être tracés poste par poste.'],
  },
  {
    code: 'propriete_intellectuelle', nom: 'Propriété intellectuelle', couleur: '#475569',
    description: 'Marques, logiciels, photographies, textes, créations, licences, cessions, droits, territoires, durées.',
    typesObjets: [{ code: 'oeuvre', label: 'Création protégée' }],
    vigilance: ['Séparez toujours propriété, droit, licence, cession et utilisation.'],
  },
  {
    code: 'immobilier', nom: 'Immobilier', couleur: '#b45309',
    description: 'Biens, propriétaires, locataires, baux, achats, ventes, travaux, diagnostics, assurances, incidents.',
    typesObjets: [{ code: 'bien', label: 'Bien immobilier' }],
    vigilance: ['L’état des lieux d’entrée est la pièce la plus déterminante.'],
  },
  {
    code: 'biens_actifs', nom: 'Biens & actifs', couleur: '#65a30d',
    description: 'Véhicules, camping-cars, bateaux, instruments, matériel professionnel, machines, équipements.',
    typesObjets: [{ code: 'actif', label: 'Bien / actif' }],
    vigilance: ['Photographiez et datez l’état du bien à chaque étape (achat, prêt, entretien, revente).'],
  },
  {
    code: 'commerce', nom: 'Commerce', couleur: '#c026d3',
    description: 'Commandes, achats, ventes, livraisons, garanties, retours, paiements, remboursements, SAV.',
    typesObjets: [{ code: 'dossier', label: 'Dossier commande / SAV' }],
    vigilance: ['Conservez systématiquement les preuves de commande, paiement et livraison.'],
  },
  {
    code: 'associations', nom: 'Associations', couleur: '#059669',
    description: 'Membres, dirigeants, statuts, décisions, projets, financements, dons, dépenses.',
    typesObjets: [{ code: 'dossier', label: 'Dossier association' }, { code: 'projet', label: 'Projet associatif' }],
    vigilance: ['Les décisions d’assemblée méritent un compte rendu écrit versé au dossier.'],
  },
  {
    code: 'recherche', nom: 'Recherche', couleur: '#4338ca',
    description: 'Hypothèses, expériences, résultats, sources, versions, collaborations, publications.',
    typesObjets: [{ code: 'projet', label: 'Projet de recherche' }],
    vigilance: ['Distinguez toujours donnée observée, hypothèse et résultat validé.'],
  },
  {
    code: 'formation', nom: 'Formation & carrière', couleur: '#0d9488',
    description: 'Diplômes, certifications, compétences, missions, expériences, portfolio, preuves.',
    typesObjets: [{ code: 'carriere', label: 'Parcours professionnel' }],
    vigilance: ['Conservez les preuves (attestations, certificats) au fil de l’eau, pas a posteriori.'],
  },
  {
    code: 'voyage', nom: 'Voyage', couleur: '#f59e0b',
    description: 'Voyageurs, réservations, transports, hébergements, paiements, documents, événements.',
    typesObjets: [{ code: 'dossier', label: 'Dossier voyage' }],
    vigilance: ['Versez billets, confirmations et assurances dès leur réception.'],
  },
  {
    code: 'assurance', nom: 'Assurance', couleur: '#dc2626',
    description: 'Objet assuré, contrat, couverture, événement, déclaration, preuves, échanges, indemnisation.',
    typesObjets: [{ code: 'dossier', label: 'Dossier sinistre' }, { code: 'actif', label: 'Bien assuré' }],
    vigilance: ['Déclarez et documentez un sinistre le plus tôt possible, avec preuves datées.'],
  },
  {
    code: 'financement', nom: 'Financement', couleur: '#7c3aed',
    description: 'Prêts, crédits, investissements, échéanciers, remboursements, garanties, financement participatif.',
    typesObjets: [{ code: 'dossier', label: 'Dossier de financement' }],
    vigilance: ['Un échéancier non tenu à jour est la première cause de désaccord sur un prêt.'],
  },
  {
    code: 'finance_marches', nom: 'Finance & marchés', couleur: '#111827',
    description: 'Actions, obligations, ETF, fonds, crypto-actifs, devises, matières premières, portefeuilles, transactions, événements de marché.',
    typesObjets: [{ code: 'portefeuille', label: 'Portefeuille' }, { code: 'actif', label: 'Actif financier' }],
    vigilance: ['PACTE observe et structure ; il ne recommande, ne garantit ni ne manipule aucune valeur de marché.'],
  },
];

export function universParCode(code: string | null | undefined): UniversDef {
  return UNIVERS.find((u) => u.code === code) || UNIVERS[0];
}

// ============================================================
// PACTE — Bibliothèque de modèles universels.
// Le domaine ne change que les modèles, champs, clauses et règles :
// le même moteur (engagements, échéances, événements, preuves,
// alertes, scénarios) s'applique à tous.
// Chaque modèle : questions guidées, rôles suggérés, clauses types,
// engagements types, échéances types, points de vigilance.
// Les contenus sont des TRAMES INFORMATIVES, pas des conseils
// juridiques : validation professionnelle recommandée.
// ============================================================

export interface ModeleDef {
  code: string;
  nom: string;
  description: string;
  couleur: string;
  questions: { cle: string; question: string; exemple: string }[];
  roles: { role: string; qualite: string }[];
  clauses: { categorie: string; titre: string; contenu: string }[];
  engagements: { titre: string; quand_texte: string; conditions: string; preuve_attendue: string; si_non_rempli: string; priorite: string }[];
  vigilance: string[];
}

function c(categorie: string, titre: string, contenu: string) {
  return { categorie, titre, contenu };
}
function e(titre: string, quand_texte: string, conditions: string, preuve_attendue: string, si_non_rempli: string, priorite = 'normale') {
  return { titre, quand_texte, conditions, preuve_attendue, si_non_rempli, priorite };
}

export const MODELES: ModeleDef[] = [
  {
    code: 'pacte_prive',
    nom: 'Pacte privé',
    description: 'Accord entre proches ou particuliers : prêt, entraide, promesse, arrangement familial ou amical formalisé par écrit.',
    couleur: '#7c6cf0',
    questions: [
      { cle: 'objet', question: 'Que promettez-vous, concrètement ?', exemple: 'Ex. : prêter 2 000 € remboursables en 10 mois' },
      { cle: 'contrepartie', question: 'Y a-t-il une contrepartie ou un remboursement prévu ?', exemple: 'Ex. : remboursement mensuel de 200 €' },
    ],
    roles: [
      { role: 'Créancier / Prêteur', qualite: 'Particulier' },
      { role: 'Débiteur / Bénéficiaire', qualite: 'Particulier' },
    ],
    clauses: [
      c('OBJET', 'Objet du pacte', 'Les parties conviennent de [DÉCRIRE L’OBJET]. Le présent pacte constate leur accord libre et éclairé.'),
      c('OBLIGATIONS', 'Engagement principal', '[PARTIE] s’engage à [DÉCRIRE]. Les modalités (délais, montants, conditions) figurent dans les engagements suivis.'),
      c('PRIX & PAIEMENTS', 'Sommes et remboursements', 'Toute somme versée donne lieu à un reçu écrit. Les remboursements s’effectuent selon l’échéancier suivi dans le contrat.'),
      c('PREUVES', 'Preuve des versements', 'Chaque versement est prouvé par virement identifiable, reçu signé ou tout écrit accepté par les deux parties.'),
      c('MODIFICATION', 'Modification du pacte', 'Aucune modification n’est valable sans l’accord écrit des deux parties (avenant daté et signé).'),
      c('RÉSILIATION', 'Fin anticipée', 'Chaque partie peut proposer de mettre fin au pacte par écrit, avec un préavis raisonnable de [15/30] jours. Les sommes déjà dues restent exigibles.'),
    ],
    engagements: [
      e('Verser la somme convenue', 'À la signature', 'Après signature du pacte par les deux parties', 'Reçu signé ou preuve de virement', 'À convenir : report de date ou annulation du pacte.', 'haute'),
      e('Rembourser selon l’échéancier', 'Chaque mois', 'Montant et jour fixés à l’échéancier', 'Reçu mensuel ou relevé de virement', 'Relance écrite, puis nouvel échéancier convenu par avenant.', 'haute'),
    ],
    vigilance: [
      'Même entre proches, l’écrit signé change tout en cas de désaccord : faites signer les deux parties.',
      'Tracez chaque versement (virement plutôt qu’espèces sans reçu).',
      'Au-delà d’un certain montant, les règles du pays peuvent imposer un écrit : renseignez le pays du contrat.',
    ],
  },
  {
    code: 'mariage',
    nom: 'Mariage & union',
    description: 'Organisation patrimoniale et pratique du couple : conventions, contributions, projets communs. Ne remplace pas les actes notariés.',
    couleur: '#e2547e',
    questions: [
      { cle: 'objet', question: 'Que souhaitez-vous organiser ensemble ?', exemple: 'Ex. : achat commun, contributions aux charges, projet' },
      { cle: 'patrimoine', question: 'Y a-t-il des biens ou comptes communs concernés ?', exemple: 'Ex. : résidence, compte joint, véhicule' },
    ],
    roles: [
      { role: 'Conjoint / Partenaire A', qualite: 'Époux·se / partenaire' },
      { role: 'Conjoint / Partenaire B', qualite: 'Époux·se / partenaire' },
    ],
    clauses: [
      c('OBJET', 'Objet de la convention', 'Les parties organisent [DÉCRIRE : contributions, biens, projets]. La présente convention ne vaut que pour les points qu’elle traite expressément.'),
      c('OBLIGATIONS', 'Contributions', 'Chaque partie contribue [À PARTS ÉGALES / AU PRORATA DES REVENUS / SELON L’ÉCHÉANCIER]. Les contributions sont tracées dans les événements.'),
      c('PRIX & PAIEMENTS', 'Comptes entre parties', 'Un décompte annuel (ou à chaque événement important) est établi et validé par écrit par les deux parties.'),
      c('PREUVES', 'Justificatifs', 'Factures, relevés et reçus relatifs aux biens et charges communs sont conservés dans le dossier.'),
      c('MODIFICATION', 'Révision', 'Toute révision fait l’objet d’un avenant écrit signé des deux parties.'),
      c('DIVERS', 'Actes solennels', 'Les parties reconnaissent que certains actes (régime matrimonial, donation, testament, acquisition immobilière) relèvent d’un notaire et ne peuvent être remplacés par la présente convention.'),
    ],
    engagements: [
      e('Contribuer aux charges communes', 'Chaque mois', 'Selon la clé de répartition convenue', 'Relevés / décompte validé', 'Régularisation au décompte suivant.', 'normale'),
      e('Établir le décompte annuel', 'Chaque année', 'Sur pièces justificatives', 'Décompte signé des deux parties', 'Report avec accord écrit.', 'normale'),
    ],
    vigilance: [
      'Le régime matrimonial et les donations relèvent du notaire : cette convention organise le quotidien, elle ne les remplace pas.',
      'En cas de séparation, seuls les écrits et décomptes validés feront foi : tenez-les à jour.',
    ],
  },
  {
    code: 'freelance',
    nom: 'Freelance / prestation',
    description: 'Mission indépendante : périmètre, livrables, délais, prix, révisions, propriété intellectuelle.',
    couleur: '#0ea5a5',
    questions: [
      { cle: 'objet', question: 'Quelle mission doit être réalisée ?', exemple: 'Ex. : créer un site vitrine de 5 pages' },
      { cle: 'prix', question: 'Quel prix et quelles modalités de paiement ?', exemple: 'Ex. : 3 000 € — 30 % à la commande, solde à livraison' },
    ],
    roles: [
      { role: 'Client', qualite: 'Donneur d’ordre' },
      { role: 'Prestataire', qualite: 'Indépendant / freelance' },
    ],
    clauses: [
      c('OBJET', 'Objet de la mission', 'Le prestataire réalise [DÉCRIRE LA MISSION ET LES LIVRABLES ATTENDUS]. Tout travail hors périmètre fait l’objet d’un devis complémentaire.'),
      c('LIVRABLES', 'Livrables et délais', 'Les livrables et leurs dates figurent dans les engagements et échéances suivis. Chaque livraison donne lieu à un accusé de réception.'),
      c('VALIDATIONS', 'Validation et révisions', 'Le client dispose de [7/15] jours pour valider ou demander des corrections. [1/2] cycle(s) de révisions inclus ; au-delà, facturation complémentaire.'),
      c('PRIX & PAIEMENTS', 'Prix et paiement', 'Prix : [MONTANT]. Acompte de [30] % à la commande, solde à la validation finale. Retard de paiement : relance écrite puis suspension possible de la mission.'),
      c('DROITS', 'Propriété intellectuelle', 'Les droits sur les livrables sont transférés au client après paiement intégral, dans la limite de [PRÉCISER : usages, durée, territoire]. Le prestataire peut présenter la réalisation en portfolio sauf opposition écrite.'),
      c('ANNULATION', 'Annulation', 'En cas d’annulation par le client, les travaux réalisés restent dus et l’acompte reste acquis. En cas d’annulation par le prestataire, l’acompte est restitué.'),
      c('RÉSILIATION', 'Résiliation', 'Chaque partie peut résilier par écrit avec un préavis de [15] jours. Les travaux réalisés et validés sont payés au prorata.'),
    ],
    engagements: [
      e('Verser l’acompte de commande', 'À la signature', 'Devis accepté et signé', 'Facture d’acompte + preuve de virement', 'La mission démarre à réception de l’acompte.', 'haute'),
      e('Livrer les livrables convenus', 'Selon le planning', 'Périmètre du devis, brief complet fourni par le client', 'Accusé de réception / lien de livraison daté', 'Nouveau délai convenu par écrit ; pénalités uniquement si prévues.', 'haute'),
      e('Valider ou demander des corrections', 'Sous 15 jours après livraison', 'Dans la limite des cycles inclus', 'Validation écrite (courriel accepté)', 'Sans réponse, relance écrite puis validation réputée acquise si la clause le prévoit.', 'normale'),
      e('Régler le solde', 'À la validation finale', 'Après validation écrite', 'Facture de solde + reçu', 'Relance écrite, intérêts uniquement si prévus au contrat ou par la loi applicable.', 'haute'),
    ],
    vigilance: [
      'Écrivez le périmètre avec précision : 80 % des litiges freelance naissent d’un périmètre flou.',
      'Ne transférez les fichiers sources / droits qu’après paiement du solde, sauf clause contraire.',
      'Vérifiez le statut (auto-entrepreneur, société) et les mentions obligatoires des factures du pays.',
    ],
  },
  {
    code: 'commercial',
    nom: 'Contrat commercial',
    description: 'Relation d’affaires : fourniture, distribution, sous-traitance, partenariat commercial, CGV/CGA associées.',
    couleur: '#2563eb',
    questions: [
      { cle: 'objet', question: 'Quelle relation commerciale encadrez-vous ?', exemple: 'Ex. : fourniture mensuelle de marchandises' },
      { cle: 'volume', question: 'Volumes, prix et durée envisagés ?', exemple: 'Ex. : 12 mois, commande min. 500 unités/mois' },
    ],
    roles: [
      { role: 'Fournisseur', qualite: 'Professionnel' },
      { role: 'Client professionnel', qualite: 'Professionnel' },
    ],
    clauses: [
      c('OBJET', 'Objet', 'Le fournisseur [FOURNIT / DISTRIBUE / SOUS-TRAITE] [DÉCRIRE] au profit du client, à titre professionnel.'),
      c('OBLIGATIONS', 'Commandes et exécution', 'Les commandes sont passées par écrit. Toute commande acceptée devient un engagement suivi (quantités, délais, prix).'),
      c('LIVRABLES', 'Livraison et conformité', 'Livraison [DÉLAI / INCOTERM LE CAS ÉCHÉANT]. Réserves écrites sous [48h / 7 jours] après réception.'),
      c('PRIX & PAIEMENTS', 'Prix et règlement', 'Prix : [GRILLE / DEVIS]. Paiement à [30/45/60] jours. Tout retard peut donner lieu aux pénalités et indemnités prévues par le droit applicable.'),
      c('RESPONSABILITÉS', 'Responsabilités et garanties', 'Chaque partie garantit [CONFORMITÉ / VICES / DÉLAIS]. Plafond de responsabilité éventuel : [MONTANT]. Assurance professionnelle : [RÉFÉRENCE].'),
      c('DIVERS', 'Confidentialité', 'Les informations échangées dans le cadre du contrat restent confidentielles pendant [DURÉE].'),
      c('MODIFICATION', 'Évolution tarifaire', 'Toute évolution tarifaire est notifiée par écrit [30/60] jours à l’avance et s’applique aux commandes postérieures.'),
      c('RÉSILIATION', 'Durée et résiliation', 'Durée : [12 MOIS], [RENOUVELABLE / NON]. Résiliation par écrit avec préavis de [1/3] mois. Indemnités : [SELON CLAUSE].'),
    ],
    engagements: [
      e('Passer les commandes par écrit', 'Selon le planning', 'Quantités et références précises', 'Bons de commande acceptés', 'Aucune commande verbale non confirmée.', 'normale'),
      e('Livrer conformément aux commandes', 'Délais acceptés', 'Quantité, qualité, conditionnement', 'Bons de livraison signés', 'Avoir, remplacement ou indemnité selon la clause.', 'haute'),
      e('Régler les factures à échéance', 'Selon les délais convenus', 'Factures conformes aux commandes', 'Reçus / relevés', 'Relance écrite puis pénalités si prévues.', 'haute'),
    ],
    vigilance: [
      'Joignez les CGV/CGA applicables et faites-les accepter par écrit.',
      'Les délais de paiement entre professionnels sont souvent encadrés par la loi du pays : renseignez le droit applicable.',
      'Une rupture brutale de relations établies peut engager la responsabilité : respectez un préavis suffisant.',
    ],
  },
  {
    code: 'location',
    nom: 'Location',
    description: 'Bail d’habitation, commercial ou location de matériel : loyers, charges, dépôt, état des lieux, entretien.',
    couleur: '#d97706',
    questions: [
      { cle: 'objet', question: 'Que louez-vous ?', exemple: 'Ex. : appartement T2 meublé, local commercial, matériel' },
      { cle: 'loyer', question: 'Loyer, charges et dépôt de garantie ?', exemple: 'Ex. : 850 € + 90 € charges, dépôt 850 €' },
    ],
    roles: [
      { role: 'Bailleur', qualite: 'Propriétaire' },
      { role: 'Locataire', qualite: 'Preneur' },
    ],
    clauses: [
      c('OBJET', 'Bien loué', 'Le bailleur loue [DÉCRIRE LE BIEN, ADRESSE, ÉQUIPEMENTS]. Usage autorisé : [HABITATION / COMMERCE / PRÉCISER].'),
      c('ÉCHÉANCES', 'Durée', 'Durée : [PRÉCISER]. Prise d’effet : [DATE]. Conditions de renouvellement / congé : [PRÉCISER].'),
      c('PRIX & PAIEMENTS', 'Loyer et charges', 'Loyer : [MONTANT] payable [LE 1ER / LE 5] de chaque mois. Charges : [FORFAIT / PROVISION + RÉGULARISATION]. Dépôt de garantie : [MONTANT].'),
      c('OBLIGATIONS', 'État des lieux', 'Un état des lieux contradictoire d’entrée et de sortie, daté, signé et photographié, est versé aux preuves.'),
      c('OBLIGATIONS', 'Entretien et réparations', 'Entretien courant : locataire. Grosses réparations : bailleur, sauf dégradations imputables au locataire.'),
      c('VALIDATIONS', 'Révision du loyer', 'Révision [ANNUELLE / NON] selon [INDICE, LE CAS ÉCHÉANT]. Toute révision est notifiée par écrit.'),
      c('RÉSILIATION', 'Congé et fin de bail', 'Congé donné par écrit avec préavis de [PRÉCISER]. Restitution du dépôt sous [PRÉCISER] après sortie, déduction faite des sommes justifiées.'),
    ],
    engagements: [
      e('Établir l’état des lieux d’entrée', 'À la remise des clés', 'Contradictoire, daté, signé, photographié', 'État des lieux signé + photos datées', 'Sans état des lieux, la preuve de l’état initial sera difficile.', 'critique'),
      e('Payer le loyer mensuel', 'Chaque mois', 'Montant et date fixés au bail', 'Quittances de loyer', 'Relance écrite ; régularisation des charges annuelle.', 'haute'),
      e('Restituer le dépôt de garantie', 'Après la sortie', 'Déduction faite des sommes justifiées par pièces', 'Décompte de sortie + preuve de restitution', 'Contestation possible : conservez toutes les pièces.', 'normale'),
    ],
    vigilance: [
      'L’état des lieux d’entrée est LA pièce maîtresse : ne le négligez jamais.',
      'Le droit locatif varie fortement selon les pays (durée, préavis, dépôt) : renseignez le pays et faites relire le bail en cas de doute.',
      'Remettez systématiquement des quittances de loyer.',
    ],
  },
  {
    code: 'partenariat',
    nom: 'Partenariat / association',
    description: 'Alliance, joint-venture simplifiée, partenariat associatif : apports, gouvernance, partage des résultats, sortie.',
    couleur: '#16a34a',
    questions: [
      { cle: 'objet', question: 'Quel projet menez-vous ensemble ?', exemple: 'Ex. : organiser un festival, co-développer un produit' },
      { cle: 'apports', question: 'Qui apporte quoi (argent, travail, matériel, réseau) ?', exemple: 'Ex. : A apporte 5 000 €, B apporte le local' },
    ],
    roles: [
      { role: 'Partenaire A', qualite: 'Associé / partenaire' },
      { role: 'Partenaire B', qualite: 'Associé / partenaire' },
    ],
    clauses: [
      c('OBJET', 'Projet commun', 'Les partenaires s’associent pour [DÉCRIRE LE PROJET, SA DURÉE, SON TERRITOIRE].'),
      c('OBLIGATIONS', 'Apports', 'Apports initiaux : [DÉTAILLER QUI APPORTE QUOI, VALORISATION]. Tout apport complémentaire fait l’objet d’un écrit.'),
      c('DROITS', 'Gouvernance', 'Décisions [À L’UNANIMITÉ / À LA MAJORITÉ]. Réunions : [FRÉQUENCE]. Comptes rendus écrits versés au dossier.'),
      c('PRIX & PAIEMENTS', 'Résultats et comptes', 'Les résultats sont partagés [CLÉ DE RÉPARTITION]. Comptes arrêtés [FRÉQUENCE] et validés par écrit.'),
      c('DIVERS', 'Non-concurrence / confidentialité', 'Pendant [DURÉE], les partenaires [S’INTERDISENT / S’AUTORISENT] [PRÉCISER]. Informations du projet : confidentielles.'),
      c('RÉSILIATION', 'Sortie et fin', 'Sortie possible avec préavis de [PRÉCISER]. Valorisation des apports et partage : [MÉTHODE]. Fin du projet : décompte final validé par tous.'),
    ],
    engagements: [
      e('Réaliser les apports initiaux', 'Au démarrage', 'Conformément à la liste des apports', 'Reçus / inventaire signé', 'Révision de la clé de répartition par avenant.', 'haute'),
      e('Tenir les réunions de suivi', 'Selon la fréquence convenue', 'Ordre du jour et compte rendu', 'Comptes rendus signés', 'Relance écrite ; décisions prises sans quorum fragilisées.', 'normale'),
      e('Arrêter et valider les comptes', 'À chaque période', 'Sur pièces', 'Décompte validé par tous', 'Report avec accord écrit.', 'haute'),
    ],
    vigilance: [
      'Écrivez la sortie AVANT d’en avoir besoin : c’est la clause la plus sous-estimée.',
      'Valorisez les apports en nature dès le départ (temps, matériel, réseau).',
      'Si vous créez une structure (association, société), ses statuts priment : joignez-les au dossier.',
    ],
  },
  {
    code: 'vente',
    nom: 'Vente',
    description: 'Vente de bien ou d’actif : prix, acompte, transfert, garanties, réserve de propriété, SAV.',
    couleur: '#9333ea',
    questions: [
      { cle: 'objet', question: 'Que vendez-vous ?', exemple: 'Ex. : véhicule d’occasion, fonds de commerce, matériel' },
      { cle: 'prix', question: 'Prix, acompte et modalités de transfert ?', exemple: 'Ex. : 12 000 €, acompte 2 000 €, remise après solde' },
    ],
    roles: [
      { role: 'Vendeur', qualite: 'Cédant' },
      { role: 'Acheteur', qualite: 'Acquéreur' },
    ],
    clauses: [
      c('OBJET', 'Bien vendu', 'Le vendeur cède [DÉCRIRE PRÉCISÉMENT : ÉTAT, RÉFÉRENCES, ACCESSOIRES]. L’acheteur reconnaît avoir examiné le bien.'),
      c('PRIX & PAIEMENTS', 'Prix et paiement', 'Prix : [MONTANT]. Acompte : [MONTANT] à la signature. Solde : [À LA REMISE / À DATE]. Moyens de paiement acceptés : [PRÉCISER].'),
      c('LIVRABLES', 'Remise et transfert', 'Remise du bien [À LA SIGNATURE / APRÈS PAIEMENT DU SOLDE]. Transfert de propriété et des risques : [PRÉCISER, réserve de propriété éventuelle].'),
      c('RESPONSABILITÉS', 'Garanties', 'Garanties : [LÉGALES / CONVENTIONNELLES / EXCLUSION DANS LA LIMITE DE LA LOI]. Vices apparents signalés : [LISTER].'),
      c('ANNULATION', 'Rétractation / annulation', 'Conditions d’annulation avant remise : [PRÉCISER]. Sort de l’acompte : [ACQUIS / RESTITUÉ].'),
      c('PREUVES', 'Acte de cession', 'Un acte / certificat de cession daté et signé est établi et versé aux preuves, avec les pièces du bien.'),
    ],
    engagements: [
      e('Verser l’acompte', 'À la signature', 'Montant convenu', 'Reçu d’acompte', 'La réservation tombe sans acompte.', 'haute'),
      e('Remettre le bien et ses pièces', 'À la date convenue', 'Après paiement du solde (sauf clause contraire)', 'Acte de cession signé + inventaire', 'Report convenu par écrit.', 'haute'),
      e('Régler le solde du prix', 'À la remise', 'Montant restant dû', 'Reçu de solde', 'Réserve de propriété / résolution selon la clause.', 'haute'),
    ],
    vigilance: [
      'Décrivez l’état réel du bien avec photos datées : c’est votre meilleure protection.',
      'Pour les montants importants ou les véhicules/fonds, vérifiez les formalités du pays (immatriculation, enregistrement).',
      'Distinguez acompte et arrhes : leurs effets en cas d’annulation diffèrent selon le droit applicable.',
    ],
  },
  {
    code: 'prestation_pro',
    nom: 'Prestation professionnelle',
    description: 'Contrat de service entre professionnels : SLA, pénalités, confidentialité, sous-traitance, audit.',
    couleur: '#0891b2',
    questions: [
      { cle: 'objet', question: 'Quel service professionnel est fourni ?', exemple: 'Ex. : maintenance informatique, gardiennage, comptabilité' },
      { cle: 'niveau', question: 'Niveaux de service et durée ?', exemple: 'Ex. : intervention sous 24h, contrat 12 mois' },
    ],
    roles: [
      { role: 'Client professionnel', qualite: 'Donneur d’ordre' },
      { role: 'Prestataire', qualite: 'Société de services' },
    ],
    clauses: [
      c('OBJET', 'Services', 'Le prestataire fournit [DÉCRIRE LES SERVICES, PÉRIMÈTRE, EXCLUSIONS].'),
      c('OBLIGATIONS', 'Niveaux de service', 'Niveaux convenus : [DÉLAIS, DISPONIBILITÉ, INDICATEURS]. Mesure : [MÉTHODE, REPORTING].'),
      c('PRIX & PAIEMENTS', 'Rémunération', 'Rémunération : [FORFAIT / RÉGIE, MONTANT, PÉRIODICITÉ]. Révision : [INDICE / ANNUELLE].'),
      c('RESPONSABILITÉS', 'Pénalités et responsabilités', 'Pénalités de non-respect des niveaux : [MONTANT / PLAFOND]. Plafond global de responsabilité : [MONTANT]. Assurance : [RÉFÉRENCE].'),
      c('DIVERS', 'Sous-traitance et confidentialité', 'Sous-traitance [AUTORISÉE / SOUMISE À ACCORD]. Confidentialité pendant [DURÉE]. Données : [HÉBERGEMENT, RESTITUTION].'),
      c('RÉSILIATION', 'Durée, renouvellement, sortie', 'Durée : [PRÉCISER]. Préavis : [PRÉCISER]. Réversibilité / transfert : [PRÉCISER, DÉLAI, COÛT].'),
    ],
    engagements: [
      e('Fournir les services convenus', 'En continu', 'Niveaux de service contractuels', 'Reportings / tickets / PV', 'Pénalités selon la clause ; mise en demeure en cas de manquement grave.', 'haute'),
      e('Produire le reporting périodique', 'Chaque mois', 'Indicateurs convenus', 'Rapports datés versés au dossier', 'Relance écrite.', 'normale'),
      e('Régler les factures', 'À échéance', 'Services attestés', 'Factures + reçus', 'Suspension possible après mise en demeure si la clause le prévoit.', 'haute'),
    ],
    vigilance: [
      'Définissez des indicateurs MESURABLES : un SLA flou est inapplicable.',
      'Prévoyez la sortie (réversibilité, restitution des données) dès la signature.',
      'Vérifiez les assurances et les plafonds de responsabilité des deux côtés.',
    ],
  },
  {
    code: 'universel',
    nom: 'Accord universel',
    description: 'Trame vierge adaptable à tout autre accord : le moteur universel s’applique, vous définissez les clauses.',
    couleur: '#475569',
    questions: [
      { cle: 'objet', question: 'Quel est l’objet de votre accord ?', exemple: 'Ex. : décrivez librement ce que chacun s’engage à faire' },
    ],
    roles: [
      { role: 'Partie A', qualite: 'À préciser' },
      { role: 'Partie B', qualite: 'À préciser' },
    ],
    clauses: [
      c('OBJET', 'Objet de l’accord', 'Les parties conviennent de [DÉCRIRE].'),
      c('OBLIGATIONS', 'Engagements réciproques', 'Chaque partie exécute les engagements listés et suivis dans le présent dossier, de bonne foi.'),
      c('PREUVES', 'Écrits et preuves', 'Les échanges importants font l’objet d’écrits versés au dossier. Chaque réalisation est prouvée.'),
      c('MODIFICATION', 'Modification', 'Aucune modification sans accord écrit de toutes les parties.'),
      c('RÉSILIATION', 'Fin de l’accord', 'Fin [À DATE / À RÉALISATION / PAR ÉCRIT AVEC PRÉAVIS DE ___]. Les engagements déjà nés restent dus.'),
    ],
    engagements: [
      e('Exécuter les engagements convenus', 'Selon les délais fixés', 'De bonne foi, conformément aux clauses', 'Preuves versées au dossier', 'À convenir par écrit.', 'normale'),
    ],
    vigilance: [
      'Plus l’accord est atypique, plus l’écrit précis compte : détaillez chaque engagement (qui, quoi, quand, preuve).',
      'Renseignez le pays et le droit applicable pour contextualiser le suivi.',
    ],
  },
];

export function modeleParCode(code: string | null | undefined): ModeleDef {
  return MODELES.find((m) => m.code === code) || MODELES[MODELES.length - 1];
}

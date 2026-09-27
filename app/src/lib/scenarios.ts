// ============================================================
// PACTE — MOTEUR DE SCÉNARIOS + ANTICIPATION
// SI événement X → vérifier condition Y → identifier engagements
// concernés → afficher clauses correspondantes → afficher preuves →
// présenter les actions possibles.
// Le moteur ne prédit JAMAIS une décision judiciaire : il expose des
// faits, des clauses, des preuves et des pistes d'action à valider
// avec un professionnel lorsque l'enjeu le justifie.
// ============================================================
import type {
  Clause, Echeance, Engagement, EvaluationScenario, Evenement,
  Preuve, Scenario,
} from './types';
import { joursRestants } from './format';
import type { Anticipation } from './types';

export interface ContexteScenario {
  engagements: Engagement[];
  echeances: Echeance[];
  evenements: Evenement[];
  clauses: Clause[];
  preuves: Preuve[];
  droitApplicable: string | null;
}

const AVERTISSEMENT_UNIVERSEL =
  'Analyse indicative fournie par PACTE à partir des données saisies. ' +
  'Elle ne constitue ni un avis juridique, ni une prédiction de décision judiciaire. ' +
  'En cas de litige, de montant significatif ou de doute, faites valider la situation par un avocat, un notaire ou un autre professionnel du droit.';

export function motsCles(texte: string | null | undefined): string[] {
  if (!texte) return [];
  return texte
    .toLowerCase()
    .split(/[^a-zàâäéèêëîïôöùûüç0-9]+/i)
    .filter((w) => w.length > 3)
    .filter((w, i, a) => a.indexOf(w) === i);
}

function scorePertinence(clause: Clause, cles: string[]): number {
  const hay = `${clause.titre || ''} ${clause.contenu || ''} ${clause.categorie || ''}`.toLowerCase();
  let s = 0;
  for (const c of cles) if (hay.includes(c)) s += c.length > 6 ? 2 : 1;
  return s;
}

export function evaluerScenario(s: Scenario, ctx: ContexteScenario): EvaluationScenario {
  const cles = [
    ...motsCles(s.declencheur),
    ...motsCles(s.clauses_mots_cles),
    ...motsCles(s.condition_verif),
  ];

  // 1. Événements déclencheurs : même type OU texte proche
  const evenements_declencheurs = ctx.evenements.filter((ev) => {
    if (s.declencheur_type && ev.type === s.declencheur_type) return true;
    const hay = `${ev.titre || ''} ${ev.description || ''}`.toLowerCase();
    return cles.length > 0 && cles.filter((c) => hay.includes(c)).length >= 2;
  }).slice(0, 10);

  // 2. Engagements concernés : ciblés explicitement OU liés aux événements OU proches par mots-clés
  const idsCibles = new Set(s.engagements_cibles || []);
  const idsViaEvenements = new Set<number>();
  for (const ev of evenements_declencheurs) for (const id of ev.engagement_ids || []) idsViaEvenements.add(id);
  const engagements_concernes = ctx.engagements.filter((g) => {
    if (idsCibles.has(g.id) || idsViaEvenements.has(g.id)) return true;
    const hay = `${g.titre} ${g.description || ''} ${g.conditions || ''} ${g.si_non_rempli || ''}`.toLowerCase();
    return cles.length > 0 && cles.filter((c) => hay.includes(c)).length >= 2;
  }).slice(0, 12);

  // 3. Échéances concernées : liées aux engagements concernés ou proches par mots-clés
  const idsEng = new Set(engagements_concernes.map((g) => g.id));
  const echeances_concernees = ctx.echeances.filter((e) => {
    if (e.engagement_id && idsEng.has(e.engagement_id)) return true;
    const hay = `${e.titre || ''} ${e.notes || ''}`.toLowerCase();
    return cles.length > 0 && cles.filter((c) => hay.includes(c)).length >= 2;
  }).slice(0, 12);

  // 4. Clauses correspondantes : score de pertinence
  const clauses_correspondantes = ctx.clauses
    .map((c) => ({ c, s: scorePertinence(c, cles) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 8)
    .map((x) => x.c);

  // 5. Preuves liées : rattachées aux engagements/événements concernés
  const idsEv = new Set(evenements_declencheurs.map((e) => e.id));
  const preuves_liees = ctx.preuves.filter((p) =>
    (p.engagement_id && idsEng.has(p.engagement_id)) ||
    (p.evenement_id && idsEv.has(p.evenement_id)),
  ).slice(0, 12);

  // 6. Actions possibles : celles du scénario + déductions prudentes
  const actions_possibles: string[] = [];
  if (s.actions_suggerees) {
    for (const ligne of s.actions_suggerees.split('\n')) {
      const t = ligne.replace(/^[-•\d.)\s]+/, '').trim();
      if (t) actions_possibles.push(t);
    }
  }
  if (clauses_correspondantes.length === 0) {
    actions_possibles.push('Vérifier si le contrat prévoit expressément cette situation ; à défaut, toute interprétation reste incertaine.');
  }
  if (preuves_liees.length === 0) {
    actions_possibles.push('Rassembler et verser les preuves disponibles (écrits, reçus, messages, photos datées).');
  }
  actions_possibles.push(
    'Échanger par écrit avec l’autre partie (courriel ou courrier) pour tracer les positions de chacun.',
    'Si aucun accord amiable n’émerge ou si l’enjeu est significatif, consulter un professionnel du droit avant toute décision irréversible.',
  );

  // 7. Niveau de confiance (sur la complétude du dossier, jamais sur l'issue juridique)
  const points =
    (evenements_declencheurs.length > 0 ? 1 : 0) +
    (engagements_concernes.length > 0 ? 1 : 0) +
    (clauses_correspondantes.length > 0 ? 1 : 0) +
    (preuves_liees.length > 0 ? 1 : 0);
  const niveau_confiance =
    points >= 4 ? 'Dossier documenté — situation rattachée à des faits, clauses et preuves.' :
    points === 3 ? 'Partiellement documenté — il manque un élément (faits, clauses ou preuves).' :
    points === 2 ? 'Peu documenté — complétez les faits et rattachez les clauses applicables.' :
    'Insuffisamment documenté — l’analyse reste indicative, fiabilisez d’abord les données.';

  return {
    scenario: s,
    evenements_declencheurs,
    echeances_concernees,
    engagements_concernes,
    clauses_correspondantes,
    preuves_liees,
    actions_possibles,
    niveau_confiance,
    avertissement: s.note_prudence
      ? `${AVERTISSEMENT_UNIVERSEL} Note du scénario : ${s.note_prudence}`
      : AVERTISSEMENT_UNIVERSEL,
  };
}

// ---- Scénarios prêts à l'emploi (universels, adaptables par contrat) ----
export function scenariosParDefaut(contratId: number | null): Omit<Scenario, 'id' | 'created_at'>[] {
  const base = (
    nom: string, declencheur: string, declencheur_type: string | null,
    condition_verif: string, clauses_mots_cles: string, actions_suggerees: string, note_prudence: string,
  ): Omit<Scenario, 'id' | 'created_at'> => ({
    contrat_id: contratId,
    nom, declencheur, declencheur_type, condition_verif,
    engagements_cibles: null, clauses_mots_cles, actions_suggerees,
    note_prudence, actif: true,
  });
  return [
    base(
      'Retard de paiement',
      'Un paiement attendu n’a pas été reçu à la date prévue.',
      'retard',
      'Vérifier : la date limite contractuelle, les montants déjà versés (reçus), l’existence d’un délai de grâce ou d’une clause de pénalité.',
      'paiement prix échéance pénalité retard intérêts mise en demeure facture',
      '- Relire le montant, la date limite et les modalités de paiement prévues.\n- Adresser une relance écrite amiable en rappelant la clause.\n- Si le retard persiste, mettre en demeure par écrit avant toute autre mesure.',
      'Les pénalités et la résolution pour impayé dépendent des clauses et du droit applicable : ne présumez d’aucun automatisme.',
    ),
    base(
      'Livraison non conforme ou en retard',
      'Un livrable est en retard, incomplet ou non conforme à ce qui était attendu.',
      'livraison',
      'Vérifier : la description du livrable, les critères de conformité, les délais, les réserves émises à la réception.',
      'livraison livrable conformité réception réserve délai qualité validation',
      '- Documenter précisément l’écart constaté (photos, descriptif daté).\n- Émettre des réserves écrites sans tarder.\n- Demander la reprise, le remplacement ou un avoir selon les clauses.',
      'La réception sans réserve peut fragiliser une réclamation ultérieure : formalisez vite les constats.',
    ),
    base(
      'Demande de modification ou avenant',
      'Une partie demande de modifier le contenu, les délais ou le prix du contrat.',
      'modification',
      'Vérifier : ce que prévoit la clause de modification, l’impact sur les autres engagements, l’accord écrit de toutes les parties.',
      'modification avenant accord écrit prix délai résiliation',
      '- Évaluer l’impact sur les engagements, échéances et prix.\n- Rédiger un avenant daté reprenant les points modifiés.\n- Le faire signer par toutes les parties avant application.',
      'Tant qu’une modification n’est pas acceptée par écrit, le contrat initial continue en principe de s’appliquer.',
    ),
    base(
      'Force majeure déclarée',
      'Une partie déclare ne plus pouvoir exécuter en raison d’un événement extérieur.',
      'force_majeure',
      'Vérifier : la clause d’événements exceptionnels, la réalité de l’empêchement (preuves), son caractère extérieur, imprévisible et irrésistible selon le droit applicable.',
      'force majeure imprévision impossibilité suspension résiliation exceptionnel',
      '- Exiger une notification écrite décrivant l’événement et ses effets.\n- Suspendre prudemment les délais concernés et préserver les preuves.\n- Consulter rapidement un professionnel du droit.',
      'PACTE ne tranche jamais si une force majeure est juridiquement constituée : c’est une question d’appréciation au cas par cas.',
    ),
    base(
      'Résiliation envisagée',
      'Une partie envisage de mettre fin au contrat avant son terme.',
      'annulation',
      'Vérifier : les cas de résiliation prévus, le préavis, la forme exigée (écrit, recommandé), les conséquences financières.',
      'résiliation rupture préavis indemnité restitution fin anticipée',
      '- Relire la clause de résiliation (motifs, préavis, forme).\n- Notifier par écrit en respectant scrupuleusement la forme prévue.\n- Arrêter les comptes (sommes dues, restitutions) et les tracer.',
      'Une résiliation irrégulière peut elle-même engager la responsabilité de son auteur : faites valider la procédure.',
    ),
    base(
      'Désaccord sur l’interprétation',
      'Les parties ne s’accordent pas sur le sens d’une clause ou d’un engagement.',
      'communication',
      'Vérifier : le texte exact de la clause, les échanges antérieurs, les usages entre les parties, les versions successives du document.',
      'interprétation objet obligation condition engagement contestation litige',
      '- Relire ensemble le texte exact et l’historique des versions.\n- Rechercher un accord amiable écrit (avenant interprétatif).\n- En cas de blocage, recourir à la médiation ou à un avis professionnel.',
      'En cas d’ambiguïté persistante, seul un juge pourrait trancher : privilégiez toujours l’écrit et l’accord amiable.',
    ),
  ];
}

// ============================================================
// ANTICIPATION — détecter les événements prévisibles à partir
// des échéances, de la fin du contrat, des habitudes observées
// (retards répétés) et des jalons manquants.
// ============================================================
export interface ContexteAnticipation {
  dateFinContrat: string | null;
  statutContrat: string;
  echeances: Echeance[];
  evenements: Evenement[];
  engagements: Engagement[];
}

export function anticiper(c: ContexteAnticipation): Anticipation[] {
  const out: Anticipation[] = [];

  // 1. Échéances à venir (30/60/90 jours)
  for (const e of c.echeances) {
    if (!e.date_limite || e.statut === 'realisee' || e.statut === 'annulee') continue;
    const j = joursRestants(e.date_limite);
    if (j === null || j < 0 || j > 90) continue;
    out.push({
      horizon_jours: j,
      titre: `« ${e.titre || 'Échéance'} » ${j === 0 ? "aujourd'hui" : `dans ${j} jour(s)`}`,
      description: e.type === 'paiement'
        ? `Un paiement de ${e.montant ?? '?'} ${e.devise || ''} arrive à échéance. Les retards de paiement sont l'une des causes les plus fréquentes de tension contractuelle.`
        : `Cette échéance (${e.type || 'jalon'}) devra être réalisée et prouvée. Préparez dès maintenant les pièces nécessaires.`,
      source: 'Échéance enregistrée au contrat',
      preparation: e.type === 'paiement'
        ? 'Émettre la facture, vérifier les coordonnées de paiement, prévoir une relance écrite en cas de retard.'
        : 'Planifier la réalisation, désigner le responsable, définir la preuve attendue.',
    });
  }

  // 2. Fin du contrat / renouvellement
  if (c.dateFinContrat && (c.statutContrat === 'actif' || c.statutContrat === 'brouillon')) {
    const j = joursRestants(c.dateFinContrat);
    if (j !== null && j >= 0 && j <= 120) {
      out.push({
        horizon_jours: j,
        titre: `Fin du contrat ${j === 0 ? "aujourd'hui" : `dans ${j} jour(s)`}`,
        description: `L'échéance du contrat approche. Selon les clauses (tacite reconduction, préavis de non-renouvellement, restitutions), des démarches peuvent être requises AVANT cette date.`,
        source: 'Date de fin du contrat',
        preparation: 'Relire les clauses de durée, renouvellement et résiliation ; notifier à temps le non-renouvellement si souhaité ; planifier les restitutions et l’arrêt des comptes.',
      });
    }
    if (j !== null && j < 0 && c.statutContrat === 'actif') {
      out.push({
        horizon_jours: 0,
        titre: `Contrat arrivé à terme mais toujours « actif »`,
        description: `La date de fin est dépassée. Le contrat continue-t-il (tacite reconduction ?), faut-il le clôturer ou le renouveler par avenant ? Cette situation doit être clarifiée par écrit.`,
        source: 'Date de fin dépassée',
        preparation: 'Clarifier par écrit : clôture, renouvellement ou avenant de prolongation.',
      });
    }
  }

  // 3. Retards répétés → risque de récidive
  const nbRetards = c.evenements.filter((e) => e.type === 'retard').length;
  if (nbRetards >= 2) {
    out.push({
      horizon_jours: 14,
      titre: `Risque de nouveau retard (historique : ${nbRetards} retards)`,
      description: `Plusieurs retards ont déjà été enregistrés. L'expérience montre qu'un retard répété mérite un suivi renforcé : relances écrites systématiques et preuves datées.`,
      source: 'Historique des événements',
      preparation: 'Mettre en place des relances écrites avant chaque échéance ; envisager un avenant (échéancier, garanties) si la situation se dégrade.',
    });
  }

  // 4. Engagements sans échéance → risque d'oubli
  const sansDelai = c.engagements.filter((g) => g.statut !== 'realise' && g.statut !== 'annule' && !g.date_echeance && !g.quand_texte);
  if (sansDelai.length > 0) {
    out.push({
      horizon_jours: 30,
      titre: `${sansDelai.length} engagement(s) sans horizon temporel`,
      description: `Les engagements sans délai sont statistiquement les plus exposés à l'oubli et aux désaccords (« je pensais que c'était pour plus tard »).`,
      source: 'Engagements sans date',
      preparation: 'Convenir par écrit d’un délai pour chaque engagement concerné.',
    });
  }

  return out.sort((a, b) => a.horizon_jours - b.horizon_jours).slice(0, 12);
}

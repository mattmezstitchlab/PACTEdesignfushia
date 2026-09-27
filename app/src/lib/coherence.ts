// ============================================================
// PACTE — MOTEUR DE COHÉRENCE
// Compare ENGAGEMENTS ↔ CONDITIONS ↔ ÉCHÉANCES ↔ ÉVÉNEMENTS ↔ PREUVES.
// Détecte : échéance proche, engagement non confirmé, condition
// manquante, contradiction, modification non signée, paiement attendu,
// engagement potentiellement en retard, document manquant, événement
// susceptible d'affecter une obligation.
// IMPORTANT : le moteur signale des faits et des risques, jamais de
// certitudes juridiques. Vocabulaire : « potentiel », « possible »,
// « à vérifier », « susceptible de ».
// ============================================================
import type {
  AlerteCalculee, Clause, Contrat, ContratPartie, Echeance, Engagement,
  Evenement, Preuve, Version,
} from './types';
import { joursRestants } from './format';

export interface DonneesCoherence {
  contrat: Contrat;
  engagements: Engagement[];
  echeances: Echeance[];
  evenements: Evenement[];
  preuves: Preuve[];
  clauses: Clause[];
  parties: ContratPartie[];
  versions: Version[];
}

const R = (code: string, gravite: AlerteCalculee['gravite'], titre: string, message: string,
  entite_type: string, entite_id: number | null, action_suggeree: string): AlerteCalculee =>
  ({ code, gravite, titre, message, entite_type, entite_id, action_suggeree });

export function moteurCoherence(d: DonneesCoherence): AlerteCalculee[] {
  const alertes: AlerteCalculee[] = [];
  const { contrat, engagements, echeances, evenements, preuves, clauses, parties, versions } = d;

  // ---------- 1. ÉCHÉANCES ----------
  for (const e of echeances) {
    if (e.statut === 'realisee' || e.statut === 'annulee' || !e.date_limite) continue;
    const j = joursRestants(e.date_limite);
    if (j === null) continue;
    if (j < 0) {
      alertes.push(R('ECHEANCE_DEPASEE', 'critique',
        `Échéance dépassée : « ${e.titre || 'sans titre'} »`,
        `La date limite était fixée au ${e.date_limite.slice(0, 10)} (${Math.abs(j)} jour(s) de retard) et aucune réalisation n'est enregistrée. Vérifiez si l'obligation a été remplie hors système.`,
        'echeance', e.id,
        `Enregistrer un événement (paiement / livraison / validation…) ou reporter l'échéance par avenant.`));
    } else if (j <= 7) {
      alertes.push(R('ECHEANCE_PROCHE', j <= 2 ? 'critique' : 'attention',
        `Échéance proche : « ${e.titre || 'sans titre'} » (${j === 0 ? "aujourd'hui" : `J-${j}`})`,
        `Cette échéance arrive très bientôt et n'est pas encore marquée réalisée. Préparez les pièces et la preuve de réalisation.`,
        'echeance', e.id, `Préparer la réalisation et sa preuve, ou anticiper un report.`));
    } else if (j <= 30 && (e.type === 'paiement' || (e.montant && e.montant > 0))) {
      alertes.push(R('PAIEMENT_ATTENDU', 'attention',
        `Paiement attendu : « ${e.titre || 'sans titre'} »`,
        `Un montant de ${e.montant ?? '?'} ${e.devise || contrat.devise || ''} est attendu d'ici ${j} jour(s). Aucun événement de paiement n'est encore lié.`,
        'echeance', e.id, `Préparer la facture ou le règlement, puis enregistrer le paiement avec son reçu.`));
    }
  }

  // ---------- 2. ENGAGEMENTS ----------
  for (const g of engagements) {
    if (g.statut === 'realise' || g.statut === 'annule') continue;
    // 2a. Engagement sans échéance ni repère temporel
    if (!g.date_echeance && !g.quand_texte) {
      alertes.push(R('ENGAGEMENT_SANS_DELAI', 'attention',
        `Engagement sans repère de temps : « ${g.titre} »`,
        `Aucune date ni formulation temporelle (« quand ») n'est définie. Un engagement sans délai est difficile à suivre et à prouver.`,
        'engagement', g.id, `Préciser une date ou une formulation (« sous 15 jours », « avant le… »).`));
    }
    // 2b. Engagement potentiellement en retard
    if (g.date_echeance) {
      const j = joursRestants(g.date_echeance);
      if (j !== null && j < 0) {
        alertes.push(R('ENGAGEMENT_RETARD_POTENTIEL', 'critique',
          `Engagement potentiellement en retard : « ${g.titre} »`,
          `La date prévue (${g.date_echeance.slice(0, 10)}) est passée sans confirmation de réalisation. PACTE ne préjuge pas d'un manquement juridique : vérifiez la réalité des faits.`,
          'engagement', g.id, `Confirmer la réalisation avec preuve, ou enregistrer un retard / une impossibilité.`));
      } else if (j !== null && j <= 7) {
        alertes.push(R('ENGAGEMENT_NON_CONFIRME', 'attention',
          `Engagement non confirmé à l'approche du terme : « ${g.titre} »`,
          `Le terme est ${j === 0 ? "aujourd'hui" : `dans ${j} jour(s)`} et aucune validation n'est enregistrée.`,
          'engagement', g.id, `Contacter la partie débitrice et préparer la preuve de réalisation.`));
      }
    }
    // 2c. Condition manquante / floue
    const aConditions = g.conditions && g.conditions.trim().length > 3;
    if (!aConditions && (g.priorite === 'haute' || g.priorite === 'critique')) {
      alertes.push(R('CONDITION_MANQUANTE', 'attention',
        `Conditions non précisées : « ${g.titre} »`,
        `Cet engagement prioritaire ne précise pas « à quelles conditions ». En cas de désaccord, l'interprétation sera plus incertaine.`,
        'engagement', g.id, `Ajouter les conditions (lieu, modalités, critères de conformité…).`));
    }
    // 2d. Responsable non identifié
    if (!g.qui_partie_id && !g.qui_texte) {
      alertes.push(R('RESPONSABLE_MANQUANT', 'attention',
        `Débiteur non identifié : « ${g.titre} »`,
        `On ne sait pas QUI doit réaliser cet engagement. Un engagement sans débiteur désigné est une source fréquente de litige.`,
        'engagement', g.id, `Désigner la partie débitrice (QUI) et le bénéficiaire (POUR QUI).`));
    }
    // 2e. Preuve attendue non définie pour engagement important
    if (!g.preuve_attendue && (g.priorite === 'haute' || g.priorite === 'critique')) {
      alertes.push(R('PREUVE_NON_DEFINIE', 'info',
        `Preuve de réalisation non définie : « ${g.titre} »`,
        `Aucune preuve attendue n'est précisée. Définir à l'avance la preuve (reçu, PV, photo…) renforce la chaîne documentaire.`,
        'engagement', g.id, `Indiquer quelle preuve attestera la réalisation.`));
    }
    // 2f. Clause « si non rempli » absente pour engagement important
    if (!g.si_non_rempli && (g.priorite === 'haute' || g.priorite === 'critique')) {
      alertes.push(R('CONSEQUENCE_ABSENTE', 'info',
        `Conséquence en cas d'inexécution non prévue : « ${g.titre} »`,
        `Le contrat ne précise pas ce qui est prévu si cet engagement n'est pas rempli. Envisagez une clause (pénalité, résolution, indemnisation) — avec l'avis d'un professionnel si l'enjeu est important.`,
        'engagement', g.id, `Compléter le champ « si la condition n'est pas remplie » ou ajouter une clause.`));
    }
  }

  // ---------- 3. CONTRADICTIONS / INCOHÉRENCES ----------
  // 3a. Deux échéances de même type à la même date avec montants différents
  const parDate = new Map<string, Echeance[]>();
  for (const e of echeances) {
    if (!e.date_limite || e.statut === 'annulee') continue;
    const k = `${e.type || 'autre'}|${e.date_limite.slice(0, 10)}`;
    if (!parDate.has(k)) parDate.set(k, []);
    parDate.get(k)!.push(e);
  }
  for (const [, list] of parDate) {
    if (list.length >= 2) {
      const montants = new Set(list.map((e) => e.montant ?? '∅'));
      if (montants.size > 1) {
        alertes.push(R('CONTRADICTION_MONTANTS', 'attention',
          `Montants possiblement contradictoires à la même date`,
          `${list.length} échéances « ${list[0].type || 'autre'} » partagent la date du ${list[0].date_limite!.slice(0, 10)} avec des montants différents. Vérifiez s'il s'agit d'un doublon ou de deux obligations distinctes.`,
          'echeance', list[0].id, `Fusionner le doublon ou renommer pour distinguer les deux obligations.`));
      }
    }
  }
  // 3b. Fin du contrat avant le début
  if (contrat.date_debut && contrat.date_fin && new Date(contrat.date_fin) < new Date(contrat.date_debut)) {
    alertes.push(R('DATES_INCOHERENTES', 'critique',
      `Dates du contrat incohérentes`,
      `La date de fin (${contrat.date_fin.slice(0, 10)}) est antérieure à la date de début (${contrat.date_debut.slice(0, 10)}).`,
      'contrat', contrat.id, `Corriger les dates du contrat.`));
  }
  // 3c. Échéance hors période du contrat
  if (contrat.date_debut || contrat.date_fin) {
    for (const e of echeances) {
      if (!e.date_limite || e.statut === 'annulee') continue;
      const dd = new Date(e.date_limite).getTime();
      const horsDebut = contrat.date_debut && dd < new Date(contrat.date_debut).getTime() - 86400000;
      const horsFin = contrat.date_fin && dd > new Date(contrat.date_fin).getTime() + 86400000;
      if (horsDebut || horsFin) {
        alertes.push(R('ECHEANCE_HORS_PERIODE', 'attention',
          `Échéance hors période du contrat : « ${e.titre || 'sans titre'} »`,
          `Cette échéance (${e.date_limite.slice(0, 10)}) se situe en dehors de la période contractuelle déclarée. Vérifiez la date ou la durée du contrat.`,
          'echeance', e.id, `Ajuster la date ou prolonger le contrat par avenant.`));
        break;
      }
    }
  }
  // 3d. Événement « annulation » sans avenant ni preuve
  const aAnnulation = evenements.some((ev) => ev.type === 'annulation');
  const aAvenant = evenements.some((ev) => ev.type === 'avenant' || ev.type === 'modification')
    || versions.length > 1;
  if (aAnnulation && !aAvenant) {
    alertes.push(R('ANNULATION_SANS_ACTE', 'attention',
      `Annulation enregistrée sans acte modificatif`,
      `Un événement d'annulation existe mais aucun avenant ni acte écrit n'est rattaché. Une annulation devrait être formalisée par écrit et signée.`,
      'contrat', contrat.id, `Rédiger un avenant d'annulation / résiliation et le faire signer.`));
  }
  // 3e. Paiement enregistré supérieur au montant total
  const totalPaye = evenements
    .filter((ev) => ev.type === 'paiement')
    .reduce((s, ev) => s + (montantDansTexte(ev.description || '') || 0), 0);
  if (contrat.montant_total && totalPaye > contrat.montant_total * 1.001) {
    alertes.push(R('PAIEMENT_SUPERIEUR', 'attention',
      `Paiements enregistrés supérieurs au montant du contrat`,
      `Le cumul des paiements déclarés (${Math.round(totalPaye)} ${contrat.devise || ''}) dépasse le montant total du contrat (${contrat.montant_total} ${contrat.devise || ''}). Vérifiez les montants saisis.`,
      'contrat', contrat.id, `Vérifier les événements de paiement (doublon, acompte, frais annexes…).`));
  }

  // ---------- 4. MODIFICATION NON SIGNÉE ----------
  const modifsRecentes = evenements.filter((ev) => ev.type === 'modification' || ev.type === 'avenant');
  for (const m of modifsRecentes) {
    const suiviSignature = evenements.some((ev) => ev.type === 'signature'
      && new Date(ev.date_evenement || ev.created_at).getTime() >= new Date(m.date_evenement || m.created_at).getTime());
    if (!suiviSignature) {
      alertes.push(R('MODIFICATION_NON_SIGNEE', 'attention',
        `Modification potentiellement non signée : « ${m.titre || 'modification'} »`,
        `Une modification a été enregistrée le ${fmtCourt(m.date_evenement || m.created_at)} mais aucune signature postérieure n'a été enregistrée. Tant qu'elle n'est pas acceptée par écrit, sa portée peut être contestée.`,
        'evenement', m.id, `Faire signer l'avenant correspondant et enregistrer la signature.`));
    }
  }
  // Versions brouillon en attente
  const brouillons = versions.filter((v) => v.statut === 'brouillon');
  if (brouillons.length > 0) {
    alertes.push(R('VERSION_BROUILLON', 'info',
      `${brouillons.length} version(s) en brouillon`,
      `Des modifications de clauses existent en brouillon mais ne sont pas validées. Elles ne produisent aucun effet tant qu'elles ne sont pas validées puis signées.`,
      'contrat', contrat.id, `Valider ou abandonner les versions en brouillon.`));
  }

  // ---------- 5. SIGNATURES ----------
  const nonSignees = parties.filter((p) => p.signature_statut !== 'signee');
  if (parties.length > 0 && nonSignees.length > 0 && contrat.statut === 'actif') {
    alertes.push(R('SIGNATURE_MANQUANTE', 'critique',
      `${nonSignees.length} signature(s) manquante(s) sur un contrat actif`,
      `Le contrat est marqué « actif » alors que ${nonSignees.map((p) => p.partie?.nom || 'une partie').join(', ')} n'a pas encore signé. Un contrat non signé par toutes les parties présente un risque probatoire majeur.`,
      'contrat', contrat.id, `Recueillir les signatures manquantes avant toute exécution.`));
  } else if (parties.length > 0 && nonSignees.length > 0 && contrat.statut === 'brouillon') {
    alertes.push(R('SIGNATURE_MANQUANTE', 'info',
      `Signatures en attente (${nonSignees.length}/${parties.length})`,
      `Le contrat est encore en brouillon : pensez à recueillir toutes les signatures avant de le passer en « actif ».`,
      'contrat', contrat.id, `Finaliser le document puis recueillir les signatures.`));
  }
  // Refus de signature
  const refus = parties.filter((p) => p.signature_statut === 'refusee');
  if (refus.length > 0) {
    alertes.push(R('SIGNATURE_REFUSEE', 'critique',
      `Signature refusée par ${refus.map((p) => p.partie?.nom || 'une partie').join(', ')}`,
      `Un refus de signature bloque la formation du contrat en l'état. Il faut renégocier, amender, ou constater l'échec de l'accord par écrit.`,
      'contrat', contrat.id, `Renégocier les points bloquants ou constater l'échec par écrit.`));
  }

  // ---------- 6. DOCUMENTS / PREUVES MANQUANTS ----------
  // Réalisation déclarée sans preuve
  const realises = engagements.filter((g) => g.statut === 'realise');
  for (const g of realises) {
    const preuveLiee = preuves.some((p) => p.engagement_id === g.id);
    if (!preuveLiee) {
      alertes.push(R('PREUVE_MANQUANTE', 'attention',
        `Réalisation déclarée sans preuve : « ${g.titre} »`,
        `Cet engagement est marqué « réalisé » mais aucune pièce n'y est rattachée. En cas de contestation, seule la preuve compte.`,
        'engagement', g.id, `Joindre la preuve de réalisation (reçu, PV, photo, attestation…).`));
    }
  }
  // Paiements sans reçu
  const paiements = evenements.filter((ev) => ev.type === 'paiement');
  for (const p of paiements) {
    const aPiece = preuves.some((pr) => pr.evenement_id === p.id);
    if (!aPiece) {
      alertes.push(R('RECU_MANQUANT', 'attention',
        `Paiement sans justificatif : « ${p.titre || 'paiement'} »`,
        `Un paiement est enregistré mais aucun reçu ni justificatif n'y est joint. Joignez systématiquement la preuve de chaque flux financier.`,
        'evenement', p.id, `Joindre le reçu, le relevé ou la capture du virement.`));
      break; // un seul signal pour ne pas saturer
    }
  }
  // Contrat actif sans document signé versé aux preuves
  const aContratSigne = preuves.some((p) => p.type === 'contrat_signe');
  if ((contrat.statut === 'actif' || contrat.statut === 'termine') && !aContratSigne) {
    alertes.push(R('CONTRAT_SIGNE_ABSENT', 'attention',
      `Aucune copie du contrat signé dans les preuves`,
      `Le contrat est « ${contrat.statut} » mais aucune copie signée n'est versée à la chaîne documentaire. Conservez impérativement l'exemplaire signé de chaque partie.`,
      'contrat', contrat.id, `Verser la copie signée du contrat dans les Preuves.`));
  }

  // ---------- 7. ÉVÉNEMENTS SUSCEPTIBLES D'AFFECTER UNE OBLIGATION ----------
  const sensibles = evenements.filter((ev) =>
    ['incident', 'impossibilite', 'force_majeure', 'retard', 'refus', 'absence'].includes(ev.type || ''));
  for (const ev of sensibles) {
    const lies = (ev.engagement_ids || [])
      .map((id) => engagements.find((g) => g.id === id)?.titre)
      .filter(Boolean) as string[];
    alertes.push(R('EVENEMENT_SENSIBLE', ev.type === 'force_majeure' || ev.type === 'impossibilite' ? 'critique' : 'attention',
      `Événement à examiner : ${ev.type === 'force_majeure' ? 'force majeure déclarée' : `"${ev.titre || ev.type}"`}`,
      `${ev.type === 'force_majeure'
        ? `Une force majeure a été DÉCLARÉE par ${ev.auteur || 'une partie'}. Attention : seule une analyse au regard du droit applicable${contrat.droit_applicable ? ` (${contrat.droit_applicable})` : ''} et des faits permet de dire si les conditions en sont réunies. PACTE ne tranche pas cette question.`
        : `Cet événement (${ev.type}) du ${fmtCourt(ev.date_evenement || ev.created_at)} est susceptible d'affecter ${lies.length ? `les engagements : ${lies.join(', ')}` : 'une ou plusieurs obligations'}. Examinez les clauses correspondantes.`}`,
      'evenement', ev.id,
      ev.type === 'force_majeure' || ev.type === 'impossibilite'
        ? `Consulter rapidement un professionnel du droit ; préserver toutes les preuves de l'empêchement.`
        : `Relire les engagements concernés et, si besoin, formaliser un avenant.`));
  }

  // ---------- 8. INFORMATIONS DE BASE ----------
  if (!contrat.pays && !contrat.droit_applicable) {
    alertes.push(R('DROIT_APPLICABLE_ABSENT', 'attention',
      `Pays et droit applicable non renseignés`,
      `Sans juridiction identifiée, PACTE ne peut pas contextualiser les rappels et l'interprétation des clauses reste plus incertaine. Le droit applicable détermine largement les effets d'un contrat.`,
      'contrat', contrat.id, `Renseigner le pays et, si possible, le droit applicable et la ville.`));
  }
  if (clauses.length === 0 && (contrat.statut === 'actif' || contrat.statut === 'termine')) {
    alertes.push(R('AUCUNE_CLAUSE', 'attention',
      `Aucune clause structurée`,
      `Ce contrat ne contient aucune clause détaillée. Le document généré reposera uniquement sur l'objet et les engagements : envisagez de structurer les clauses essentielles.`,
      'contrat', contrat.id, `Ajouter au minimum : objet, prix, durée, résiliation, responsabilités.`));
  }
  if (parties.length < 2 && contrat.statut !== 'archive') {
    alertes.push(R('PARTIES_INSUFFISANTES', 'info',
      `Moins de deux parties rattachées`,
      `Un contrat suppose en principe au moins deux parties. Rattachez toutes les parties concernées (une personne peut participer à plusieurs contrats).`,
      'contrat', contrat.id, `Ajouter la ou les parties manquantes depuis l'annuaire.`));
  }

  // Tri : critique → attention → info
  const ordre = { critique: 0, attention: 1, info: 2 };
  return alertes.sort((a, b) => ordre[a.gravite] - ordre[b.gravite]);
}

function fmtCourt(d: string | null | undefined): string {
  if (!d) return 'date inconnue';
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));
  } catch {
    return String(d).slice(0, 10);
  }
}

function montantDansTexte(t: string): number | null {
  const m = t.replace(/\s/g, '').match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  return isNaN(n) ? null : n;
}

// Santé globale du contrat (à recalculer après chaque analyse).
export function santeGlobale(alertes: AlerteCalculee[]): 'saine' | 'attention' | 'critique' {
  if (alertes.some((a) => a.gravite === 'critique')) return 'critique';
  if (alertes.some((a) => a.gravite === 'attention')) return 'attention';
  return 'saine';
}

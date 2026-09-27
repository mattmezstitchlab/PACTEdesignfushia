// ============================================================
// PACTE — ANALYSE DE VALEUR (générique : art, actifs, finance, projets…)
// Règle absolue (section 16/21 du cahier des charges) : ne jamais
// afficher « valeur future = X ». Toujours : valeur observée + données
// + évolution + facteurs + scénarios + incertitude. Aucune prédiction,
// aucune garantie, aucune manipulation.
// ============================================================
import type { AnalyseValeur, Metrique } from './types';

export function analyserValeur(metriques: Metrique[]): AnalyseValeur {
  const mesures = [...metriques]
    .filter((m) => m.valeur !== null && m.valeur !== undefined)
    .sort((a, b) => new Date(a.date_mesure || a.created_at).getTime() - new Date(b.date_mesure || b.created_at).getTime());

  if (mesures.length === 0) {
    return {
      valeur_observee: null, devise: null, date_observation: null, nb_mesures: 0,
      evolution: [], variation_pct: null, facteurs: [],
      donnees_manquantes: ['Aucune donnée de valeur enregistrée pour l’instant.'],
      incertitude: 'Aucune mesure disponible : toute estimation serait inventée. Ajoutez au moins une donnée sourcée et datée.',
    };
  }

  const derniere = mesures[mesures.length - 1];
  const premiere = mesures[0];
  const evolution = mesures.slice(-24).map((m) => ({ date: (m.date_mesure || m.created_at).slice(0, 10), valeur: m.valeur as number }));
  const variation_pct = premiere.valeur && premiere.valeur !== 0
    ? Math.round(((((derniere.valeur as number) - (premiere.valeur as number)) / Math.abs(premiere.valeur as number)) * 1000)) / 10
    : null;

  const facteurs: string[] = [];
  const nonVerifiees = mesures.filter((m) => m.statut === 'a_verifier' || m.statut === 'declaree').length;
  if (nonVerifiees > 0) facteurs.push(`${nonVerifiees} donnée(s) encore « déclarée(s) » ou « à vérifier », non confirmée(s) par une source tierce.`);
  if (mesures.length >= 2) facteurs.push(`${mesures.length} mesures enregistrées entre le ${(premiere.date_mesure || premiere.created_at).slice(0, 10)} et le ${(derniere.date_mesure || derniere.created_at).slice(0, 10)}.`);
  const sources = new Set(mesures.map((m) => m.source).filter(Boolean));
  if (sources.size > 0) facteurs.push(`Source(s) citée(s) : ${[...sources].join(', ')}.`);

  const donnees_manquantes: string[] = [];
  if (mesures.length < 3) donnees_manquantes.push('Historique encore limité (moins de 3 mesures) : l’évolution reste peu significative.');
  if (sources.size === 0) donnees_manquantes.push('Aucune source citée pour ces données.');
  if (mesures.every((m) => m.statut !== 'confirmee')) donnees_manquantes.push('Aucune donnée « confirmée » : toutes restent déclarées, documentées ou à vérifier.');

  return {
    valeur_observee: derniere.valeur,
    devise: null,
    date_observation: (derniere.date_mesure || derniere.created_at).slice(0, 10),
    nb_mesures: mesures.length,
    evolution,
    variation_pct,
    facteurs,
    donnees_manquantes,
    incertitude: 'Observation fondée uniquement sur les données saisies ci-dessus, à la date indiquée. '
      + 'Elle ne constitue ni une prédiction, ni une garantie de valeur future, ni un conseil d’achat, de vente ou d’investissement.',
  };
}

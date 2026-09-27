// ============================================================
// PACTE — Analyseur de document importé (100 % local).
// Lit un texte de contrat copié/collé (ou extrait d'un fichier texte)
// et propose : infos détectées, engagements, échéances, clauses,
// points de vigilance. L'utilisateur VALIDE chaque proposition avant
// insertion : rien n'est inventé silencieusement, chaque proposition
// cite son extrait source.
// Positionnement : détection indicative, score de confiance affiché,
// jamais de loi ni de jurisprudence inventée.
// ============================================================
import type { AnalyseDocument } from './types';

const MOIS: Record<string, string> = {
  janvier: '01', fevrier: '02', février: '02', mars: '03', avril: '04', mai: '05',
  juin: '06', juillet: '07', aout: '08', août: '08', septembre: '09', octobre: '10',
  novembre: '11', decembre: '12', décembre: '12',
};

function parseDateFR(texte: string): string | null {
  // 12/03/2026, 12-03-2026, 12 mars 2026, 2026-03-12
  let m = texte.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) {
    let a = parseInt(m[3], 10);
    if (a < 100) a += 2000;
    return `${a}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  m = texte.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const bas = texte.toLowerCase();
  m = bas.match(/(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(\d{4})/);
  if (m) return `${m[3]}-${MOIS[m[2]]}-${m[1].padStart(2, '0')}`;
  return null;
}

function parseMontant(texte: string): number | null {
  const m = texte.replace(/\u202f|\u00a0/g, ' ').match(/(\d[\d\s.,]*)\s?(€|euros?|EUR|FCFA|F\s?CFA|\$|USD|CHF|£|MAD|DT|DA)\b/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/\s/g, '').replace(',', '.'));
  return isNaN(n) ? null : n;
}

function phrases(texte: string): string[] {
  return texte
    .replace(/\r/g, '')
    .split(/(?<=[.!?:;])\s+|\n+/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 25 && p.length < 1200);
}

const VERBES_ENGAGEMENT = [
  's’engage', "s'engage", 'engage à', 'devra', 'doit', 'sont tenus', 'est tenu',
  'versera', 'paiera', 'payera', 'livrera', 'fournira', 'remettra', 'exécutera',
  'executera', 'réalisera', 'realisera', 'garantit', 'garantissent', 's’oblige',
  "s'oblige", 'oblige à', 'prend en charge', 'assurera', 'effectuera',
];

const MOTS_CONDITION = ['sous réserve', 'à condition', 'pourvu que', 'dans un délai', 'sous \\d+ jours', 'avant le', 'au plus tard', 'dans les'];
const MOTS_PREUVE = ['reçu', 'recu', 'facture', 'quittance', 'attestation', 'procès-verbal', 'proces-verbal', 'accusé', 'accuse', 'justificatif', 'preuve'];

export function analyserDocument(texteBrut: string): AnalyseDocument {
  const texte = (texteBrut || '').trim();
  const ph = phrases(texte);
  const infos_detectees: AnalyseDocument['infos_detectees'] = [];
  const engagements_proposes: AnalyseDocument['engagements_proposes'] = [];
  const echeances_proposees: AnalyseDocument['echeances_proposees'] = [];
  const clauses_proposees: AnalyseDocument['clauses_proposees'] = [];
  const points_vigilance: string[] = [];

  if (texte.length < 100) {
    return {
      infos_detectees, engagements_proposes, echeances_proposees, clauses_proposees,
      points_vigilance: ['Le texte fourni est très court : l’analyse sera limitée. Collez l’intégralité du document pour de meilleurs résultats.'],
      score_confiance: 'Très faible — texte insuffisant.',
    };
  }

  // ---------- 1. INFOS GÉNÉRALES ----------
  const entreMatch = texte.match(/entre\s+(.{10,160}?)\s*(?:,|et|ci-après)/i);
  if (entreMatch) {
    infos_detectees.push({ etiquette: 'Parties mentionnées', valeur: entreMatch[1].trim().slice(0, 140), extrait: entreMatch[0].slice(0, 220) });
  }
  const emailMatch = texte.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  if (emailMatch) infos_detectees.push({ etiquette: 'Coordonnée détectée', valeur: emailMatch[0], extrait: `…${texte.slice(Math.max(0, texte.indexOf(emailMatch[0]) - 60), texte.indexOf(emailMatch[0]) + 80)}…` });
  const villeMatch = texte.match(/fait à\s+([A-ZÀ-Þ][\wÀ-ÿ' -]{2,40})/i);
  if (villeMatch) infos_detectees.push({ etiquette: 'Lieu de signature', valeur: villeMatch[1].trim(), extrait: villeMatch[0] });
  const droitMatch = texte.match(/(droit\s+(français|belge|suisse|canadien|québécois|ivoirien|sénégalais|marocain|algérien|tunisien|luxembourgeois|anglais|américain)|loi\s+du\s+\d{1,2}\s+\w+\s+\d{4}|code\s+(civil|du travail|de commerce))/i);
  if (droitMatch) infos_detectees.push({ etiquette: 'Référence juridique citée (à vérifier)', valeur: droitMatch[0].trim().slice(0, 120), extrait: `…${texte.slice(Math.max(0, (texte.toLowerCase().indexOf(droitMatch[0].toLowerCase())) - 60), texte.toLowerCase().indexOf(droitMatch[0].toLowerCase()) + 140)}…` });
  const dureeMatch = texte.match(/durée\s+(?:de\s+)?(\d+\s*(?:jours?|mois|ans?|années?))/i) || texte.match(/pour\s+une\s+durée\s+(?:de\s+)?(.{3,40}?)(?:[.,]|$)/i);
  if (dureeMatch) infos_detectees.push({ etiquette: 'Durée mentionnée', valeur: dureeMatch[1]?.trim() || dureeMatch[0].slice(0, 60), extrait: dureeMatch[0].slice(0, 200) });
  const montantGlobal = parseMontant(texte.slice(0, 4000));
  if (montantGlobal) infos_detectees.push({ etiquette: 'Montant détecté', valeur: `${montantGlobal}`, extrait: 'Premier montant détecté dans le document (vérifiez qu’il s’agit du prix global).' });

  // ---------- 2. ENGAGEMENTS (phrases avec verbes d'obligation) ----------
  const vues = new Set<string>();
  for (const p of ph) {
    const bas = p.toLowerCase();
    if (!VERBES_ENGAGEMENT.some((v) => bas.includes(v))) continue;
    const cle = bas.slice(0, 80);
    if (vues.has(cle)) continue;
    vues.add(cle);
    const date = parseDateFR(p);
    const cond = MOTS_CONDITION.some((w) => new RegExp(w, 'i').test(p));
    const prev = MOTS_PREUVE.some((w) => bas.includes(w));
    engagements_proposes.push({
      titre: p.length > 90 ? p.slice(0, 87) + '…' : p,
      description: p,
      quand_texte: date ? `Date détectée : ${date}` : delaiRelatif(p) || '',
      date_echeance: date,
      conditions: cond ? 'Condition ou délai mentionné dans la phrase — précisez-la.' : '',
      preuve_attendue: prev ? 'Justificatif évoqué dans le texte — précisez lequel.' : '',
      extrait: p,
    });
    if (engagements_proposes.length >= 12) break;
  }

  // ---------- 3. ÉCHÉANCES (dates + montants proches) ----------
  for (const p of ph) {
    const date = parseDateFR(p);
    const montant = parseMontant(p);
    const bas = p.toLowerCase();
    if (!date && !montant) continue;
    const estPaiement = /pai|vers|facture|acompte|loyer|mensualit|échéance|echeance|règlement|reglement|prix|somme|montant/i.test(p);
    const estLivraison = /livr|remet|fourni|délai de|delai de|exécut|execut|réalis|realis|achève|acheve|termine/i.test(p);
    if (!estPaiement && !estLivraison && !montant) continue;
    const key = `${date}|${montant}|${p.slice(0, 40)}`;
    if (echeances_proposees.some((e) => `${e.date_limite}|${e.montant}|${e.titre.slice(0, 40)}` === key)) continue;
    echeances_proposees.push({
      titre: (estPaiement ? 'Paiement : ' : estLivraison ? 'Jalon : ' : 'Échéance : ') + (p.length > 80 ? p.slice(0, 77) + '…' : p),
      type: estPaiement ? 'paiement' : estLivraison ? 'livraison' : 'autre',
      date_limite: date,
      montant,
      extrait: p,
    });
    if (echeances_proposees.length >= 10) break;
  }

  // ---------- 4. CLAUSES (titres « Article X » / sections) ----------
  const articleRe = /(article\s+\d+[^\n]{0,80}|§\s*\d+[^\n]{0,80}|(?:^|\n)\s*(?:objet|durée|duree|prix|paiement|résiliation|resiliation|responsabilit|force majeure|confidentialité|confidentialite|litige|juridiction|signature)[^\n]{0,80})/gi;
  let am: RegExpExecArray | null;
  const articles: { titre: string; index: number }[] = [];
  while ((am = articleRe.exec(texte)) !== null && articles.length < 20) {
    articles.push({ titre: am[1].trim().slice(0, 100), index: am.index });
  }
  for (let i = 0; i < articles.length; i++) {
    const debut = articles[i].index;
    const fin = i + 1 < articles.length ? articles[i + 1].index : Math.min(debut + 1500, texte.length);
    const contenu = texte.slice(debut, fin).trim().slice(0, 1200);
    if (contenu.length < 40) continue;
    clauses_proposees.push({
      categorie: categoriePour(articles[i].titre),
      titre: articles[i].titre,
      contenu,
      extrait: contenu.slice(0, 220) + (contenu.length > 220 ? '…' : ''),
    });
    if (clauses_proposees.length >= 12) break;
  }

  // ---------- 5. POINTS DE VIGILANCE ----------
  const bas = texte.toLowerCase();
  if (!/résili|resili|rupture|mettre fin/i.test(texte)) {
    points_vigilance.push('Aucune clause de résiliation / fin anticipée détectée : vérifiez comment le contrat peut prendre fin.');
  }
  if (!/droit applicable|juridiction compétente|tribunal compétent|litige/i.test(texte)) {
    points_vigilance.push('Aucune mention de droit applicable ou de juridiction détectée : en cas de litige transfrontalier, ce point est essentiel.');
  }
  if (/tacite reconduction|renouvel/i.test(texte) && !/préavis|preavis|dénonciation|denonciation/i.test(texte)) {
    points_vigilance.push('Renouvellement évoqué sans préavis clair détecté : vérifiez les délais pour refuser le renouvellement.');
  }
  if (/pénalit|penalit|indemnit|dommages/i.test(texte)) {
    points_vigilance.push('Des pénalités ou indemnités sont mentionnées : relisez attentivement leurs conditions de déclenchement.');
  }
  if (engagements_proposes.length === 0) {
    points_vigilance.push('Aucune phrase d’engagement clairement détectée : le document est peut-être une trame, un modèle vierge ou un texte non contractuel.');
  }
  if (parseMontant(texte) === null) {
    points_vigilance.push('Aucun montant détecté : s’il s’agit d’un contrat à titre onéreux, vérifiez que le prix est bien fixé.');
  }
  if (!/signatur|fait à|fait en .* exemplaires/i.test(texte)) {
    points_vigilance.push('Aucune mention de signature détectée : vérifiez que le document soumis est bien la version signée.');
  }
  points_vigilance.push(
    'Cette analyse est automatisée et indicative : elle peut manquer des éléments ou en mal interpréter. Relisez toujours le document source et, en cas d’enjeu, faites-le valider par un professionnel du droit.',
  );

  // ---------- 6. SCORE ----------
  const richesse = infos_detectees.length + engagements_proposes.length + echeances_proposees.length + clauses_proposees.length;
  const score_confiance =
    richesse >= 12 ? 'Bonne — document structuré, nombreuses détections à valider.' :
    richesse >= 6 ? 'Moyenne — plusieurs éléments détectés, complétez manuellement.' :
    'Faible — peu d’éléments détectés, saisie manuelle recommandée.';

  return { infos_detectees, engagements_proposes, echeances_proposees, clauses_proposees, points_vigilance, score_confiance };
}

function delaiRelatif(p: string): string {
  const m = p.match(/sous\s+(\d+\s*(?:jours?|semaines?|mois))/i)
    || p.match(/dans\s+(?:un\s+)?délai\s+(?:de\s+)?(\d+\s*(?:jours?|semaines?|mois))/i)
    || p.match(/dans\s+les\s+(\d+\s*(?:jours?|semaines?|mois))/i);
  return m ? `Délai détecté : ${m[1]}` : '';
}

function categoriePour(titre: string): string {
  const t = titre.toLowerCase();
  if (/objet/.test(t)) return 'OBJET';
  if (/durée|duree|terme|effet/.test(t)) return 'ÉCHÉANCES';
  if (/prix|paiement|factur|montant|rémunération|remuneration/.test(t)) return 'PRIX & PAIEMENTS';
  if (/obligation|engage|charge/.test(t)) return 'OBLIGATIONS';
  if (/droit/.test(t)) return 'DROITS';
  if (/condition/.test(t)) return 'CONDITIONS';
  if (/livr|délai|delai|exécut/.test(t)) return 'LIVRABLES';
  if (/valid|réception|reception|conform/.test(t)) return 'VALIDATIONS';
  if (/annul/.test(t)) return 'ANNULATION';
  if (/modif|avenant/.test(t)) return 'MODIFICATION';
  if (/résili|resili|rupture|fin/.test(t)) return 'RÉSILIATION';
  if (/responsab|garantie|assurance/.test(t)) return 'RESPONSABILITÉS';
  if (/force majeure|imprév|exception|cas fortuit/.test(t)) return 'ÉVÉNEMENTS EXCEPTIONNELS';
  if (/preuve|justific|document/.test(t)) return 'PREUVES';
  if (/signatur|exemplaire/.test(t)) return 'SIGNATURES';
  return 'DIVERS';
}

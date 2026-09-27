// Helpers de formatage (fr-FR)

export function fmtDate(d: string | null | undefined, avecHeure = false): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', avecHeure
      ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: 'numeric', month: 'short', year: 'numeric' }).format(dt);
  } catch {
    return String(d).slice(0, 10);
  }
}

export function fmtDateLong(d: string | null | undefined): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(dt);
  } catch {
    return String(d).slice(0, 10);
  }
}

export function fmtMontant(m: number | null | undefined, devise = 'EUR'): string {
  if (m === null || m === undefined || isNaN(Number(m))) return '—';
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise || 'EUR', maximumFractionDigits: 2 }).format(Number(m));
  } catch {
    return `${m} ${devise}`;
  }
}

export function joursRestants(dateLimite: string | null | undefined): number | null {
  if (!dateLimite) return null;
  const lim = new Date(dateLimite);
  if (isNaN(lim.getTime())) return null;
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const b = new Date(lim.getFullYear(), lim.getMonth(), lim.getDate()).getTime();
  return Math.round((b - a) / 86400000);
}

export function delaiHumain(j: number | null | undefined): string {
  if (j === null || j === undefined) return 'date non fixée';
  if (j < 0) return `dépassé de ${Math.abs(j)} j`;
  if (j === 0) return "aujourd'hui";
  if (j === 1) return 'demain';
  if (j <= 30) return `dans ${j} j`;
  const mois = Math.round(j / 30);
  return `dans ~${mois} mois`;
}

export function initiales(nom: string | null | undefined): string {
  if (!nom) return '?';
  return nom.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || '?';
}

// Petite empreinte de traçabilité (chaîne documentaire) — horodatage + hash simple.
export function empreinteDoc(seed: string): string {
  const s = `${seed}|${Date.now()}|${Math.random().toString(36).slice(2)}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619);
    h2 = Math.imul(h2 + s.charCodeAt(i), 31);
  }
  const h = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return `CTX-${h(h1)}${h(h2)}`.toUpperCase();
}

export function statutContratLabel(s: string | null | undefined): string {
  const m: Record<string, string> = {
    brouillon: 'Brouillon', actif: 'Actif', suspendu: 'Suspendu', termine: 'Terminé', archive: 'Archivé',
  };
  return m[s || ''] || s || '—';
}

export function typeEvenementLabel(t: string | null | undefined): string {
  const m: Record<string, string> = {
    paiement: 'Paiement', retard: 'Retard', modification: 'Modification', annulation: 'Annulation',
    absence: 'Absence', demande: 'Demande', validation: 'Validation', refus: 'Refus',
    livraison: 'Livraison', reception: 'Réception', incident: 'Incident', impossibilite: 'Impossibilité',
    force_majeure: 'Force majeure déclarée', communication: 'Communication importante',
    document: 'Nouveau document', signature: 'Signature', avenant: 'Avenant', autre: 'Autre',
  };
  return m[t || ''] || t || 'Événement';
}

export function typePreuveLabel(t: string | null | undefined): string {
  const m: Record<string, string> = {
    contrat_signe: 'Contrat signé', avenant: 'Avenant', facture: 'Facture', recu_paiement: 'Reçu de paiement',
    releve: 'Relevé', bon_livraison: 'Bon de livraison', proces_verbal: 'Procès-verbal', courriel: 'Courriel',
    courrier: 'Courrier', message: 'Message', photo: 'Photo', attestation: 'Attestation',
    identite: "Pièce d'identité", autre: 'Autre document',
  };
  return m[t || ''] || t || 'Document';
}

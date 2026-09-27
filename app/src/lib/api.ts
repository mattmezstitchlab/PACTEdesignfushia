// ============================================================
// PACTE — Client API (lectures/écritures via /api → Supabase).
// ============================================================
import type {
  Contrat, Partie, ContratPartie, Clause, Engagement, Echeance,
  Evenement, Preuve, Alerte, Action, Scenario, Version, Historique, Modele,
} from './types';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) {
    let msg = `Erreur ${res.status}`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

function crud<T>(base: string) {
  return {
    list: (params?: Record<string, string | number | null | undefined>) => {
      const q = new URLSearchParams();
      if (params) for (const [k, v] of Object.entries(params)) {
        if (v !== null && v !== undefined && v !== '') q.set(k, String(v));
      }
      const s = q.toString();
      return req<T[]>(s ? `${base}?${s}` : base);
    },
    get: (id: number | string) => req<T>(`${base}?id=${id}`),
    create: (data: Record<string, any>) => req<T>(base, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number | string, data: Record<string, any>) => req<T>(base, { method: 'PUT', body: JSON.stringify({ ...data, id }) }),
    remove: (id: number | string) => req<{ ok: boolean }>(`${base}?id=${id}`, { method: 'DELETE' }),
  };
}

export const api = {
  contrats: crud<Contrat>('/api/contrats'),
  parties: crud<Partie>('/api/parties'),
  contratParties: crud<ContratPartie>('/api/contrat_parties'),
  clauses: crud<Clause>('/api/clauses'),
  engagements: crud<Engagement>('/api/engagements'),
  echeances: crud<Echeance>('/api/echeances'),
  evenements: crud<Evenement>('/api/evenements'),
  preuves: crud<Preuve>('/api/preuves'),
  alertes: crud<Alerte>('/api/alertes'),
  actions: crud<Action>('/api/actions'),
  scenarios: crud<Scenario>('/api/scenarios'),
  versions: crud<Version>('/api/versions'),
  historique: crud<Historique>('/api/historique'),
  modeles: crud<Modele>('/api/modeles'),
  upload: (fileName: string, fileBase64: string, contentType: string) =>
    req<{ url: string; path: string }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ fileName, fileBase64, contentType }),
    }),
};

// Journalisation systématique : chaque mutation importante laisse une trace.
export async function logAction(
  contrat_id: number | null,
  action: string,
  entite_type?: string,
  entite_id?: number | null,
  details?: any,
  acteur = 'Utilisateur',
): Promise<void> {
  try {
    await api.historique.create({
      contrat_id,
      acteur,
      action,
      entite_type: entite_type || null,
      entite_id: entite_id ?? null,
      details: details || null,
    });
  } catch (e) {
    console.warn('[pacte] historique non enregistré:', e);
  }
}

export function fichierVersBase64(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = reject;
    r.readAsDataURL(f);
  });
}

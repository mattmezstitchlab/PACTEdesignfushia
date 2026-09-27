// ============================================================
// PACTE / CONTRACTOS — Logique CRUD générique, partagée par :
//   - les fonctions serverless Vercel (api/*.js), pour le déploiement,
//   - le serveur de développement intégré à Vite (voir vite.config.ts),
//   - le petit serveur autonome server/main.js (auto-hébergement).
// Une seule implémentation : aucune règle métier n'est dupliquée.
// ============================================================
import * as store from './store.js';

// Options par table : ordre par défaut et horodatage de mise à jour.
export const RESOURCE_TABLES = {
  contrats: { order: 'id', asc: false, touch: true },
  parties: { order: 'id', asc: false },
  contrat_parties: {},
  clauses: {},
  engagements: { touch: true },
  echeances: {},
  evenements: { order: 'id', asc: false },
  preuves: { order: 'id', asc: false },
  alertes: { order: 'id', asc: false },
  actions: { touch: true },
  scenarios: {},
  versions: { order: 'id', asc: false },
  historique: { order: 'id', asc: false },
  modeles: {},
};

export function isKnownResource(table) {
  return Object.prototype.hasOwnProperty.call(RESOURCE_TABLES, table);
}

export async function handleResource(table, { method, query, body }) {
  const opts = RESOURCE_TABLES[table] || {};
  try {
    if (method === 'GET') {
      const { id, ...filters } = query || {};
      if (id) {
        const row = await store.getById(table, id);
        return { status: 200, body: row ?? null };
      }
      const rows = await store.list(table, filters, { ...opts, limit: opts.limit || 500 });
      return { status: 200, body: rows };
    }
    if (method === 'POST') {
      const payload = { ...(body || {}) };
      if (!Object.keys(payload).length) return { status: 400, body: { error: 'Données manquantes.' } };
      const row = await store.create(table, payload, opts);
      return { status: 201, body: row };
    }
    if (method === 'PUT') {
      const { id, ...rest } = body || {};
      if (!id) return { status: 400, body: { error: 'Identifiant manquant.' } };
      const row = await store.update(table, id, rest, opts);
      if (!row) return { status: 404, body: { error: 'Introuvable.' } };
      return { status: 200, body: row };
    }
    if (method === 'DELETE') {
      const id = (body && body.id) || (query && query.id);
      if (!id) return { status: 400, body: { error: 'Identifiant manquant.' } };
      await store.remove(table, id);
      return { status: 200, body: { ok: true } };
    }
    return { status: 405, body: { error: 'Méthode non autorisée.' } };
  } catch (err) {
    console.error(`[api:${table}]`, err);
    return { status: 500, body: { error: err?.message || 'Erreur serveur.' } };
  }
}

export async function handleUpload({ method, body }) {
  if (method !== 'POST') return { status: 405, body: { error: 'Méthode non autorisée.' } };
  const { fileName, fileBase64, contentType } = body || {};
  void contentType;
  if (!fileName || !fileBase64) return { status: 400, body: { error: 'Fichier manquant.' } };
  const buffer = Buffer.from(fileBase64, 'base64');
  if (buffer.length > 8 * 1024 * 1024) return { status: 400, body: { error: 'Fichier trop volumineux (8 Mo max).' } };
  try {
    const result = await store.saveUpload(fileName, buffer);
    return { status: 200, body: result };
  } catch (err) {
    console.error('[api:upload]', err);
    return { status: 500, body: { error: err?.message || 'Échec du téléversement.' } };
  }
}

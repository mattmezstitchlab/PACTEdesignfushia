// Fabrique de fonctions serverless Vercel — délègue toute la logique
// au module partagé server/handlers.js (aucune règle dupliquée ici).
import { handleResource } from '../server/handlers.js';

export function resourceHandler(table) {
  return async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(204).end();
    const { status, body } = await handleResource(table, { method: req.method, query: req.query, body: req.body });
    return res.status(status).json(body);
  };
}

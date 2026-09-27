// Middleware de développement Vite : sert /api/* et /uploads/* en local
// avec la même logique que les fonctions serverless (server/handlers.js).
// Permet de lancer toute l'application (front + API + persistance) avec
// une seule commande (`npm run dev`) sur un seul port.
import fs from 'node:fs';
import path from 'node:path';
import { isKnownResource, handleResource, handleUpload } from './handlers.js';
import { UPLOADS_DIR } from './store.js';

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.method === 'GET' || req.method === 'DELETE' && !req.headers['content-length']) return resolve(undefined);
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      if (!raw) return resolve(undefined);
      try { resolve(JSON.parse(raw)); } catch { resolve(undefined); }
    });
    req.on('error', reject);
  });
}

const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.pdf': 'application/pdf', '.txt': 'text/plain', '.svg': 'image/svg+xml',
};

export function pacteApiPlugin() {
  return {
    name: 'pacte-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = new URL(req.url, 'http://localhost');
          const pathname = url.pathname;

          if (pathname.startsWith('/uploads/')) {
            const file = path.join(UPLOADS_DIR, decodeURIComponent(pathname.replace('/uploads/', '')));
            if (!file.startsWith(UPLOADS_DIR) || !fs.existsSync(file)) { res.statusCode = 404; return res.end('Not found'); }
            res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
            return fs.createReadStream(file).pipe(res);
          }

          if (!pathname.startsWith('/api/')) return next();

          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }

          const name = pathname.replace('/api/', '');
          const query = Object.fromEntries(url.searchParams.entries());
          const body = await readBody(req);

          let result;
          if (name === 'upload') {
            result = await handleUpload({ method: req.method, body });
          } else if (isKnownResource(name)) {
            result = await handleResource(name, { method: req.method, query, body });
          } else {
            result = { status: 404, body: { error: 'Ressource inconnue.' } };
          }
          res.statusCode = result.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result.body));
        } catch (err) {
          console.error('[pacte-api]', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err?.message || 'Erreur serveur.' }));
        }
      });
    },
  };
}

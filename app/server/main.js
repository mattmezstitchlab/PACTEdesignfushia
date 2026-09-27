// Serveur autonome (hors Vercel) : sert le build statique (dist/) et
// l'API (server/handlers.js). Utile pour l'auto-hébergement ou pour
// vérifier un build de production sans dépendre de Vercel.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isKnownResource, handleResource, handleUpload } from './handlers.js';
import { UPLOADS_DIR } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'dist');
const PORT = process.env.PORT || 4000;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2',
};

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => { if (!raw) return resolve(undefined); try { resolve(JSON.parse(raw)); } catch { resolve(undefined); } });
  });
}

function serveFile(res, file) {
  res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  if (pathname.startsWith('/uploads/')) {
    const file = path.join(UPLOADS_DIR, decodeURIComponent(pathname.replace('/uploads/', '')));
    if (!file.startsWith(UPLOADS_DIR) || !fs.existsSync(file)) { res.statusCode = 404; return res.end('Not found'); }
    return serveFile(res, file);
  }

  if (pathname.startsWith('/api/')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
    const name = pathname.replace('/api/', '');
    const query = Object.fromEntries(url.searchParams.entries());
    const body = await readBody(req);
    let result;
    if (name === 'upload') result = await handleUpload({ method: req.method, body });
    else if (isKnownResource(name)) result = await handleResource(name, { method: req.method, query, body });
    else result = { status: 404, body: { error: 'Ressource inconnue.' } };
    res.statusCode = result.status;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(result.body));
  }

  // SPA statique
  let file = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!file.startsWith(DIST_DIR)) file = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST_DIR, 'index.html');
  return serveFile(res, file);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`PACTE — serveur de production sur http://0.0.0.0:${PORT}`);
});

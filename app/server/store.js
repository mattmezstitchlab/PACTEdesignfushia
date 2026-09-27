// ============================================================
// PACTE / CONTRACTOS — Couche de persistance (source de vérité unique).
//
// Un seul jeu de fonctions CRUD, deux implémentations interchangeables :
//   - "local"    : fichier JSON sur disque (utilisé par défaut, pratique
//                  pour le développement et l'auto-hébergement sans
//                  dépendance réseau externe).
//   - "supabase" : la base Postgres/Supabase déjà configurée dans le
//                  projet (recommandée en production, notamment sur
//                  Vercel). Activée automatiquement dès que les
//                  variables d'environnement Supabase sont présentes,
//                  ou explicitement via DATA_BACKEND=supabase.
//
// Les pages/API n'appellent jamais directement Supabase ou le fichier
// JSON : elles passent toutes par ce module. Une fonction = un seul
// endroit ; une donnée = une seule source de vérité.
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const REQUESTED_BACKEND = (process.env.DATA_BACKEND || '').toLowerCase();
export const BACKEND = REQUESTED_BACKEND === 'supabase' || (REQUESTED_BACKEND !== 'local' && SUPABASE_URL && SUPABASE_KEY)
  ? 'supabase'
  : 'local';

// ------------------------------------------------------------------
// BACKEND LOCAL (fichier JSON) — persistance réelle sur disque.
// ------------------------------------------------------------------
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function emptyDb() {
  return {
    contrats: [], parties: [], contrat_parties: [], clauses: [], engagements: [],
    echeances: [], evenements: [], preuves: [], alertes: [], actions: [],
    scenarios: [], versions: [], historique: [], modeles: [],
    // Moteur universel — voir server/handlers.js pour le détail.
    objets: [], relations: [], metriques: [], decisions: [],
    _seq: {},
  };
}

let cache = null;
function readDb() {
  if (cache) return cache;
  ensureDirs();
  if (!fs.existsSync(DB_FILE)) {
    cache = emptyDb();
    writeDb(cache);
    return cache;
  }
  try {
    cache = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    cache = emptyDb();
  }
  for (const t of Object.keys(emptyDb())) if (!(t in cache)) cache[t] = t === '_seq' ? {} : [];
  return cache;
}

function writeDb(db) {
  ensureDirs();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function nextId(db, table) {
  const rows = db[table] || [];
  const max = rows.reduce((m, r) => (typeof r.id === 'number' && r.id > m ? r.id : m), 0);
  const seq = (db._seq[table] || 0) + 1;
  const id = Math.max(max + 1, seq);
  db._seq[table] = id;
  return id;
}

function matches(row, filters) {
  for (const [k, v] of Object.entries(filters || {})) {
    if (v === undefined || v === null || v === '' || v === 'undefined' || v === 'null') continue;
    if (String(row[k]) !== String(v)) return false;
  }
  return true;
}

async function localList(table, filters, opts = {}) {
  const db = readDb();
  let rows = (db[table] || []).filter((r) => matches(r, filters));
  const orderKey = opts.order || 'id';
  const asc = opts.asc !== false;
  rows = [...rows].sort((a, b) => {
    const av = a[orderKey], bv = b[orderKey];
    if (av === bv) return 0;
    if (av === null || av === undefined) return asc ? -1 : 1;
    if (bv === null || bv === undefined) return asc ? 1 : -1;
    return (av > bv ? 1 : -1) * (asc ? 1 : -1);
  });
  if (opts.limit) rows = rows.slice(0, opts.limit);
  return rows;
}

async function localGetById(table, id) {
  const db = readDb();
  return (db[table] || []).find((r) => String(r.id) === String(id)) || null;
}

async function localCreate(table, payload, opts = {}) {
  const db = readDb();
  if (!db[table]) db[table] = [];
  const now = new Date().toISOString();
  const row = { ...payload, id: nextId(db, table), created_at: payload.created_at || now };
  if (opts.touch) row.updated_at = now;
  db[table].push(row);
  writeDb(db);
  return row;
}

async function localUpdate(table, id, payload, opts = {}) {
  const db = readDb();
  const rows = db[table] || [];
  const idx = rows.findIndex((r) => String(r.id) === String(id));
  if (idx === -1) return null;
  const merged = { ...rows[idx], ...payload, id: rows[idx].id, created_at: rows[idx].created_at };
  if (opts.touch) merged.updated_at = new Date().toISOString();
  rows[idx] = merged;
  writeDb(db);
  return merged;
}

async function localRemove(table, id) {
  const db = readDb();
  db[table] = (db[table] || []).filter((r) => String(r.id) !== String(id));
  writeDb(db);
  return true;
}

// ------------------------------------------------------------------
// BACKEND SUPABASE — même contrat, exécuté contre Postgres.
// ------------------------------------------------------------------
let supabaseClient = null;
async function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const { createClient } = await import('@supabase/supabase-js');
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  return supabaseClient;
}

async function supaList(table, filters, opts = {}) {
  const supabase = await getSupabase();
  let q = supabase.from(table).select(opts.select || '*');
  for (const [k, v] of Object.entries(filters || {})) {
    if (v === undefined || v === '' || v === 'undefined' || v === 'null') continue;
    q = q.eq(k, v);
  }
  q = q.order(opts.order || 'id', { ascending: opts.asc !== false, nullsFirst: false });
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function supaGetById(table, id) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

async function supaCreate(table, payload, opts = {}) {
  const supabase = await getSupabase();
  const row = { ...payload };
  delete row.id;
  if (opts.touch) row.updated_at = new Date().toISOString();
  const { data, error } = await supabase.from(table).insert(row).select();
  if (error) throw error;
  return data && data[0];
}

async function supaUpdate(table, id, payload, opts = {}) {
  const supabase = await getSupabase();
  const row = { ...payload };
  delete row.created_at;
  if (opts.touch) row.updated_at = new Date().toISOString();
  const { data, error } = await supabase.from(table).update(row).eq('id', id).select();
  if (error) throw error;
  return data && data[0];
}

async function supaRemove(table, id) {
  const supabase = await getSupabase();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ------------------------------------------------------------------
// Façade unique exposée au reste de l'application.
// ------------------------------------------------------------------
export async function list(table, filters, opts) {
  return BACKEND === 'supabase' ? supaList(table, filters, opts) : localList(table, filters, opts);
}
export async function getById(table, id) {
  return BACKEND === 'supabase' ? supaGetById(table, id) : localGetById(table, id);
}
export async function create(table, payload, opts) {
  return BACKEND === 'supabase' ? supaCreate(table, payload, opts) : localCreate(table, payload, opts);
}
export async function update(table, id, payload, opts) {
  return BACKEND === 'supabase' ? supaUpdate(table, id, payload, opts) : localUpdate(table, id, payload, opts);
}
export async function remove(table, id) {
  return BACKEND === 'supabase' ? supaRemove(table, id) : localRemove(table, id);
}

export async function saveUpload(fileName, buffer) {
  if (BACKEND === 'supabase') {
    const supabase = await getSupabase();
    const safe = String(Date.now() + '-' + fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const { error } = await supabase.storage.from('preuves').upload(safe, buffer, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('preuves').getPublicUrl(safe);
    return { url: data.publicUrl, path: safe };
  }
  ensureDirs();
  const safe = String(Date.now() + '-' + fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
  fs.writeFileSync(path.join(UPLOADS_DIR, safe), buffer);
  return { url: `/uploads/${safe}`, path: safe };
}

export function resetLocalCacheForTests() { cache = null; }

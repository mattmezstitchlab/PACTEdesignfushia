import supabase from './db-client.js';

const resources = new Set(['users','professional_profiles','events','timeline_items','bookings','contracts','contract_versions','consents','continuity_cases','continuity_steps','replacement_proposals','transmissions','professional_opportunities','payments','installments','documents','notifications','audit_logs','network_availability']);
const filters = new Set(['id','event_id','booking_id','professional_id','client_id','case_id','contract_id','payment_id','user_id','from_professional_id','to_professional_id','status']);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const resource = req.query.resource || req.body?.resource;
  if (!resources.has(resource)) return res.status(400).json({ error: 'Ressource inconnue.' });
  try {
    if (req.method === 'GET') {
      let query = supabase.from(resource).select('*').order('id', { ascending: true });
      for (const [key, value] of Object.entries(req.query)) if (filters.has(key) && value !== undefined) query = query.eq(key, value);
      const { data, error } = await query.limit(500);
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { resource: ignored, ...payload } = req.body || {};
      if (!Object.keys(payload).length) return res.status(400).json({ error: 'Données manquantes.' });
      const { data, error } = await supabase.from(resource).insert(payload).select('*').single();
      if (error) throw error;
      if (resource !== 'audit_logs') await supabase.from('audit_logs').insert({ actor: 'Espace démo', action: `Création · ${resource}`, details: `Enregistrement #${data.id}` });
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { resource: ignored, id, ...payload } = req.body || {};
      if (!id || !Object.keys(payload).length) return res.status(400).json({ error: 'Identifiant ou données manquants.' });
      const { data, error } = await supabase.from(resource).update(payload).eq('id', id).select('*').single();
      if (error) throw error;
      if (resource !== 'audit_logs') await supabase.from('audit_logs').insert({ actor: 'Espace démo', action: `Modification · ${resource}`, details: `Enregistrement #${id}` });
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Identifiant manquant.' });
      const { error } = await supabase.from(resource).delete().eq('id', id);
      if (error) throw error;
      if (resource !== 'audit_logs') await supabase.from('audit_logs').insert({ actor: 'Espace démo', action: `Suppression · ${resource}`, details: `Enregistrement #${id}` });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message || 'Erreur serveur.' });
  }
}

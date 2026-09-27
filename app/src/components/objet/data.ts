// ============================================================
// PACTE — Chargement des données d'un OBJET (moteur universel).
// Miroir exact de src/components/contrat/data.ts : mêmes tables,
// mêmes primitives CRUD, seule la clé de rattachement change
// (objet_id au lieu de contrat_id). Aucune logique dupliquée.
// ============================================================
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type {
  Action, Alerte, Decision, Echeance, Engagement, Evenement, Historique,
  Metrique, Objet, Partie, Preuve, Relation, Scenario, Version,
} from '../../lib/types';

export interface ObjetData {
  objet: Objet | null;
  relations: Relation[];
  parties: Partie[];
  engagements: Engagement[];
  echeances: Echeance[];
  evenements: Evenement[];
  preuves: Preuve[];
  alertes: Alerte[];
  actions: Action[];
  scenarios: Scenario[];
  versions: Version[];
  metriques: Metrique[];
  decisions: Decision[];
  historique: Historique[];
  loading: boolean;
  erreur: string;
  recharger: () => Promise<void>;
  rechargerTable: (t: string) => Promise<void>;
}

export function useObjetData(id: number | null): ObjetData {
  const [objet, setObjet] = useState<Objet | null>(null);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [parties, setParties] = useState<Partie[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [echeances, setEcheances] = useState<Echeance[]>([]);
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [preuves, setPreuves] = useState<Preuve[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [metriques, setMetriques] = useState<Metrique[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [historique, setHistorique] = useState<Historique[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setErreur('');
    try {
      const o = await api.objets.get(id);
      if (!o || !o.id) throw new Error('Objet introuvable');
      setObjet(o);
      const [rel, all, engs, echs, evs, prs, als, acts, scs, vers, mets, decs, hist] = await Promise.all([
        api.relations.list({ objet_id: id }),
        api.parties.list(),
        api.engagements.list({ objet_id: id }),
        api.echeances.list({ objet_id: id }),
        api.evenements.list({ objet_id: id }),
        api.preuves.list({ objet_id: id }),
        api.alertes.list({ objet_id: id }),
        api.actions.list({ objet_id: id }),
        api.scenarios.list({ objet_id: id }),
        api.versions.list({ objet_id: id }),
        api.metriques.list({ objet_id: id }),
        api.decisions.list({ objet_id: id }),
        api.historique.list({ objet_id: id }),
      ]);
      const map = new Map(all.map((p) => [p.id, p]));
      setParties(all);
      setRelations(rel.map((r) => ({ ...r, partie: r.partie_id ? map.get(r.partie_id) : undefined })));
      setEngagements(engs);
      setEcheances(echs);
      setEvenements(evs);
      setPreuves(prs);
      setAlertes(als);
      setActions(acts);
      setScenarios(scs);
      setVersions(vers);
      setMetriques(mets);
      setDecisions(decs);
      setHistorique(hist);
    } catch (e: any) {
      setErreur(e.message || 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { charger(); }, [charger]);

  const rechargerTable = useCallback(async (t: string) => {
    if (!id) return;
    try {
      if (t === 'objet') setObjet(await api.objets.get(id));
      if (t === 'relations') {
        const rel = await api.relations.list({ objet_id: id });
        const all = await api.parties.list();
        const map = new Map(all.map((p) => [p.id, p]));
        setParties(all);
        setRelations(rel.map((r) => ({ ...r, partie: r.partie_id ? map.get(r.partie_id) : undefined })));
      }
      if (t === 'engagements') setEngagements(await api.engagements.list({ objet_id: id }));
      if (t === 'echeances') setEcheances(await api.echeances.list({ objet_id: id }));
      if (t === 'evenements') setEvenements(await api.evenements.list({ objet_id: id }));
      if (t === 'preuves') setPreuves(await api.preuves.list({ objet_id: id }));
      if (t === 'alertes') setAlertes(await api.alertes.list({ objet_id: id }));
      if (t === 'actions') setActions(await api.actions.list({ objet_id: id }));
      if (t === 'scenarios') setScenarios(await api.scenarios.list({ objet_id: id }));
      if (t === 'versions') setVersions(await api.versions.list({ objet_id: id }));
      if (t === 'metriques') setMetriques(await api.metriques.list({ objet_id: id }));
      if (t === 'decisions') setDecisions(await api.decisions.list({ objet_id: id }));
      if (t === 'historique') setHistorique(await api.historique.list({ objet_id: id }));
    } catch (e) {
      console.warn('[pacte] rechargerTable (objet)', t, e);
    }
  }, [id]);

  return {
    objet, relations, parties, engagements, echeances, evenements, preuves,
    alertes, actions, scenarios, versions, metriques, decisions, historique,
    loading, erreur, recharger: charger, rechargerTable,
  };
}

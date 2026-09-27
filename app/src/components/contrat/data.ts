import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type {
  Action, Alerte, Clause, Contrat, ContratPartie, Echeance, Engagement,
  Evenement, Historique, Partie, Preuve, Scenario, Version,
} from '../../lib/types';

export interface ContratData {
  contrat: Contrat | null;
  contratParties: ContratPartie[];
  parties: Partie[];
  clauses: Clause[];
  engagements: Engagement[];
  echeances: Echeance[];
  evenements: Evenement[];
  preuves: Preuve[];
  alertes: Alerte[];
  actions: Action[];
  scenarios: Scenario[];
  versions: Version[];
  historique: Historique[];
  loading: boolean;
  erreur: string;
  recharger: () => Promise<void>;
  rechargerTable: (t: string) => Promise<void>;
}

export function useContratData(id: number | null): ContratData {
  const [contrat, setContrat] = useState<Contrat | null>(null);
  const [contratParties, setContratParties] = useState<ContratPartie[]>([]);
  const [parties, setParties] = useState<Partie[]>([]);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [echeances, setEcheances] = useState<Echeance[]>([]);
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [preuves, setPreuves] = useState<Preuve[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [historique, setHistorique] = useState<Historique[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setErreur('');
    try {
      const c = await api.contrats.get(id);
      if (!c || !c.id) throw new Error('Contrat introuvable');
      setContrat(c);
      const [cps, cls, engs, echs, evs, prs, als, acts, scs, vers, hist] = await Promise.all([
        api.contratParties.list({ contrat_id: id }),
        api.clauses.list({ contrat_id: id }),
        api.engagements.list({ contrat_id: id }),
        api.echeances.list({ contrat_id: id }),
        api.evenements.list({ contrat_id: id }),
        api.preuves.list({ contrat_id: id }),
        api.alertes.list({ contrat_id: id }),
        api.actions.list({ contrat_id: id }),
        api.scenarios.list({ contrat_id: id }),
        api.versions.list({ contrat_id: id }),
        api.historique.list({ contrat_id: id }),
      ]);
      // Enrichir les liens avec les fiches parties
      const all = await api.parties.list();
      const map = new Map(all.map((p) => [p.id, p]));
      setParties(all);
      setContratParties(cps.map((cp) => ({ ...cp, partie: map.get(cp.partie_id) })));
      setClauses(cls);
      setEngagements(engs);
      setEcheances(echs);
      setEvenements(evs);
      setPreuves(prs);
      setAlertes(als);
      setActions(acts);
      setScenarios(scs);
      setVersions(vers);
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
      if (t === 'contrat') setContrat(await api.contrats.get(id));
      if (t === 'parties') {
        const cps = await api.contratParties.list({ contrat_id: id });
        const all = await api.parties.list();
        const map = new Map(all.map((p) => [p.id, p]));
        setParties(all);
        setContratParties(cps.map((cp) => ({ ...cp, partie: map.get(cp.partie_id) })));
      }
      if (t === 'clauses') setClauses(await api.clauses.list({ contrat_id: id }));
      if (t === 'engagements') setEngagements(await api.engagements.list({ contrat_id: id }));
      if (t === 'echeances') setEcheances(await api.echeances.list({ contrat_id: id }));
      if (t === 'evenements') setEvenements(await api.evenements.list({ contrat_id: id }));
      if (t === 'preuves') setPreuves(await api.preuves.list({ contrat_id: id }));
      if (t === 'alertes') setAlertes(await api.alertes.list({ contrat_id: id }));
      if (t === 'actions') setActions(await api.actions.list({ contrat_id: id }));
      if (t === 'scenarios') setScenarios(await api.scenarios.list({ contrat_id: id }));
      if (t === 'versions') setVersions(await api.versions.list({ contrat_id: id }));
      if (t === 'historique') setHistorique(await api.historique.list({ contrat_id: id }));
    } catch (e) {
      console.warn('[pacte] rechargerTable', t, e);
    }
  }, [id]);

  return {
    contrat, contratParties, parties, clauses, engagements, echeances,
    evenements, preuves, alertes, actions, scenarios, versions, historique,
    loading, erreur, recharger: charger, rechargerTable,
  };
}

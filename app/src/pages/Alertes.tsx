import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Eye, XCircle } from 'lucide-react';
import { api, logAction, logActionObjet } from '../lib/api';
import type { Alerte, Contrat, Objet } from '../lib/types';
import { Spinner, Empty, Prudence, useToast } from '../components/ui';
import { CarteAlerte } from '../components/contrat/OngletAlertes';

// Centre global des alertes — communes aux contrats et aux objets du
// moteur universel (une alerte porte soit contrat_id, soit objet_id).
export default function Alertes() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [objets, setObjets] = useState<Objet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('active');
  const { toastEl, ok, err } = useToast();

  const charger = () => {
    Promise.all([api.alertes.list(), api.contrats.list(), api.objets.list()])
      .then(([a, c, o]) => { setAlertes(a); setContrats(c); setObjets(o); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  const nom = (a: Alerte) => a.contrat_id
    ? (contrats.find((c) => c.id === a.contrat_id)?.titre || `Contrat #${a.contrat_id}`)
    : (objets.find((o) => o.id === a.objet_id)?.titre || `Objet #${a.objet_id}`);
  const lien = (a: Alerte) => a.contrat_id ? `/contrats/${a.contrat_id}?onglet=alertes` : `/objets/${a.objet_id}?onglet=alertes`;

  const liste = useMemo(() => {
    let l = filtre === 'toutes' ? [...alertes] : alertes.filter((a) => (filtre === 'active' ? a.statut === 'active' : a.statut !== 'active'));
    const ordre = { critique: 0, attention: 1, info: 2 };
    return l.sort((a, b) => (ordre[a.gravite as keyof typeof ordre] ?? 3) - (ordre[b.gravite as keyof typeof ordre] ?? 3));
  }, [alertes, filtre]);

  const statut = async (a: Alerte, s: string) => {
    try {
      await api.alertes.update(a.id, { statut: s });
      if (a.contrat_id) await logAction(a.contrat_id, 'alerte_statut', 'alerte', a.id, { de: a.statut, vers: s });
      else await logActionObjet(a.objet_id, 'alerte_statut', 'alerte', a.id, { de: a.statut, vers: s });
      charger();
      ok('Alerte mise à jour.');
    } catch (e: any) { err(e.message); }
  };

  if (loading) return <Spinner label="Chargement des alertes…" />;

  return (
    <div className="space-y-5">
      {toastEl}
      <div>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Centre des alertes</h1>
        <p className="mt-1 text-sm text-muted">
          {alertes.filter((a) => a.statut === 'active').length} active(s) · {alertes.filter((a) => a.statut === 'active' && a.gravite === 'critique').length} critique(s).
          Les alertes signalent des faits à vérifier — jamais des conclusions juridiques.
        </p>
      </div>

      <Prudence compact />

      <div className="flex gap-2">
        {[{ v: 'active', l: 'Actives' }, { v: 'traitees', l: 'Traitées' }, { v: 'toutes', l: 'Toutes' }].map((f) => (
          <button key={f.v} onClick={() => setFiltre(f.v)} className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-medium transition ${filtre === f.v ? 'bg-fuchsia text-white' : 'bg-white text-muted hover:text-ink'}`}>
            {f.l}
          </button>
        ))}
      </div>

      {liste.length === 0 ? (
        <Empty icon={<Bell className="h-8 w-8" />} titre="Aucune alerte" texte="Ouvrez un contrat et lancez l’analyse de cohérence pour générer des alertes." />
      ) : (
        <div className="space-y-2.5">
          {liste.map((a) => (
            <div key={a.id}>
              <CarteAlerte gravite={a.gravite} titre={a.titre || ''} message={a.message || ''}
                meta={nom(a)}
                piste={a.action_suggeree}
                actions={<>
                  <Link to={lien(a)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-fuchsia hover:bg-fuchsia-100">{a.contrat_id ? 'Ouvrir le contrat' : 'Ouvrir l’objet'}</Link>
                  {a.statut === 'active' && <>
                    <button onClick={() => statut(a, 'reconnue')} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-white"><Eye className="h-3.5 w-3.5" /> Reconnaître</button>
                    <button onClick={() => statut(a, 'resolue')} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-success hover:bg-success-soft"><Check className="h-3.5 w-3.5" /> Résoudre</button>
                    <button onClick={() => statut(a, 'ignoree')} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-faint hover:bg-white"><XCircle className="h-3.5 w-3.5" /> Ignorer</button>
                  </>}
                  {a.statut !== 'active' && (
                    <button onClick={() => statut(a, 'active')} className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs text-fuchsia hover:underline">Réactiver</button>
                  )}
                </>}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

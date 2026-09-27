// ============================================================
// TIMELINE — le « système nerveux » de PACTE. Un seul système,
// réutilisé par le contrat (FicheContrat) ET par tout objet du moteur
// universel (FicheObjet) : AVANT / PENDANT / APRÈS, jamais de logique
// dupliquée par univers.
// ============================================================
export type ItemTimeline = {
  date: string;
  type: 'engagement' | 'echeance' | 'evenement';
  titre: string;
  detail: string;
  onglet: string;
  etat: 'fait' | 'attention' | 'critique';
  nbPreuves: number;
};

export function decouperPhases(items: ItemTimeline[], dateDebut: string | null, dateFin: string | null) {
  const debut = dateDebut ? new Date(dateDebut).getTime() : null;
  const fin = dateFin ? new Date(dateFin).getTime() : null;
  const avant: ItemTimeline[] = [];
  const pendant: ItemTimeline[] = [];
  const apres: ItemTimeline[] = [];
  for (const it of items) {
    const t = new Date(it.date).getTime();
    if (debut !== null && t < debut) avant.push(it);
    else if (fin !== null && t > fin) apres.push(it);
    else pendant.push(it);
  }
  return { avant, pendant, apres };
}

const TYPE_LABEL: Record<ItemTimeline['type'], string> = { engagement: 'Engagement', echeance: 'Échéance', evenement: 'Événement' };

export function jourMois(d: string): string {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(dt);
}

export function annee(d: string): string {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', { year: 'numeric' }).format(dt);
}

export function PhaseTimeline({ label, items, vide, changerOnglet }: { label: string; items: ItemTimeline[]; vide: string; changerOnglet: (o: string) => void }) {
  return (
    <>
      <p className="timeline-phase">{label}</p>
      {items.length === 0 ? (
        <p className="pb-4 pl-[78px] text-xs text-faint">{vide}</p>
      ) : (
        <div className="relative">
          <span className="timeline-line" />
          {items.map((it, i) => (
            <div key={`${it.type}-${i}`} className="timeline-row">
              <div className="timeline-time">{jourMois(it.date)}<small>{annee(it.date)}</small></div>
              <span className={`timeline-node ${it.etat === 'fait' ? 'node-fait' : it.etat === 'critique' ? 'node-critique' : 'node-attention'}`} />
              <div className="timeline-content">
                <button onClick={() => changerOnglet(it.onglet)} className="timeline-card w-full cursor-pointer text-left">
                  <div className="timeline-card-top">
                    <h3 className="text-ink">{it.titre}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-faint">{TYPE_LABEL[it.type]}</span>
                  </div>
                  {it.detail && <p>{it.detail}</p>}
                  {it.nbPreuves > 0 && <p className="mt-1 text-fuchsia">{it.nbPreuves} preuve(s) liée(s)</p>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

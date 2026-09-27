import { ShieldCheck, XCircle, Eye, Lock, Scale, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Prudence } from '../components/ui';

const PEUT = [
  'Résumer un contrat en langage clair et lister ses engagements',
  'Détecter échéances, montants, clauses sensibles et dépendances',
  'Calculer la santé du contrat et proposer des points de vigilance',
  'Organiser une situation (« il vient de se passer quelque chose ») en faits, sources, clauses et preuves',
  'Proposer des scénarios « que se passe-t-il si… ? » avec un niveau de confiance affiché',
  'Rédiger des projets de clauses, d’engagements ou d’avenants — toujours à valider par vous',
  'Préparer un dossier structuré (chronologie, preuves, points contestés) en cas de désaccord',
];
const NE_PEUT_PAS = [
  'Signer, accepter ou engager juridiquement qui que ce soit à votre place',
  'Modifier seule un engagement, un montant ou une échéance sans validation humaine',
  'Affirmer qu’une clause est violée ou qu’une partie est en faute',
  'Promettre une issue judiciaire ou un gain (« vous allez gagner »)',
  'Inventer une loi, une jurisprudence, une clause ou une preuve inexistante',
  'Supprimer ou altérer une preuve versée au dossier',
  'Se substituer à un avocat, un notaire ou un professionnel du droit',
];

export default function ReglesIA() {
  return (
    <div className="space-y-8">
      <div className="page-title">
        <div>
          <p className="eyebrow">Gouvernance</p>
          <h1>L'IA assiste. <em style={{ color: 'var(--color-fuchsia)', fontStyle: 'normal' }}>Elle ne décide jamais.</em></h1>
          <p>PACTE définit strictement le périmètre de son copilote IA. Toute proposition est tracée, versionnée
            et réversible. Toute action engageante exige une validation humaine identifiée.</p>
        </div>
      </div>

      <div className="two-col">
        <div className="card" style={{ borderTop: '3px solid var(--color-success)' }}>
          <div className="flex items-center gap-2 font-display" style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-success)' }}>
            <ShieldCheck size={19} /> Ce que l'IA peut faire
          </div>
          <ul className="mt-4 space-y-2.5">
            {PEUT.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink"><Eye size={15} style={{ color: 'var(--color-success)', marginTop: 3, flexShrink: 0 }} /> {p}</li>
            ))}
          </ul>
        </div>
        <div className="card" style={{ borderTop: '3px solid var(--color-critique)' }}>
          <div className="flex items-center gap-2 font-display" style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-critique)' }}>
            <XCircle size={19} /> Ce que l'IA ne peut pas faire
          </div>
          <ul className="mt-4 space-y-2.5">
            {NE_PEUT_PAS.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink"><Lock size={15} style={{ color: 'var(--color-critique)', marginTop: 3, flexShrink: 0 }} /> {p}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 font-display" style={{ fontSize: 16, fontWeight: 800 }}>
          <Scale size={17} /> Principes opposables
        </div>
        <div className="form-three mt-3">
          {[
            ['Humain aux commandes', 'Aucune mutation du contrat vivant sans clic humain tracé dans l’historique.'],
            ['Traçabilité totale', 'Toute suggestion IA est une entrée d’historique horodatée, auteur « PACTE IA ».'],
            ['Droit au désaccord', 'Refuser une suggestion IA n’altère jamais la santé calculée du contrat.'],
            ['Vocabulaire prudent', '« Situation à vérifier », « information manquante » — jamais « vous avez raison ».'],
            ['Sources citées', 'Toute analyse de document cite l’extrait source de chaque proposition.'],
            ['Droit non universel', 'Le droit applicable dépend du pays choisi ; à défaut, l’IA le signale explicitement.'],
          ].map(([t, d], i) => (
            <div key={i} className="info-box"><strong>{t}</strong><p className="mt-1 text-xs text-muted">{d}</p></div>
          ))}
        </div>
      </div>

      <Prudence />

      <div className="card" style={{ background: 'var(--color-ink)', color: '#fff', border: 'none' }}>
        <p className="eyebrow" style={{ color: '#f2a9c9' }}>Pour aller plus loin</p>
        <h2 className="font-display mt-2" style={{ fontSize: 22, color: '#fff' }}>Voir le moteur en action</h2>
        <p className="mt-2 text-sm" style={{ color: '#c7c1c5' }}>Créez un pacte, décrivez une situation, laissez le moteur de cohérence organiser les faits — sans jamais trancher à votre place.</p>
        <Link to="/nouveau" className="btn btn-white mt-4" style={{ display: 'inline-flex' }}>Créer un pacte <ArrowRight size={15} /></Link>
      </div>
    </div>
  );
}

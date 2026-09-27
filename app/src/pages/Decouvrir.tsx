import { Link } from 'react-router-dom';
import { ArrowUpRight, LayoutDashboard } from 'lucide-react';
import { UNIVERS } from '../lib/univers';

// LANDING GLOBALE — le seuil éditorial de PACTE : émotion et projection,
// avant la précision du Dashboard. Même identité visuelle, densité plus
// basse. Ne remplace pas « / » (Dashboard, l'accueil opérationnel des
// utilisateurs déjà engagés) afin de ne rien casser de l'existant :
// cette page est le point d'entrée « découverte », lié depuis la barre
// latérale (« Découvrir PACTE ») et depuis chaque univers.
export default function Decouvrir() {
  const apercu = UNIVERS.slice(0, 6);

  return (
    <div className="space-y-10">
      <div className="editorial-hero reveal">
        <span className="eyebrow">PACTE — moteur universel de pactes et contrats vivants</span>
        <h1>Comprendre <em>ce qui vous lie.</em></h1>
        <div className="editorial-hero-lines">
          <span>Structurer <strong>ce qui existe.</strong></span>
          <span>Documenter <strong>ce qui s’est passé.</strong></span>
          <span>Explorer <strong>ce qui pourrait arriver.</strong></span>
          <span>Décider <strong>humainement.</strong></span>
        </div>
        <p className="lede" style={{ marginTop: 22 }}>
          Un contrat, un projet, une œuvre, un bien, une mission, un dossier : PACTE relie les personnes qui s’engagent,
          date ce qui se passe, conserve les preuves, observe les données et éclaire vos décisions — sans jamais
          décider à votre place.
        </p>
        <div className="hero-actions">
          <Link to="/univers" className="btn btn-pink">Découvrir les univers <ArrowUpRight className="h-4 w-4" /></Link>
          <Link to="/" className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,.3)', color: '#fff' }}>
            <LayoutDashboard className="h-4 w-4" /> Ouvrir mon espace PACTE
          </Link>
        </div>
      </div>

      <div>
        <div className="section-heading">
          <div>
            <h2>Quelques univers, un seul moteur</h2>
            <p>{UNIVERS.length} configurations du même moteur — Objet, Relation, Engagement, Événement, Preuve, Donnée, Analyse, Scénario, Décision.</p>
          </div>
          <Link to="/univers" className="link-more">Voir les {UNIVERS.length} univers <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="gate-grid">
          {apercu.map((u, i) => (
            <Link key={u.code} to={`/univers/${u.code}`} className="gate-panel reveal" style={{ ['--u-color' as any]: u.couleur, animationDelay: `${i * 40}ms` }}>
              <span className="gate-panel-media">
                {u.media?.cover ? <img src={u.media.cover} alt={u.media.alt || u.nom} loading="lazy" /> : <span className="gate-panel-fallback" data-letter={u.nom[0]} aria-hidden="true" />}
              </span>
              <span className="gate-panel-scrim" aria-hidden="true" />
              <span className="gate-panel-body">
                <h3>{u.nom}</h3>
                <p>{u.manifeste}</p>
                <span className="gate-panel-cta">Explorer <ArrowUpRight className="h-3.5 w-3.5" /></span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="notice">
        <p>
          <strong>Ce que PACTE ne fait jamais.</strong> Montrer, structurer, relier, vérifier, signaler, analyser, simuler,
          anticiper — oui. Arbitrer, condamner, garantir, manipuler ou décider à votre place — jamais. Les informations
          juridiques non vérifiées restent signalées comme telles.
        </p>
      </div>
    </div>
  );
}

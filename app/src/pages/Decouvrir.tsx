import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, LayoutDashboard } from 'lucide-react';
import { UNIVERS, universParCode } from '../lib/univers';

// LANDING GLOBALE — le seuil éditorial de PACTE : émotion et projection,
// avant la précision du Dashboard. Ne remplace pas « / » (Dashboard,
// l'accueil opérationnel des utilisateurs déjà engagés) : cette page est
// le point d'entrée « découverte », lié depuis la barre latérale et
// depuis chaque univers.
//
// Phase 6 — pivot de direction artistique (pas de reconstruction
// structurelle) : la page reste HERO → PROBLÈME → CONCEPT → UNIVERS →
// MOTEUR → EXEMPLE → ENTRER, mais chaque section devient une composition
// éditoriale plein cadre portée par la photographie et la typographie —
// plus de cartes, badges ou pastilles de couleur par univers (palette
// stricte noir / blanc / photo, cf. décision produit). Le fuchsia n'est
// conservé qu'à deux endroits très ponctuels : le mot « Décision » dans
// le moteur, et le bouton d'entrée final.
//
// Vidéo de hero : une tentative a été envisagée (plan cinématographique
// abstrait, silencieux, en boucle) mais aucun outil de génération vidéo
// n'est disponible dans cet environnement de travail — conformément à la
// consigne explicite de repli, le hero utilise donc une image fixe,
// générée par IA et documentée comme telle (voir credit sous l'image).

const MOTEUR = [
  { label: 'Identité' }, { label: 'Objet' }, { label: 'Relation' },
  { label: 'Engagement' }, { label: 'Événement' }, { label: 'Preuve' },
  { label: 'Donnée' }, { label: 'Analyse' }, { label: 'Scénario' },
  { label: 'Décision' },
];

// À titre pédagogique uniquement (voir mention explicite sur chaque
// bloc) : aucun de ces éléments ne correspond à une personne, une œuvre
// ou un montant réel.
const EXEMPLES_MOTEUR = [
  { univers: 'Art', chaine: ['Artiste', 'Œuvre', 'Propriétaire', 'Exposition', 'Preuve', 'Expertise', 'Données de valeur', 'Scénarios', 'Décision humaine'] },
  { univers: 'Projet', chaine: ['Personnes', 'Organisation', 'Engagements', 'Budget', 'Échéances', 'Événements', 'Preuves', 'Risques', 'Scénarios', 'Décision'] },
];

const PROBLEME_ELEMENTS = ['des personnes', 'des engagements', 'des dates', 'des événements', 'des preuves', 'des données', 'des risques', 'des conséquences', 'des décisions'];

// Curation éditoriale volontairement restreinte pour le scroll immersif —
// pas les 19 univers en même temps (voir grille complète sur /univers) :
// trois mondes visuellement très différents pour montrer l'amplitude du
// moteur (matière / scène / chantier).
const SPREADS = ['art', 'musique', 'projets'];

export default function Decouvrir() {
  const spreads = SPREADS.map((c) => universParCode(c));
  const autres = UNIVERS.filter((u) => !SPREADS.includes(u.code));

  return (
    <div>
      {/* ---------- HERO plein cadre ---------- */}
      <section className="ed-hero">
        <div className="ed-hero-media">
          <img src="/hero/pacte-hero.jpg" alt="" role="presentation" fetchPriority="high" decoding="async" />
        </div>
        <div className="ed-hero-scrim" aria-hidden="true" />
        <div className="ed-hero-content">
          <p className="ed-kicker">PACTE</p>
          <h1>Comprendre ce qui vous lie.</h1>
          <p className="ed-hero-sub">
            Un contrat, une œuvre, un projet, un bien, une mission : PACTE relie les personnes qui s’engagent,
            date ce qui se passe, conserve les preuves, observe les données et éclaire vos décisions — sans jamais
            décider à votre place.
          </p>
        </div>
        <span className="ed-scrollcue" aria-hidden="true">Faire défiler</span>
      </section>

      {/* ---------- PROBLÈME ---------- */}
      <section className="ed-statement ed-statement-dark">
        <div className="ed-statement-inner">
          <p className="ed-kicker">Le problème</p>
          <h2>Un contrat n’est jamais seulement un PDF.</h2>
          <p>
            Signer un papier ne suffit pas à comprendre une situation. Un contrat — comme une œuvre, un projet ou un
            patrimoine — implique toujours plus que ce qu’il tient sur une page : {PROBLEME_ELEMENTS.join(', ')}.
            La plupart des outils ne capturent que le papier. Ils oublient la situation.
          </p>
        </div>
      </section>

      {/* ---------- CONCEPT ---------- */}
      <section className="ed-statement ed-statement-light">
        <div className="ed-statement-inner">
          <p className="ed-kicker">Le concept</p>
          <h2>PACTE n’est pas un outil de contrats. C’est un moteur pour comprendre ce qui vous lie.</h2>
          <p>
            Comprendre, explorer, entrer dans un univers, structurer, documenter, analyser, explorer des scénarios,
            décider humainement. C’est le même chemin, quel que soit le domaine — parce que ce n’est pas le domaine
            qui structure la situation, c’est le moteur.
          </p>
        </div>
      </section>

      {/* ---------- UNIVERS — scroll magazine ---------- */}
      {spreads.map((u) => (
        <Link key={u.code} to={`/univers/${u.code}`} className="ed-spread">
          <div className="ed-spread-media">
            {u.media?.cover
              ? <img src={u.media.cover} alt={u.media.alt || u.nom} loading="lazy" />
              : <span className="univers-hero-fallback" aria-hidden="true" />}
          </div>
          <div className="ed-spread-scrim" aria-hidden="true" />
          <div className="ed-spread-body">
            <span className="ed-spread-eyebrow">Univers · {u.nom}</span>
            <h2>{u.manifeste}</h2>
            <span className="ed-spread-cta">Explorer l’univers {u.nom} <ArrowUpRight className="h-3.5 w-3.5" /></span>
          </div>
          {u.media?.credit && <span className="ed-spread-credit">{u.media.credit}</span>}
        </Link>
      ))}

      <Link to="/univers" className="ed-more">
        Voir les {UNIVERS.length} univers — {autres.slice(0, 4).map((u) => u.nom).join(', ')}… <ArrowUpRight className="h-4 w-4" />
      </Link>

      {/* ---------- MOTEUR — composition typographique ---------- */}
      <section className="ed-moteur">
        <div className="ed-moteur-intro">
          <p className="ed-kicker">Le moteur</p>
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: 'clamp(26px,3.6vw,40px)', letterSpacing: '-.03em', lineHeight: 1.15, margin: '14px 0 16px' }}>
            Un seul moteur. Dix mouvements.
          </h2>
          <p style={{ color: 'rgba(255,255,255,.68)', fontSize: 14.5, lineHeight: 1.7 }}>
            Quel que soit l’univers, PACTE observe et organise une situation dans le temps selon la même mécanique.
          </p>
        </div>
        <div className="ed-moteur-list">
          {MOTEUR.map((m) => (
            <p key={m.label} className={`ed-moteur-item ${m.label === 'Décision' ? 'is-decision' : ''}`}>{m.label}</p>
          ))}
        </div>
        <div className="notice notice-compact" style={{ maxWidth: 720, margin: '56px auto 0' }}>
          <p>
            <strong>Ce que PACTE ne fait jamais.</strong> Montrer, structurer, relier, vérifier, signaler, analyser,
            simuler, anticiper — oui. Arbitrer, condamner, garantir, manipuler ou décider à votre place — jamais.
          </p>
        </div>
      </section>

      {/* ---------- EXEMPLE ---------- */}
      <section className="ed-example">
        <div className="ed-example-intro">
          <p className="ed-kicker" style={{ color: 'var(--n-secondary)' }}>Exemple</p>
          <h2>Deux mondes très différents, la même mécanique.</h2>
        </div>
        <div className="ed-example-grid">
          {EXEMPLES_MOTEUR.map((ex) => (
            <div className="ed-example-chain" key={ex.univers}>
              <span className="ed-example-tag">Exemple pédagogique · pas une donnée réelle</span>
              <h3>{ex.univers}</h3>
              <p className="ed-example-flow">
                {ex.chaine.map((step, i) => (
                  <Fragment key={step}>
                    {step}{i < ex.chaine.length - 1 && <span className="sep" aria-hidden="true">→</span>}
                  </Fragment>
                ))}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- ENTRER DANS PACTE ---------- */}
      <section className="ed-cta">
        <div className="ed-cta-inner">
          <p className="ed-kicker" style={{ color: 'rgba(255,255,255,.5)' }}>Entrer dans PACTE</p>
          <h2>Vous avez compris le principe. Choisissez un univers, ou entrez directement dans votre espace.</h2>
          <p>
            À partir d’ici, vous quittez la présentation : chaque action ouvre le vrai moteur PACTE — vos objets,
            vos relations, vos preuves, vos décisions.
          </p>
          <div className="ed-cta-actions">
            <Link to="/univers" className="ed-btn-primary">Choisir un univers <ArrowUpRight className="h-4 w-4" /></Link>
            <Link to="/" className="ed-link-plain"><LayoutDashboard className="h-4 w-4" /> Ouvrir mon espace PACTE</Link>
          </div>
          <div className="notice notice-compact">
            <p>PACTE explore des futurs possibles à partir des informations disponibles ; il ne prétend jamais connaître le futur.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, LayoutDashboard } from 'lucide-react';
import { UNIVERS, universParCode } from '../lib/univers';

// LANDING GLOBALE — le seuil éditorial de PACTE : émotion et projection,
// avant la précision du Dashboard. Même identité visuelle, densité plus
// basse. Ne remplace pas « / » (Dashboard, l'accueil opérationnel des
// utilisateurs déjà engagés) afin de ne rien casser de l'existant :
// cette page est le point d'entrée « découverte », lié depuis la barre
// latérale (« Découvrir PACTE ») et depuis chaque univers.
//
// Structure éditoriale demandée (Phase 5) :
// HERO → PROBLÈME → CONCEPT → UNIVERS → MOTEUR → EXEMPLE → ENTRER DANS PACTE.
// Chaque section est un écran qui respire ; aucune carte SaaS générique,
// aucune fausse donnée présentée comme réelle (les exemples du moteur
// sont explicitement marqués comme démonstration pédagogique).

// Le cœur du moteur — la même séquence, quel que soit l'univers.
const MOTEUR = [
  { label: 'Identité', desc: 'Qui est concerné : une personne, une structure, une entité.' },
  { label: 'Objet', desc: 'Ce dont il s’agit : un contrat, une œuvre, un bien, un projet.' },
  { label: 'Relation', desc: 'Comment les identités sont liées entre elles.' },
  { label: 'Engagement', desc: 'Ce qui a été promis, et à quelles conditions.' },
  { label: 'Événement', desc: 'Ce qui s’est réellement passé, daté.' },
  { label: 'Preuve', desc: 'Ce qui l’atteste : document, photo, signature.' },
  { label: 'Donnée', desc: 'Ce qui est observé et mesuré dans le temps.' },
  { label: 'Analyse', desc: 'Ce que ces données révèlent, sans jugement.' },
  { label: 'Scénario', desc: 'Ce qui pourrait arriver, à partir de ce qui est connu.' },
  { label: 'Décision', desc: 'Ce que vous choisissez de faire — humainement.' },
];

// Deux mondes très différents, la même mécanique — à titre pédagogique
// uniquement (voir mention « Exemple » sur chaque bloc). Aucun de ces
// éléments ne correspond à un objet, une personne ou un montant réel.
const EXEMPLES_MOTEUR = [
  { univers: 'Art', chaine: ['Artiste', 'Œuvre', 'Propriétaire', 'Exposition', 'Preuve', 'Expertise', 'Données de valeur', 'Scénarios', 'Décision humaine'] },
  { univers: 'Projet', chaine: ['Personnes', 'Organisation', 'Engagements', 'Budget', 'Échéances', 'Événements', 'Preuves', 'Risques', 'Scénarios', 'Décision'] },
];

const PROBLEME_ELEMENTS = ['des personnes', 'des engagements', 'des dates', 'des événements', 'des preuves', 'des données', 'des risques', 'des conséquences', 'des décisions'];
const PROBLEME_DOMAINES = ['une œuvre', 'un projet', 'une carrière', 'un patrimoine', 'une entreprise', 'un actif', 'une mission', 'une relation professionnelle'];

export default function Decouvrir() {
  const vedette = universParCode('art');
  const apercu = UNIVERS
    .filter((u) => u.code !== vedette.code)
    .sort((a, b) => Number(!!b.media?.cover) - Number(!!a.media?.cover))
    .slice(0, 5);

  return (
    <div className="space-y-10">
      {/* ---------- HERO ---------- */}
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

      {/* ---------- PROBLÈME ---------- */}
      <div className="editorial-band reveal">
        <span className="eyebrow">Le problème</span>
        <h2>Un contrat n’est jamais seulement un PDF.</h2>
        <p style={{ maxWidth: '64ch' }}>
          Signer un papier ne suffit pas à comprendre une situation. Un contrat — comme une œuvre, un projet ou un
          patrimoine — implique toujours plus que ce qu’il tient sur une page :
        </p>
        <ul className="probleme-list">
          {PROBLEME_ELEMENTS.map((e) => <li key={e}>{e}</li>)}
        </ul>
        <p style={{ maxWidth: '64ch', marginTop: 22 }}>
          La plupart des outils ne capturent que le papier. Ils oublient la situation. Et la même logique vaut pour{' '}
          {PROBLEME_DOMAINES.join(', ')}.
        </p>
      </div>

      {/* ---------- CONCEPT ---------- */}
      <div className="reveal" style={{ maxWidth: '72ch' }}>
        <span className="eyebrow">Le concept</span>
        <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 800, fontSize: 'clamp(24px,3vw,36px)', letterSpacing: '-.03em', lineHeight: 1.15, margin: '10px 0 16px' }}>
          PACTE n’est pas un outil de contrats. C’est un moteur pour comprendre ce qui vous lie.
        </h2>
        <p className="lede">
          Comprendre → explorer → entrer dans un univers → structurer → documenter → analyser → explorer des
          scénarios → décider humainement. C’est le même chemin, quel que soit le domaine — parce que ce n’est pas le
          domaine qui structure la situation, c’est le moteur.
        </p>
      </div>

      {/* ---------- UNIVERS ---------- */}
      <div>
        <Link to={`/univers/${vedette.code}`} className="feature-panel reveal" style={{ ['--u-color' as any]: vedette.couleur }}>
          <span className="feature-panel-media">
            {vedette.media?.cover ? <img src={vedette.media.cover} alt={vedette.media.alt || vedette.nom} fetchPriority="high" decoding="async" /> : <span className="feature-panel-fallback" />}
          </span>
          {vedette.media?.credit && <span className="feature-panel-credit">{vedette.media.credit}</span>}
          <span className="feature-panel-body">
            <span className="eyebrow">Univers en avant · {vedette.nom}</span>
            <h2>{vedette.manifeste}</h2>
            <p>{vedette.description}</p>
            <span className="gate-panel-cta">Explorer l’univers {vedette.nom} <ArrowUpRight className="h-3.5 w-3.5" /></span>
          </span>
        </Link>

        <div className="section-heading" style={{ marginTop: 28 }}>
          <div>
            <h2>Un monde différent à chaque fois, le même moteur en dessous</h2>
            <p>{UNIVERS.length} univers configurent le même moteur — Objet, Relation, Engagement, Événement, Preuve, Donnée, Analyse, Scénario, Décision — avec le vocabulaire de leur domaine.</p>
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

      {/* ---------- MOTEUR ---------- */}
      <div className="editorial-band reveal">
        <span className="eyebrow">Le moteur</span>
        <h2>Un seul moteur. Dix mouvements.</h2>
        <p style={{ maxWidth: '64ch', marginBottom: 8 }}>
          Quel que soit l’univers, PACTE observe et organise une situation dans le temps selon la même mécanique :
        </p>
        <div className="engine-seq">
          <div className="engine-seq-row">
            {MOTEUR.map((m, i) => (
              <div className="engine-seq-step" key={m.label}>
                <span className="engine-seq-index">{String(i + 1).padStart(2, '0')}</span>
                <span className="engine-seq-dot" aria-hidden="true" />
                <span className="engine-seq-label">{m.label}</span>
                <span className="engine-seq-desc">{m.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="notice">
        <p>
          <strong>Ce que PACTE ne fait jamais.</strong> Montrer, structurer, relier, vérifier, signaler, analyser, simuler,
          anticiper — oui. Arbitrer, condamner, garantir, manipuler ou décider à votre place — jamais. PACTE explore des
          futurs possibles à partir des informations disponibles ; il ne prétend jamais connaître le futur.
        </p>
      </div>

      {/* ---------- EXEMPLE ---------- */}
      <div className="reveal">
        <span className="eyebrow">Exemple</span>
        <h2 style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 800, fontSize: 'clamp(22px,2.6vw,30px)', letterSpacing: '-.03em', margin: '10px 0 20px' }}>
          Deux mondes très différents, la même mécanique.
        </h2>
        <div className="space-y-4">
          {EXEMPLES_MOTEUR.map((ex) => (
            <div className="demo-chain" key={ex.univers}>
              <span className="demo-chain-tag">Exemple pédagogique · pas une donnée réelle</span>
              <h3>{ex.univers}</h3>
              <div className="demo-chain-steps">
                {ex.chaine.map((step, i) => (
                  <Fragment key={step}>
                    <span className="node">{step}</span>
                    {i < ex.chaine.length - 1 && <span className="arrow" aria-hidden="true">→</span>}
                  </Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- ENTRER DANS PACTE ---------- */}
      <div className="editorial-band reveal" style={{ textAlign: 'center' }}>
        <span className="eyebrow">Entrer dans PACTE</span>
        <h2>Vous avez compris le principe. Choisissez un univers, ou entrez directement dans votre espace.</h2>
        <p style={{ maxWidth: '58ch', margin: '0 auto 26px' }}>
          À partir d’ici, vous quittez la présentation : chaque action ouvre le vrai moteur PACTE — vos objets, vos
          relations, vos preuves, vos décisions.
        </p>
        <div className="hero-actions" style={{ justifyContent: 'center' }}>
          <Link to="/univers" className="btn btn-pink">Choisir un univers <ArrowUpRight className="h-4 w-4" /></Link>
          <Link to="/" className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,.3)', color: '#fff' }}>
            <LayoutDashboard className="h-4 w-4" /> Ouvrir mon espace PACTE
          </Link>
        </div>
      </div>
    </div>
  );
}

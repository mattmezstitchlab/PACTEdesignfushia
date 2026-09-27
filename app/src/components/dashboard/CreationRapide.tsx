// ============================================================
// PACTE — Section « Créer un nouveau pacte » du Pilotage (Dashboard).
//
// Historique : cette entrée a d'abord été un champ de texte libre
// (comprendre.ts, retiré), puis un grand bandeau « hero » éditorial avec
// photo pleine largeur. Retiré à son tour (audit du 27/09, retour
// utilisateur direct) : /decouvrir et /univers ont déjà ce traitement
// éditorial avec visuel plein cadre — le dupliquer sur le Pilotage,
// dont le rôle est le suivi opérationnel (statistiques, contrats,
// alertes), créait un doublon et ne correspondait pas à la page.
// Ici, une simple section fonctionnelle parmi les autres du Pilotage :
// un titre, une phrase, des cartes de choix — sans photo ni habillage
// éditorial. Le clic va vers l'assistant /nouveau déjà existant, qui
// pose des questions précises au lieu de deviner.
// ============================================================
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { MODELES } from '../../lib/modeles';
import { SectionTitre } from '../ui';

export default function CreationRapide() {
  const nav = useNavigate();

  return (
    <section>
      <SectionTitre
        titre="Créer un nouveau pacte"
        sous="Choisissez la situation la plus proche de la vôtre. Vous répondrez ensuite à quelques questions simples — rien n'est créé sans que vous l'ayez vérifié et validé."
      />
      <div className="pacte-choix-grid" role="list">
        {MODELES.map((m) => (
          <button
            key={m.code}
            type="button"
            role="listitem"
            className="pacte-choix-carte"
            onClick={() => nav(`/nouveau?modele=${m.code}`)}
          >
            <span className="pacte-choix-nom">{m.nom}</span>
            <p className="pacte-choix-texte">{m.description}</p>
            <ArrowRight className="pacte-choix-fleche h-4 w-4" />
          </button>
        ))}
      </div>
    </section>
  );
}

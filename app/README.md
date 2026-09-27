# PACTE — moteur universel de pactes et contrats vivants

PACTE unifie **PACTEdesignfushia** (identité visuelle éditoriale : noir / blanc /
ivoire + fuchsia), **PACTEcontractos** (modèle de données ContractOS) et
l'ancien PACTE (fonctionnalités historiques utiles) en **une seule application**.

## Ce que fait PACTE

- **Un moteur unique**, pas trois applications : IDENTITÉ (annuaire des
  parties) → RELATION → ENGAGEMENT → CONDITIONS → ÉVÉNEMENT → ÉCHÉANCE →
  PREUVE → ALERTE → ACTION → HISTORIQUE → DOSSIER.
- **Le contrat** (`Contrat` + `ContratPartie` + `Clause`) est le cas
  particulier historique de ce moteur, entièrement conservé et non modifié
  dans son fonctionnement.
- **L'Objet** (`Objet` + `Relation` + `Metrique` + `Decision`) est le cas
  général : projet, œuvre, actif, bien, mission, dossier… — pour tout ce qui
  n'est pas structuré comme un contrat mais mérite le même suivi (relations,
  engagements, échéances, événements, preuves, alertes, scénarios).
- **Univers** (`src/lib/univers.ts`) : 19 configurations du même moteur
  (Personnel, Professionnel, Entreprise, Projets, Spectacle & intermittence,
  Art, Musique, Audiovisuel, Propriété intellectuelle, Immobilier, Biens &
  actifs, Commerce, Associations, Recherche, Formation & carrière, Voyage,
  Assurance, Financement, Finance & marchés). Un univers ne fait que suggérer
  des libellés et des types d'objets : il ne détermine jamais l'architecture.
- **Timeline** (`src/components/timeline/Timeline.tsx`) : système unique
  AVANT / PENDANT / APRÈS, réutilisé par le contrat et par l'objet.
- **IA copilote uniquement** : extraire, résumer, structurer, comparer,
  classer, expliquer, proposer, simuler — jamais inventer un fait, une preuve,
  une loi ou une décision à la place de l'utilisateur.

## Développement

```bash
npm install
npm run dev      # front + API locale (fichier JSON, server/vitePlugin.js)
npm run build    # tsc -b && vite build
npm run start     # sert le build de production (server/main.js)
```

Le backend de développement est un petit serveur générique
(`server/handlers.js`, `server/store.js`) qui persiste dans
`server/data/db.json` (ignoré par git). Le même contrat REST est prévu pour
être adossé à Supabase en production (`src/lib/api.ts`).

## Positionnement

PACTE peut **montrer / structurer / relier / vérifier / signaler / analyser /
simuler / anticiper**. Il ne peut jamais **arbitrer, condamner, garantir,
manipuler ou décider à la place de l'utilisateur**. Toute information
juridique non vérifiée est signalée comme telle.

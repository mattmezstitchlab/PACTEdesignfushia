# GAIA × PACTE — Architecture Blueprint v1

**Statut : hypothèse de travail, non codée, non validée définitivement.**
**Aucun code n'a été modifié pour produire ce document.**
Ancré dans le code réellement présent au commit `ae0ac66` (`app/src/lib/types.ts`, `univers.ts`, `coherence.ts`, `analyse.ts`, `api.ts`, `components/timeline/Timeline.tsx`, `App.tsx`).

---

## 1. Vision

PACTE n'est plus « une application de gestion de contrats ». C'est déjà, dans le code existant, un **moteur universel** qui structure ce qui relie des personnes, des organisations, des objets, des engagements, des événements, des documents, des preuves et des décisions dans le temps — le contrat n'étant qu'un cas particulier de cette structure (voir §17).

Ce que ce blueprint ajoute n'est pas un nouveau moteur, mais un **nom et une frontière** pour la couche qui, au-dessus de ce moteur, comprend le contexte, relie les faits entre eux et propose des lectures — sans jamais décider à la place de l'humain.

**Principe directeur, non négociable :**

> GAIA comprend. PACTE structure. L'humain décide.
> PACTE ne décide pas du futur — il rend le présent compréhensible et les futurs possibles explorables.

MARIAGE est la première expérience concrète qui doit prouver que ce moteur généralise réellement, sans réécriture. WEDMAG est la porte éditoriale d'entrée vers cette expérience, jamais un système parallèle.

**Règle absolue reconduite ici sans exception :** ONE ENGINE — MANY EXPERIENCES. Aucun deuxième PACTE, aucun deuxième moteur mariage, aucun deuxième système de personnes/contrats/timeline, aucune duplication Wedmag ↔ PACTE.

---

## 2. Vocabulaire

| Terme | Définition dans cette architecture |
|---|---|
| **GAIA** | Couche de compréhension, de contexte, de mémoire et de mise en relation temporelle. Ne stocke pas une deuxième vérité ; lit et interprète les entités PACTE, propose, ne décide jamais. |
| **PACTE** | Le moteur opérationnel et transactionnel : identité, objet, relation, engagement, événement, document, preuve, donnée, analyse, scénario, décision. Source de vérité unique. |
| **UNIVERS** | Une configuration métier (vocabulaire, libellés, suggestions, couleur) appliquée au-dessus du moteur — **pas** une architecture séparée. C'est déjà exactement le rôle de `univers.ts` aujourd'hui. |
| **APPLICATION / EXPÉRIENCE** | Une interface utilisateur dédiée à un usage (Mariage, Professionnel, Projet…) qui consomme le même moteur PACTE, avec ses propres écrans et son propre vocabulaire, sans jamais créer ses propres tables de vérité. |
| **IDENTITÉ** | Une personne ou une organisation. Une seule fois dans le système, quels que soient ses rôles. |
| **OBJET** | Ce que le moteur suit dans le temps quand ce n'est pas un contrat au sens strict (projet, œuvre, actif, bien, mission…). |
| **RELATION** | Le lien entre une identité et un objet/contrat/autre identité, porteur d'un **rôle**. Le rôle n'appartient jamais à l'identité. |
| **ENGAGEMENT** | Ce qui a été promis, par qui, envers qui, sous quelle condition. |
| **ÉVÉNEMENT** | Un fait daté qui s'est produit et qui peut affecter un engagement. |
| **DOCUMENT** | Un support écrit ou formalisé (clause, contrat, article) — distinct de la preuve de son exécution. |
| **PREUVE** | Ce qui atteste qu'un engagement, un paiement ou un événement a réellement eu lieu. |
| **DONNÉE** | Une mesure, une valeur, un indicateur observé et daté — jamais une prédiction. |
| **ANALYSE** | Une lecture des données/documents qui produit des observations et hypothèses, jamais des certitudes. |
| **SCÉNARIO** | Un futur possible, explicitement conditionnel, jamais une prévision assurée. |
| **DÉCISION** | L'acte humain final, distinct et traçable, qui s'appuie sur ce qui précède. |
| **SOURCE DE VÉRITÉ** | L'unique enregistrement faisant foi pour une entité donnée, quel que soit le point d'entrée (Wedmag, univers Mariage, univers Professionnel…). |

---

## 3. Architecture

```
GAIA
couche de compréhension / contexte / mémoire / mise en relation
        ↓ lit, interroge, propose (jamais n'écrit seule)
PACTE
moteur relationnel et opérationnel
IDENTITÉ → OBJET → RELATION → ENGAGEMENT → ÉVÉNEMENT →
DOCUMENT → PREUVE → DONNÉE → ANALYSE → SCÉNARIO → DÉCISION HUMAINE
        ↓ configuré par (vocabulaire/libellés/couleur — pas un sous-moteur)
UNIVERS
Personnel · Professionnel · Entreprise · Projets · Spectacle · Art · Musique ·
Audiovisuel · Propriété intellectuelle · Immobilier · Biens & actifs · Commerce ·
Associations · Recherche · Formation & carrière · Voyage · Assurance ·
Financement · Finance & marchés · (+ Mariage à ajouter, cf. §9)
        ↓ exposé par
APPLICATIONS / EXPÉRIENCES
Mariage · Professionnel · Projet · Entreprise · Art · Musique · etc.
        ↑ point d'entrée éditorial
WEDMAG (inspiration, contenu, acquisition) → devient un projet PACTE sur validation humaine
```

**Point capital confirmé par le code existant** : la couche « UNIVERS » n'est **déjà pas** un second moteur. Dans `types.ts`, `Objet.univers` est un simple `string` de configuration ; le commentaire du code le dit explicitement : *« Le champ univers ne fait que configurer les libellés/suggestions ; il ne détermine jamais l'architecture. »* GAIA doit respecter exactement la même discipline vis-à-vis de PACTE : une couche de lecture/config, jamais une deuxième source de vérité.

---

## 4. Frontières GAIA / PACTE (réponses A et B)

### A. Que doit signifier GAIA ?

GAIA est la couche qui répond à *« qu'est-ce que ça veut dire, qu'est-ce qui est lié, qu'est-ce qu'on pourrait envisager »* — jamais à *« qu'est-ce qui s'est passé, avec qui, à quelle date, avec quelle preuve »* (ça, c'est PACTE). GAIA ne doit jamais être présentée comme une intelligence omnisciente : c'est une couche de **mise en contexte** au-dessus de faits que PACTE, seul, garantit.

### B. Frontière exacte

Un test simple, applicable à toute nouvelle fonctionnalité :

- **« Est-ce un fait daté, citable, prouvable ou décidé par un humain ? »** → il doit vivre dans PACTE (Objet, Relation, Engagement, Événement, Preuve, Donnée, Décision).
- **« Est-ce une interprétation, un résumé, une proposition de lien, une hypothèse ? »** → il vit dans GAIA, et **doit être validé par un humain avant de devenir un fait PACTE.**

GAIA ne possède aucune table de vérité propre. Toute « mémoire » que GAIA construit (résumés, liens suggérés, contexte accumulé) doit elle-même être un objet PACTE traçable (voir §13 mémoire) — jamais un cache opaque.

Concrètement, dans le code actuel, `lib/analyse.ts` (analyse de document → propositions citant leur extrait source, jamais insérées automatiquement) et `lib/coherence.ts` (alertes calculées, vocabulaire « potentiel / possible / à vérifier », jamais de certitude) *sont déjà* des embryons de GAIA — ils produisent des propositions que l'utilisateur valide avant écriture. C'est la frontière à généraliser, pas à réinventer.

---

## 5. Modèle de données

Le modèle demandé (IDENTITÉ → OBJET → RELATION → ENGAGEMENT → ÉVÉNEMENT → DOCUMENT → PREUVE → DONNÉE → ANALYSE → SCÉNARIO → DÉCISION) **existe déjà**, presque entièrement, dans `app/src/lib/types.ts` :

| Étape du modèle | Entité(s) déjà codée(s) |
|---|---|
| IDENTITÉ | `Partie` (personne ou organisation, sans rôle figé) |
| OBJET | `Objet` (générique) et `Contrat` (spécialisation légale/documentaire de l'Objet — dit explicitement en commentaire de code) |
| RELATION | `Relation` (rôle + `partie_id`/`autre_partie_id`/`objet_id`/`contrat_id`) et `ContratPartie` (rôle sur un contrat) — **doublon partiel à généraliser, voir §18** |
| ENGAGEMENT | `Engagement` |
| ÉVÉNEMENT | `Evenement` |
| DOCUMENT | `Clause` (fragment contractuel formalisé) — **étape la plus faible, voir §18** |
| PREUVE | `Preuve` |
| DONNÉE | `Metrique` (toujours datée, sourcée, jamais prédictive) |
| ANALYSE | `lib/analyse.ts` (analyse de document), `lib/coherence.ts` (cohérence), `lib/valeur.ts`/`AnalyseValeur` (valeur observée, jamais projetée) |
| SCÉNARIO | `Scenario` + `lib/scenarios.ts` |
| DÉCISION HUMAINE | `Decision` (distincte de `Scenario`/`Alerte`, avec `decideur` et `fondee_sur`) |

`Version` et `Historique` (déjà présents) constituent la traçabilité qui rend la future « mémoire GAIA » possible sans nouvelle table.

---

## 6. Le graphe universel

```
PERSONNE / ORGANISATION (Partie)
        ↕  RELATION (porte le rôle : rôle ≠ identité)
OBJET (Objet / Contrat)  ↔  ÉVÉNEMENT  ↔  DOCUMENT / PREUVE
```

Le principe *« une identité n'est pas dupliquée selon son rôle »* est **déjà respecté** par le code : `Partie` ne contient aucun champ figeant un rôle (pas de `type: 'photographe'`). Le rôle vit exclusivement sur l'arête (`Relation.role`, `ContratPartie.role`). C'est exactement le mécanisme qui permettra, demain, qu'une même personne soit prestataire sur un projet et témoin sur un autre, sans deuxième fiche.

**Point de vigilance (à généraliser, non à corriger dans l'immédiat)** : `Relation` et `ContratPartie` sont aujourd'hui deux mécanismes distincts pour un même concept (« rôle d'une identité sur une entité »). Le graphe universel gagnerait, à terme, à converger vers une seule table de relation — voir §18.

---

## 7. Timeline (réponse H)

La Timeline est **déjà** le système nerveux du moteur, et le commentaire du fichier le dit littéralement :

> « TIMELINE — le système nerveux de PACTE. Un seul système, réutilisé par le contrat ET par tout objet du moteur universel : AVANT / PENDANT / APRÈS, jamais de logique dupliquée par univers. »

`decouperPhases()` (dans `Timeline.tsx`) construit déjà AVANT/PENDANT/APRÈS à partir des dates d'engagements, échéances et événements, quel que soit le type d'entité (contrat ou objet). C'est le socle sur lequel Mariage doit s'appuyer **sans rien réécrire**.

**Manque identifié (non codé ici)** : les items de Timeline sont aujourd'hui typés `'engagement' | 'echeance' | 'evenement'` uniquement — personne, document, preuve et décision n'y apparaissent pas encore comme types d'item. Étendre cette liste (pas créer une deuxième timeline) est le bon geste futur.

---

## 8. Couche IA (réponse I)

Le principe **PROPOSITION ≠ VALIDATION** est déjà codé, pas seulement théorique :

- `AnalyseDocument` porte un `score_confiance` et cite l'`extrait` source de chaque proposition — rien n'est inséré sans validation humaine.
- `EvaluationScenario` porte un `niveau_confiance` et un `avertissement` explicite.
- `coherence.ts` utilise volontairement un vocabulaire de prudence (« potentiel », « possible », « à vérifier », « susceptible de »).

GAIA doit être la **généralisation** de ces deux moteurs (`analyse.ts`, `coherence.ts`) à tous les univers — aujourd'hui `analyse.ts` ne sait lire que du texte contractuel. Le format de sortie attendu (proposition + source citée + score de confiance + jamais d'écriture automatique) est déjà le bon contrat d'interface ; il n'y a pas de nouveau paradigme à inventer, seulement à étendre son champ d'application.

Formulations types déjà cohérentes avec l'esprit demandé et directement réutilisables :
*« J'ai détecté une relation possible. » « Ce document semble correspondre à cet engagement. » « Il manque peut-être une preuve. » « Voici trois scénarios possibles. »*

---

## 9. Couche Mariage (réponse F)

**PACTE Mariage ne doit exiger aucune nouvelle table.** Il se construit avec les briques existantes :

| Concept Mariage | Brique PACTE réutilisée | Nouveauté nécessaire |
|---|---|---|
| Couple | 2 `Partie` | Aucune (déjà générique) |
| Lien du couple | `Relation` | Nouvelle valeur de vocabulaire dans `TYPES_RELATION` (ex. `conjoint`) |
| Lieu / prestataire | `Partie` (organisation ou personne) | Aucune |
| Réservation / prestation | `Relation` reliant `Partie` (prestataire) ↔ `Objet` (projet mariage) | Nouvelle valeur de rôle |
| Contrat de prestation | `Contrat` | Aucune (déjà universel) |
| Acompte / échéance | `Echeance` | Aucune |
| Preuve de paiement | `Preuve` | Aucune |
| Événement mariage | `Evenement` | Aucune |
| Analyse capacité vs invités | `Metrique` + une règle de cohérence dédiée | Une **fonction** de règle métier (même signature que `coherence.ts`), pas un moteur |
| Témoins / invités | `Partie` + `Relation` (rôle) | Nouvelles valeurs de rôle (`temoin`, `invite`) |
| Décision (réduire invités, changer de lieu…) | `Decision` | Aucune |

Le « Projet mariage » lui-même est un `Objet` (`type_objet: 'projet'`, `univers: 'mariage'`), exactement structuré comme n'importe quel autre projet suivi aujourd'hui (voir `Objets`/`FicheObjet`). **Aucun deuxième logiciel, aucun schéma parallèle.**

Point ouvert, à trancher plus tard (pas maintenant) : faut-il modéliser un « Lieu » comme `Partie` (type organisation) ou comme `Objet` (type bien) ? Les deux sont défendables ; ce choix doit être fait avant d'écrire la première ligne de code Mariage, pas pendant.

---

## 10. Intégration Wedmag (réponse E)

Wedmag reste un **front éditorial** (inspiration, articles, destinations, idées, découverte de prestataires/lieux). Il ne stocke jamais sa propre notion de personne, lieu, prestataire ou contrat.

Flux :

```
WEDMAG (éditorial)
   ↓ inspiration / article / prestataire / idée
   ↓ action utilisateur explicite : « Enregistrer dans mon projet »
PACTE — via l'API existante (api.ts, pattern CRUD déjà en place)
   ↓ crée ou relie une Partie / un Objet / une Relation réelle
PROJET MARIAGE (Objet univers='mariage')
```

**Aucune donnée Wedmag n'est dupliquée dans une table séparée.** Si un besoin de « sauvegardé mais pas encore confirmé » existe (l'utilisateur a repéré un lieu mais n'a pas encore validé), il se modélise avec un **statut** sur l'entité PACTE existante (ex. `Relation.statut = 'suggestion'` avant `'confirme'`), jamais avec une deuxième structure. C'est exactement la mécanique de statut déjà utilisée ailleurs dans le moteur (`Metrique.statut`, `Contrat.statut`, `Objet.statut`…).

Ceci matérialise directement le principe demandé : **Cerise propose. L'humain valide.** — la validation est l'instant précis où le statut change et où l'entité devient un fait PACTE opposable.

---

## 11. Source de vérité (réponse G)

| Type d'entité | Source de vérité unique |
|---|---|
| Personnes / organisations | `Partie` |
| Projets / objets / actifs / œuvres / biens | `Objet` |
| Contrats | `Contrat` (spécialisation d'`Objet`) |
| Relations / rôles | `Relation` (+ `ContratPartie`, à converger — §18) |
| Événements | `Evenement` |
| Documents | `Clause` (aujourd'hui la plus faible représentation — §18) |
| Preuves | `Preuve` |
| Données | `Metrique` |
| Décisions | `Decision` |
| Historique / traçabilité | `Historique`, `Version` |

Chaque entité porte déjà `id`, `created_at`, et une clé de rattachement (`contrat_id` **ou** `objet_id`, jamais les deux à la fois — règle déjà appliquée dans le code). Cela garantit déjà, mécaniquement, qu'une même donnée ne peut pas exister « pour Wedmag » et « pour PACTE » séparément : il n'y a qu'un seul jeu de tables, quel que soit le point d'entrée (Wedmag, univers Mariage, univers Professionnel, etc.).

---

## 12. Permissions

**Gap réel, non résolu par le code actuel.** Aucune notion d'utilisateur, de rôle applicatif ou de permission n'existe dans `types.ts` aujourd'hui. Tant que PACTE servait un usage mono-utilisateur/contrat, ce n'était pas bloquant. Dès que Mariage fait intervenir plusieurs acteurs avec des droits différents (le couple, un témoin, un prestataire consultant seulement « son » contrat), un modèle de permission devient nécessaire **avant** d'écrire du code Mariage multi-acteurs. Ce blueprint ne le résout pas ; il le signale comme prérequis (voir §16 risques et §18 manques).

---

## 13. Scénarios

`Scenario` (type) et `lib/scenarios.ts` existent déjà et suivent le même principe de prudence (`note_prudence`, `actif`). Les scénarios Mariage (« réduire les invités / changer de lieu / modifier la configuration ») sont de **nouvelles instances** de ce même moteur, pas un nouveau système. Le pipeline demandé —

```
SOURCE → DONNÉE → OBSERVATION → SIGNAL → HYPOTHÈSE → SCÉNARIO → DÉCISION HUMAINE
```

— correspond directement à `Metrique` (donnée) → `coherence.ts`/futur GAIA (observation/signal) → `Scenario` (hypothèse structurée) → `Decision` (acte humain). Rien de nouveau à inventer structurellement.

---

## 14. Juridique

La posture déjà codée dans `coherence.ts` et `analyse.ts` — signaler des risques, jamais des certitudes ; citer la source ; afficher un score de confiance ; vocabulaire de prudence systématique — **est exactement** la posture juridique demandée pour PACTE : structurer, documenter, comparer, afficher les sources, détecter les incohérences, présenter plusieurs scénarios, sans jamais inventer une règle de droit, garantir une issue, ou se substituer à un professionnel.

Pour Mariage, cela signifie : les formalités civiles (délais de publication, pièces requises selon la mairie/le pays, etc.) doivent être **citées avec leur source** (texte, mairie, date de vérification), jamais affirmées comme des vérités intemporelles codées en dur — même logique que `droit_applicable`/`pays` déjà présents sur `Contrat` et `Objet`.

---

## 15. Roadmap technique (planification uniquement — aucun code ce tour)

1. **Vocabulaire & configuration** — ajouter l'entrée `mariage` dans `univers.ts` (config pure : couleur, libellés, types d'objets) + nouvelles valeurs dans `TYPES_RELATION`/`TYPES_OBJET` (`conjoint`, `temoin`, `invite`, `lieu`, `prestataire`…). Zéro changement de schéma.
2. **Convergence Relation / ContratPartie** — étudier la fusion des deux mécanismes de rôle en un seul, pour éviter que le graphe universel ne se fige avec un doublon structurel.
3. **Généralisation de la couche GAIA** — étendre `lib/analyse.ts`/`lib/coherence.ts` au-delà du texte contractuel pur, en conservant strictement le contrat d'interface actuel (proposition + source citée + score de confiance + validation humaine obligatoire).
4. **Contrat d'interface Wedmag → PACTE** — définir précisément l'appel API (probablement une extension du pattern `api.ts` déjà en place) par lequel une action éditoriale Wedmag crée/relie une entité PACTE réelle avec un statut `suggestion`.
5. **Modèle de permissions** — concevoir (avant tout code Mariage multi-acteurs) qui peut voir/modifier/valider quoi, pour le couple, les témoins et les prestataires.
6. **Expérience Mariage (UI)** — construire les écrans Mariage en réutilisant les patterns déjà existants (`FicheObjet`, `Timeline`, `OngletRelations`), pas de nouveaux composants génériques.

---

## 16. Risques

- **Risque de contournement** : si l'équipe Wedmag développe vite sans passer par l'API PACTE existante, une base de données parallèle apparaît par accident — risque de gouvernance, pas seulement technique.
- **Risque de confusion univers = moteur** si la distinction (déjà correcte dans le code) n'est pas maintenue dans la documentation d'onboarding des futurs contributeurs.
- **Risque d'opacité IA** si la couche GAIA généralisée cesse de citer ses sources — le principe actuel (`extrait`, `score_confiance`) doit être un invariant, pas une option.
- **Risque juridique** si des règles de droit civil du mariage sont un jour codées en dur comme des vérités plutôt que comme des repères sourcés et vérifiables.
- **Dette technique existante** : la coexistence `Relation`/`ContratPartie` doit être traitée avant que Mariage n'en ajoute une troisième variante par accident.
- **Risque de sécurité/consentement** : sans modèle de permissions, un prestataire ou un témoin pourrait accéder à des données du couple qui ne le concernent pas.

---

## 17. Éléments déjà présents dans le code (réponse C)

- Le split `Objet`/`Contrat` avec `Contrat` explicitement documenté comme spécialisation de l'`Objet` universel.
- `Relation` porteuse de rôle, sans duplication d'identité — documenté en commentaire dans le code source lui-même.
- La Timeline, système unique partagé entre `Contrat` et `Objet` — documenté explicitement comme tel dans `Timeline.tsx`.
- `Engagement`/`Echeance`/`Evenement`/`Preuve`/`Alerte`/`Scenario`/`Version`/`Historique`, tous partagés entre `contrat_id` et `objet_id` avec la règle stricte « jamais les deux à la fois ».
- `Metrique` : donnée toujours datée et sourcée, jamais présentée comme prédiction.
- `Decision` : entité distincte de `Scenario`/`Alerte`, portant `decideur` et `fondee_sur` — l'incarnation exacte de « l'humain décide ».
- `lib/analyse.ts` et `lib/coherence.ts` : posture de prudence déjà codée (extraits cités, score de confiance, vocabulaire d'incertitude).
- `univers.ts` : déjà une pure couche de configuration (couleur, libellés, types d'objets suggérés) attachée via un simple champ `string`, jamais un schéma dupliqué par univers — validant déjà, pour 19 univers, le principe « pas de duplication par domaine ».

## 18. Éléments réellement manquants (réponse D)

- Le domaine **Mariage** n'existe pas encore dans `univers.ts` (aucune config).
- Le vocabulaire de rôle (`TYPES_RELATION`) ne contient pas encore `conjoint`, `temoin`, `invite`, ou équivalents.
- **`Relation` et `ContratPartie` sont deux mécanismes distincts pour un même concept** — c'est la partie « spécifique aux contrats » qui doit être généralisée en une seule table de relation universelle.
- **Aucun modèle de permissions/utilisateurs/rôles applicatifs** n'existe — prérequis avant tout usage multi-acteurs (couple + témoins + prestataires).
- **Aucune entité « mémoire de contexte »** pour GAIA — à concevoir comme un objet PACTE traçable (probablement une extension d'`Historique`), pas comme un cache opaque.
- **Aucun contrat d'interface Wedmag → PACTE** n'est défini — seulement le principe ; l'API concrète reste à spécifier.
- **`lib/analyse.ts` est aujourd'hui spécifique au texte contractuel** — à généraliser pour devenir le moteur d'observation transversal de GAIA.
- **L'étape DOCUMENT du modèle est la plus faible aujourd'hui** — `Clause` couvre le contenu contractuel, mais rien ne distingue clairement « document » de « preuve » comme deux entités à part entière dans le schéma actuel.

---

## Annexe — Réponses directes aux questions posées

- **A.** GAIA = couche de compréhension/contexte au-dessus de PACTE ; jamais omnisciente, jamais prédictive. Voir §4.
- **B.** Frontière = « fait daté/prouvable/décidé » → PACTE ; « interprétation/proposition/hypothèse » → GAIA, validée par l'humain avant de devenir un fait PACTE. Voir §4.
- **C.** Déjà universel : `Objet`/`Relation`/`Engagement`/`Echeance`/`Evenement`/`Preuve`/`Alerte`/`Scenario`/`Version`/`Historique`/`Metrique`/`Decision`, la Timeline partagée, `univers.ts` en pure config. Voir §17.
- **D.** À généraliser : convergence `Relation`/`ContratPartie`, généralisation de `lib/analyse.ts` au-delà du texte contractuel, renforcement de l'étape DOCUMENT. Voir §18.
- **E.** Wedmag reste éditorial ; toute sauvegarde passe par l'API PACTE existante et crée une entité réelle à statut `suggestion` avant validation. Voir §10.
- **F.** PACTE Mariage = nouvelles valeurs de vocabulaire + nouvelles règles de cohérence + nouvel univers config + nouvelles pages UI, zéro nouvelle table, zéro nouveau moteur. Voir §9.
- **G.** Table de source de vérité unique par type d'entité. Voir §11.
- **H.** La Timeline existante (`decouperPhases`, AVANT/PENDANT/APRÈS) est déjà la colonne vertébrale commune ; à étendre (pas dupliquer) pour couvrir personne/document/preuve/décision. Voir §7.
- **I.** L'IA reprend le contrat d'interface déjà existant (`analyse.ts`/`coherence.ts`) : proposition + source citée + score de confiance + validation humaine obligatoire, jamais d'écriture automatique. Voir §8.
- **J.** Architecture minimale pour étendre à Mariage/Professionnel/Entreprise/Art/Musique/Projet/Finance/Immobilier sans réécrire le moteur : c'est déjà le cas pour les 19 univers actuels (`Objet.univers` = simple string de config) — la même méthode s'applique à toute future expérience. Voir §3 et §9.

---

**Fin du document. Aucun code n'a été écrit à cette étape, conformément à la consigne.**

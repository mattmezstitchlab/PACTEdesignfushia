# PACTE — Audit de simplification (v1)

**Statut : audit uniquement — aucune ligne de code produit n'a été modifiée pour établir ce document.**
Référence : commit `a0cc339` (base gelée), branche `arena/01a0e130-pactedesignfushia`.
Méthode : lecture du code source réel (`app/src`), `grep` croisés pour vérifier qui appelle réellement quoi (aucune fonctionnalité n'est jugée sur sa documentation ou ses commentaires, seulement sur son usage effectif dans le code), comptage de lignes.

Objectif : identifier ce qui peut être **regroupé, fusionné ou retiré** pour une application plus simple, sans rien inventer et sans toucher à `analyse.ts` ni décider seul d'un changement d'architecture.

---

## Résumé exécutif

L'application contient **deux systèmes parallèles quasi identiques** (« Contrat » et « Objet »), dont un seul est réellement branché sur le parcours utilisateur. Le second représente **1 616 lignes sur 6 933** dans `pages/` + `components/` (**23 % du code applicatif**) pour une fonctionnalité que rien, dans le produit réel, ne permet jamais d'atteindre depuis le parcours principal. C'est le gisement de simplification le plus important, de loin.

À côté de cela, une page (« Analyser un document ») duplique un traitement déjà présent ailleurs sans jamais aboutir elle-même à une création, et une page (« Dossiers ») réaffiche la même liste que « Contrats » sans filtre propre. Ce sont des simplifications plus petites mais très sûres.

Aucune de ces observations ne remet en cause `analyse.ts` (non modifié, non même relu en profondeur au-delà de sa surface d'appel) ni la structure de données centrale du contrat.

---

## 1. Constat n°1 (priorité haute) — Le système « Objet / Univers » double le système « Contrat » sans être utilisé

### Preuves (vérifiées par grep, pas supposées)

- Le **seul** endroit du code qui crée un `Objet` est `src/pages/NouvelObjet.tsx` :
  ```
  grep -rn "api.objets.create" src/   →  1 seul résultat, dans NouvelObjet.tsx
  ```
- Le flux réel de création (`PacteHeroConversationnel.tsx`, le seul point d'entrée conversationnel du produit, celui qui a servi à la vidéo de démo) crée **uniquement** des `Contrat` :
  ```
  grep -n "api\." PacteHeroConversationnel.tsx
    → api.contrats.create, api.parties.create, api.contratParties.create,
      api.clauses.create, api.engagements.create, api.echeances.create,
      api.versions.create
  → jamais api.objets.create
  ```
- L'assistant multi-étapes `/nouveau` (modes nouveau / import / avenant / situation) crée lui aussi uniquement des `Contrat`.
- Les pages éditoriales de découverte (`/univers`, `/univers/:code`) n'affichent **que** des `Objet` (`api.objets.list()`), jamais des `Contrat`. Résultat concret : un utilisateur qui suit le parcours normal (Découvrir → Univers → clic sur un univers) tombera systématiquement sur des pages vides, car rien ne peuple jamais cette liste par le chemin réel du produit.
- `src/components/objet/data.ts` porte lui-même ce commentaire : *« Miroir exact de src/components/contrat/data.ts : mêmes tables, mêmes primitives CRUD, seule la clé de rattachement change… Aucune logique dupliquée »* — alors que c'est, très concrètement, un second fichier de 131 lignes qui reproduit la même mécanique que le premier (121 lignes).
- `FicheContrat.tsx` (342 lignes, 12 onglets) et `FicheObjet.tsx` (329 lignes, 11 onglets) partagent déjà littéralement **7 des onglets** (`OngletEngagements`, `OngletEvenements`, `OngletEcheances`, `OngletPreuves`, `OngletAlertes`, `OngletScenarios`, `OngletActions` — importés tels quels dans les deux fichiers). Seuls diffèrent : Parties/Relations (même idée : « qui est concerné »), Clauses et Versions (propres au Contrat), Métriques et Décisions (propres à l'Objet).
- Deux catalogues de classification coexistent et se recouvrent partiellement sans être reliés : `lib/modeles.ts` (9 modèles : pacte_prive, mariage, freelance, commercial, location, partenariat, vente, prestation_pro, universel — **utilisé par le vrai flux Contrat**) et `lib/univers.ts` (9 univers : personnel, professionnel, entreprise, projets, spectacle, art, musique, audiovisuel, propriété intellectuelle — **utilisé uniquement par le système Objet, jamais connecté au flux réel**).

### Volume concerné

| Fichier | Lignes | Statut réel |
|---|---:|---|
| `pages/Objets.tsx` | 111 | jamais alimenté par le parcours réel |
| `pages/NouvelObjet.tsx` | 94 | seul créateur d'Objet, isolé du reste |
| `pages/FicheObjet.tsx` | 329 | quasi-miroir de FicheContrat.tsx |
| `pages/Univers.tsx` | 74 | affiche une liste toujours vide en usage réel |
| `pages/UniversDetail.tsx` | 114 | idem |
| `components/objet/data.ts` | 131 | miroir déclaré du data.ts du Contrat |
| `components/objet/OngletDecisions.tsx` | 104 | fonctionnalité orpheline |
| `components/objet/OngletMetriques.tsx` | 143 | fonctionnalité orpheline |
| `components/objet/OngletRelations.tsx` | 150 | quasi-miroir de OngletParties.tsx |
| `lib/univers.ts` | 366 | taxonomie parallèle non connectée |
| **Total** | **1 616** | **23 % de `pages/` + `components/` (6 933 lignes)** |

### Ce que cela coûte concrètement
- Deux notions à comprendre pour un même besoin (« un contrat » vs « un objet suivi ») dans la barre latérale (« Contrats & pactes » et « Objets suivis »), sans que l'utilisateur n'ait de raison de savoir laquelle choisir.
- Une entrée de navigation entière (« Univers ») qui mène à une expérience vide en usage réel, ce qui est le pire résultat possible en termes de simplicité perçue.
- Une taxonomie supplémentaire (`univers.ts`) à maintenir en plus de celle réellement utilisée (`modeles.ts`).
- Toute évolution future du moteur central (contrat) doit être pensée deux fois si l'on veut garder les deux systèmes cohérents entre eux — charge de maintenance qui ne profite aujourd'hui à personne.

### Piste de simplification (à valider par vous avant tout code)
Deux options raisonnables, sans présumer laquelle vous préférez :
- **Option A — Retrait** : supprimer le système « Objet/Univers » (nav, routes, pages, onglets dédiés, `univers.ts`) tant qu'aucun parcours réel ne le nourrit, et ne le réintroduire que lorsqu'un besoin concret et connecté existera.
- **Option B — Fusion** : si le concept « objet suivi plus léger qu'un contrat » reste souhaité, le fusionner *dans* le Contrat existant (ex. un `type_modele: 'suivi_libre'` ou un booléen « allégé » sur le Contrat) plutôt que de dupliquer tables, pages et onglets. Cela conserverait l'intention produit sans le coût de deux systèmes parallèles.

Je n'ai touché ni supprimé aucun de ces fichiers : c'est une observation d'audit, l'arbitrage vous appartient.

---

## 2. Constat n°2 (priorité haute) — « Analyser un document » (`/analyse`) est un cul-de-sac qui duplique l'assistant `/nouveau`

### Preuves
- `Analyse.tsx` appelle `analyserDocument(texte)` (depuis `lib/analyse.ts`) pour prévisualiser engagements/échéances/clauses détectés.
- `Nouveau.tsx`, en mode `import`, appelle **exactement la même fonction** `analyserDocument(texteImport)` sur le même type d'entrée, puis va jusqu'au bout : création réelle du contrat.
- `Analyse.tsx` ne crée jamais rien lui-même (aucun `api.contrats.create` dans ce fichier). Sa seule sortie possible est un bouton *« Créer un contrat depuis cette analyse »* qui renvoie vers `/nouveau` **sans transmettre le texte ni le résultat de l'analyse** — l'utilisateur doit recoller le même texte et relancer la même analyse une seconde fois.

### Ce que cela coûte concrètement
Une page entière (122 lignes), une entrée de navigation, pour un aperçu qui n'aboutit jamais et oblige à recommencer ailleurs. C'est le genre de redondance qui n'apporte aucune valeur ajoutée réelle : elle ajoute un choix de navigation supplémentaire sans réduire l'effort de l'utilisateur.

### Piste de simplification
- **Retirer la page `/analyse`** et rediriger son entrée de navigation vers `/nouveau?mode=import`, qui fait déjà tout ce qu'elle fait, en mieux (jusqu'à la création réelle).
- Ou, si l'aperçu « sans engagement » est jugé utile en tant que tel, **faire transporter le texte et le résultat** vers `/nouveau` (state de navigation ou paramètre) pour ne pas faire tout retaper.

---

## 3. Constat n°3 (priorité moyenne) — « Dossiers » (`/dossiers`) réaffiche la même liste que « Contrats » (`/contrats`)

### Preuves
- `Dossiers.tsx` charge `api.contrats.list()` **sans aucun filtre** — exactement la même liste que `Contrats.tsx`.
- La seule différence : des compteurs (clauses/engagements/preuves/signatures) calculés en plus, et un lien qui pointe vers `?onglet=dossier` au lieu de l'aperçu par défaut.

### Ce que cela coûte concrètement
Deux pages, deux entrées de navigation, pour parcourir la même liste de contrats sous deux angles différents. C'est un candidat clair à un regroupement léger.

### Piste de simplification
- Intégrer l'indicateur « Dossier prêt / à compléter » comme **badge ou filtre** directement dans la page `/contrats` existante (par exemple un filtre supplémentaire « Dossiers prêts ») plutôt que de maintenir une page à part qui affiche la même liste.

---

## 4. Constat n°4 (priorité basse, cosmétique) — Densité de la navigation principale

La barre latérale compte aujourd'hui 10 entrées, plus « Découvrir », plus le bouton « Nouveau pacte », plus « Règles IA » — soit 13 destinations de premier niveau. Avec les constats 1 à 3 traités, ce nombre baisserait mécaniquement (retrait d'« Objets suivis » et « Univers », fusion de « Dossiers » dans « Contrats », retrait ou fusion d'« Analyser un document ») à environ 8–9 entrées, sans perte de fonctionnalité réelle.

Par ailleurs, `Règles IA` est une page purement informative (statique, sans donnée ni interaction) : elle pourrait aussi bien vivre comme une section de la page « Découvrir » plutôt que comme une destination de navigation à part entière. Signalé pour information, impact faible, pas une urgence.

---

## 5. Ce qui n'est PAS un problème (vérifié, pas supposé)

Pour être précis et ne pas sur-signaler :
- Les pages « globales » `Evenements` (journal tous contrats confondus) et `Alertes` (centre d'alertes) qui coexistent avec les onglets du même nom dans la fiche d'un contrat **ne sont pas une redondance à corriger** : c'est un patron courant et légitime (vue d'ensemble transverse + vue détaillée par dossier), les deux servent un usage réel différent.
- L'assistant `/nouveau` avec ses 4 modes (nouveau / import / avenant / situation) **n'est pas une duplication interne** : « avenant » et « situation » agissent sur un contrat *existant*, « nouveau » et « import » en créent un *nouveau* — ce sont quatre besoins réellement distincts déjà consolidés dans un seul écran, ce qui est plutôt un bon exemple de regroupement réussi.
- `lib/analyse.ts` n'a pas été modifié, ni même remis en question dans ce document, conformément à la consigne.

---

## 6. Priorisation proposée

| # | Constat | Effort estimé | Gain de simplicité |
|---|---|---|---|
| 1 | Système Objet/Univers non connecté (23 % du code pages/components) | Élevé (décision de fond à valider) | Très élevé |
| 2 | Page « Analyser un document » sans issue propre | Faible | Moyen-élevé (supprime un cul-de-sac) |
| 3 | Page « Dossiers » redondante avec « Contrats » | Faible | Moyen |
| 4 | Densité de la navigation / page « Règles IA » | Très faible | Faible (cosmétique) |

**Aucune de ces actions n'a été appliquée.** Ce document est la restitution de l'audit demandé ; je n'engage aucune suppression, fusion ou modification de route/composant sans votre validation explicite, point par point si vous le souhaitez.

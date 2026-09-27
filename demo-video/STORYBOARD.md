# PACTE — Storyboard & script de la vidéo de démonstration

**Commit de référence : `a0cc339` (gelé, aucune modification produit).**
**Statut de production : script, voix off réelle et procédure de capture prêts. Le fichier vidéo final n'a PAS pu être rendu dans cet environnement — cause technique documentée ci-dessous. Ceci n'est pas présenté comme fait alors qu'il ne l'est pas.**

---

## 0. Audit préalable (résumé — détail complet dans le rapport final)

- Commit courant vérifié : `a0cc339`, `git status` propre.
- Routes réellement déclarées dans `app/src/App.tsx` : `/`, `/contrats`, `/contrats/:id`, `/nouveau`, `/decouvrir`, `/univers`, `/univers/:code`, `/objets`, `/objets/nouveau`, `/objets/:id`, `/parties`, `/modeles`, `/evenements`, `/alertes`, `/dossiers`, `/analyse`, `/regles-ia`.
- Parcours utilisé dans cette vidéo : `/` (Dashboard → hero conversationnel), puis `/contrats/:id` (fiche réelle du dossier créé).
- Composant réellement utilisé : `app/src/components/hero/PacteHeroConversationnel.tsx` + moteur `app/src/lib/comprendre.ts`.
- Endpoints réellement appelés lors de la création (vérifiés par exécution réelle, pas de lecture de code seule) : `POST /api/contrats`, `POST /api/parties`, `POST /api/contrat_parties`, `POST /api/clauses`, `POST /api/engagements`, `POST /api/echeances`, `POST /api/versions`.
- Persistance réellement vérifiée : redémarrage complet du serveur de développement, dossier et sous-entités toujours accessibles ensuite (`GET /api/contrats?id=1` → 200 avec les mêmes données).
- Rejouabilité sans modification du code : **oui**, en supprimant simplement `app/server/data/db.json` avant de démarrer `npm run dev` (store local à fichier, remis à zéro sans toucher au produit).
- Capture d'écran / navigateur réel dans cet environnement : **non disponible** — aucun binaire Chromium/Chrome installable (`npx playwright install chromium` → `ECONNRESET` sur `cdn.playwright.dev` ; `apt-get install ffmpeg`/`chromium` → dépôts Debian inaccessibles ; aucun serveur X, `DISPLAY` vide). Confirmé de nouveau lors de cet audit (déjà documenté lors de sessions précédentes).
- Génération/enregistrement de voix off : **disponible et utilisé réellement** — 8 fichiers audio français générés (voir `demo-video/audio/`, durée totale mesurée 67,7 s).
- Production du fichier vidéo final (assemblage image + son) : **non disponible** — aucun `ffmpeg` ni outil de montage installable dans cet environnement (mêmes blocages réseau).

**Conclusion d'audit : le tournage (capture d'écran réelle) et le montage final ne peuvent pas être réalisés dans cet environnement. La voix off réelle, elle, a pu être produite. Le livrable de ce tour est donc : script figé + voix off réelle + storyboard + procédure de capture/montage à exécuter sur un poste disposant d'un navigateur et d'un outil de montage.**

---

## 1. Scénario canonique utilisé (texte réel, testé contre le vrai moteur)

> « Je souhaite organiser une prestation pour 1 500 €, avec 30 % d'acompte, prévue le 15 mars 2027, et je suis le prestataire. »

Ce texte a été exécuté réellement contre `lib/comprendre.ts` (commit `a0cc339`). Sortie réelle obtenue (aucune valeur inventée pour ce document) :

| Champ | Valeur produite | Confiance |
|---|---|---|
| Intention | nouveau | — |
| Modèle | Prestation professionnelle | à confirmer |
| Rôle détecté | « prestataire » | sûr (mot reconnu dans le texte) |
| Prestation | « Prestation — prestataire » | à confirmer |
| Événement (date) | 15/03/2027 | sûr |
| Montant | 1 500 | sûr |
| Devise | EUR | sûr |
| Paiement (acompte) | 30 % | sûr |
| Question posée | « Quel est le nom (ou la raison sociale) de votre prestataire ? » | — |

**Remarque honnête à garder dans la narration** : le moteur reconnaît le mot « prestataire » dans le texte et l'utilise comme rôle de la contrepartie — y compris ici où l'utilisateur dit être lui-même le prestataire. C'est précisément ce que la scène 3/4 doit illustrer : ce champ est marqué *à confirmer*, modifiable avant validation. Le nom entré en réponse à la question (ex. « Julie Caron ») est le nom réellement enregistré comme partie prenante du dossier. Ne pas gommer cette nuance dans le script : elle sert la démonstration plutôt que de la desservir.

---

## 2. Script voix off — FINAL (verbatim, déjà généré en audio réel)

Voix enregistrée : française, calme, professionnelle, pédagogique (`voice-00`, sélectionnée par vous lors de l'audition).
Fichiers dans `demo-video/audio/` — prêts à être déposés sur la timeline de montage.

| Fichier | Durée réelle | Texte |
|---|---|---|
| `scene1_entree.mp3` | 9,9 s | « PACTE commence avec une situation exprimée simplement, en langage naturel. Il ne demande pas à l'utilisateur de remplir immédiatement une succession de formulaires. » |
| `scene2_comprehension.mp3` | 9,0 s | « PACTE distingue ce qui est réellement exprimé de ce qui reste incertain. Il ne complète pas silencieusement les informations manquantes. » |
| `scene3_structuration.mp3` | 10,9 s | « Le langage naturel devient une structure compréhensible. Les informations certaines sont conservées comme telles. Les éléments incertains restent explicitement à confirmer. » |
| `scene4_validation.mp3` | 8,1 s | « PACTE ne décide pas à la place de l'utilisateur. Il lui présente ce qui a été compris afin qu'il puisse le vérifier et le valider. » |
| `scene5_creation.mp3` | 5,6 s | « Ce n'est qu'après cette validation explicite que PACTE crée réellement le dossier. » |
| `scene6_dossier.mp3` | 6,8 s | « Le résultat n'est pas seulement une réponse générée. C'est un dossier réellement créé et structuré. » |
| `scene7_persistance.mp3` | 5,5 s | « Les informations persistent. Le dossier reste accessible après une nouvelle session. » |
| `scene8_conclusion.mp3` | 11,8 s | « PACTE ne prédit pas le futur et ne décide pas à votre place. Il rend la situation compréhensible, structurée et traçable, pour que vous puissiez décider avec une information claire. » |
| **Total narration** | **67,7 s** | — |

Aucun terme interdit utilisé (« sait tout », « prédit », « garantit »… absents — vérifié mot à mot).

---

## 3. Storyboard scène par scène — actions exactes, timing, transitions

Durée totale estimée du montage : **≈ 100–110 s** (67,7 s de voix + battements visuels avant/après chaque action pour laisser respirer l'image, cf. colonne Durée écran).

### SCÈNE 1 — ENTRÉE
- **Action réelle à capturer** : ouvrir `http://localhost:5173/`. Laisser le hero du Dashboard à l'écran, immobile 2–3 s (visuel symbolique + « PACTE » + « Comprendre ce qui vous lie. » + champ de saisie vide avec placeholder « Décrivez ce que vous voulez faire… »).
- **Texte à l'écran** : déjà présent nativement dans l'UI — rien à ajouter en post-production.
- **Voix** : `scene1_entree.mp3` (9,9 s).
- **Durée écran** : ~11 s.
- **Transition entrante** : fondu depuis noir (0,5 s).
- **Caméra** : aucun mouvement, léger zoom in très lent (105 %) sur le champ de saisie en fin de scène pour préparer la scène 2.

### SCÈNE 2 — COMPRÉHENSION
- **Action réelle à capturer** : taper, réellement et visiblement (curseur visible), le texte canonique dans le champ. Laisser le curseur clignoter 1 s avant de cliquer sur la flèche d'envoi (ou appuyer sur Entrée).
- **Texte à l'écran** : le texte tapé, tel quel, visible dans le champ.
- **Voix** : `scene2_comprehension.mp3` (9,0 s), démarre au moment où l'utilisateur clique sur envoyer.
- **Durée écran** : ~10 s (temps de frappe réel + court état « Je structure ce que vous venez d'écrire… »).
- **Transition** : coupe franche (pas de fondu) au moment du clic d'envoi.
- **Caméra** : fixe sur le champ de saisie pendant la frappe.

### SCÈNE 3 — STRUCTURATION *(même écran réel que la scène 4 — un seul état de l'application : « J'ai compris »)*
- **Action réelle à capturer** : la carte « J'ai compris. » apparaît (transition déjà native de l'app). Laisser un temps de lecture, puis zoomer légèrement (curseur ou cadrage) successivement sur chaque ligne : Événement (15/03/2027), Prestation, Montant (1 500 €), Paiement (30 % d'acompte), Engagement (Prestation professionnelle) — en marquant un temps d'arrêt visuel sur le tag **« à confirmer »** quand il apparaît (Prestation, Engagement).
- **Texte à l'écran** : natif — les 5 lignes réelles produites par le moteur (cf. tableau section 1).
- **Voix** : `scene3_structuration.mp3` (10,9 s).
- **Durée écran** : ~13 s.
- **Transition** : aucune (scène continue directement en scène 4, même plan).
- **Caméra** : légers déplacements de cadrage (pas de zoom numérique agressif) ligne par ligne.

### SCÈNE 4 — VALIDATION HUMAINE *(suite du même écran)*
- **Action réelle à capturer** : cadrer la zone « Il me manque une information » (« Quel est le nom [...] de votre prestataire ? »), taper un nom réel (ex. « Julie Caron »), puis cadrer les boutons « Recommencer » / « Confirmer et créer le dossier » sans cliquer encore.
- **Texte à l'écran** : natif.
- **Voix** : `scene4_validation.mp3` (8,1 s).
- **Durée écran** : ~9 s.
- **Transition** : aucune.
- **Caméra** : fixe, curseur visible se déplaçant vers le bouton de confirmation en fin de scène (préparation scène 5).

### SCÈNE 5 — CRÉATION
- **Action réelle à capturer** : cliquer réellement sur « Confirmer et créer le dossier ». Montrer l'état bref « Création du dossier… ». **Ne pas couper avant la redirection réelle** vers `/contrats/:id`.
- **Texte à l'écran** : natif.
- **Voix** : `scene5_creation.mp3` (5,6 s).
- **Durée écran** : ~7 s (le temps réel de la séquence d'appels API, quasi instantané en local).
- **Transition** : coupe franche à l'arrivée sur la fiche contrat.
- **Caméra** : fixe.

### SCÈNE 6 — DOSSIER
- **Action réelle à capturer** : la fiche contrat réelle (`/contrats/:id`) : titre, montant, échéance d'acompte, partie liée, statut « brouillon ». Faire défiler légèrement pour montrer que ces éléments sont bien présents (pas de capture recadrée qui masquerait des champs vides).
- **Texte à l'écran** : natif (contenu réel de la fiche).
- **Voix** : `scene6_dossier.mp3` (6,8 s).
- **Durée écran** : ~8 s.
- **Transition** : fondu enchaîné léger avant la scène 7.
- **Caméra** : léger défilement vertical, vitesse constante.

### SCÈNE 7 — PERSISTANCE
- **Action réelle à capturer** : **recharger réellement la page** (F5 / Cmd+R) sur `/contrats/:id`, ou redémarrer le serveur (`npm run dev`) puis rouvrir la même URL — les deux sont démontrables réellement, le rechargement navigateur est le plus simple et le plus lisible à l'écran. Montrer que les mêmes données réapparaissent à l'identique.
- **Texte à l'écran** : natif.
- **Voix** : `scene7_persistance.mp3` (5,5 s).
- **Durée écran** : ~7 s.
- **Transition** : coupe franche.
- **Caméra** : fixe.

### SCÈNE 8 — CONCLUSION
- **Action réelle à capturer** : retour à `/` (Dashboard), hero vide, prêt pour une nouvelle entrée.
- **Texte à l'écran** :
  1. D'abord le texte natif déjà affiché par l'application : **« PACTE / Comprendre ce qui vous lie. »** (réel, capturé, pas ajouté).
  2. Puis un **carton de titre ajouté en montage** (post-production, fond neutre, typographie sobre, cohérente avec la palette noir/blanc/ivoire déjà utilisée dans l'app) : *« L'humain raconte. / PACTE structure. / L'humain valide. »* — ce texte n'existe pas littéralement dans l'interface ; il doit être identifié comme un ajout éditorial, pas comme une capture d'écran.
- **Voix** : `scene8_conclusion.mp3` (11,8 s).
- **Durée écran** : ~13 s (dont ~5 s sur l'écran réel, ~8 s sur le carton de titre).
- **Transition** : fondu vers noir en fin de vidéo.
- **Caméra** : fixe puis fondu.

---

## 4. Style — rappel des contraintes à respecter en tournage/montage

- Écran réel uniquement — aucune maquette, aucun écran recomposé.
- Curseur visible seulement quand il aide à comprendre l'action (frappe, clic, défilement) — le masquer pendant les temps de lecture.
- Transitions sobres (coupes franches ou fondus courts ≤ 0,5 s) — pas d'effets tape-à-l'œil.
- Aucune musique obligatoire ; si une musique de fond est ajoutée, elle doit rester en retrait (volume nettement sous la voix, pas de percussion agressive).
- Résolution recommandée pour la capture : 1920×1080 ou 2560×1440 en 30 ou 60 im/s, navigateur en plein écran, zoom navigateur à 100 % (pour que les proportions de l'interface correspondent à ce qui a été vérifié dans ce document).
- Avant de lancer la capture, vérifier qu'aucune donnée personnelle réelle ne traîne dans le navigateur (onglets, favoris, extensions visibles) : fenêtre de navigation propre/dédiée.

---

## 5. Procédure de capture et de montage recommandée (outils réellement disponibles pour vous, pas pour cet environnement sandbox)

1. Sur un poste avec navigateur (hors de ce sandbox) : cloner la branche `arena/01a0e130-pactedesignfushia` au commit `a0cc339`, `cd app`, `npm install`, `npm run dev`.
2. Supprimer `app/server/data/db.json` s'il existe, pour repartir d'un état vide (le scénario suppose un dossier n°1 fraîchement créé).
3. Enregistrer l'écran avec un outil de capture disponible côté utilisateur (ex. QuickTime Screen Recording sur macOS, OBS Studio sur Windows/Linux/macOS, ou l'enregistreur intégré de Windows) en suivant exactement les 8 scènes ci-dessus.
4. Récupérer les 8 fichiers audio déjà générés dans `demo-video/audio/`.
5. Assembler dans un logiciel de montage disponible côté utilisateur (DaVinci Resolve gratuit, iMovie, CapCut, Shotcut) : poser la capture vidéo sur une piste, les 8 fichiers audio sur une autre piste, aligner chaque fichier audio au début de sa scène respective en suivant le tableau de la section 3.
6. Ajouter le carton de titre de la scène 8 (texte simple sur fond neutre, cohérent avec la charte noir/blanc/ivoire du produit).
7. Exporter en 1080p (ou la résolution de capture), H.264, ~100–110 s.
8. Vérifier avant diffusion qu'aucune donnée sensible n'apparaît (URL localhost visibles = sans risque ; vérifier qu'aucun onglet/notification personnelle n'est visible en arrière-plan).

---

## 6. RÉEL / DÉMONSTRATION / FUTUR — sans mélange

**RÉEL** (vérifié par exécution effective au commit `a0cc339`) :
- Le champ de saisie en langage naturel sur `/` et le moteur `comprendre.ts` qui l'analyse localement.
- La distinction sûr / à confirmer / inconnu sur chaque champ, jamais une valeur inventée.
- La question unique posée quand une information manque.
- La création réelle, via de vrais appels réseau vers `/api/contrats`, `/api/parties`, `/api/contrat_parties`, `/api/clauses`, `/api/engagements`, `/api/echeances`, `/api/versions`.
- La persistance réelle du dossier après redémarrage complet du serveur.
- La voix off française fournie dans `demo-video/audio/` (générée réellement, pas un texte à lire par un humain non enregistré).

**DÉMONSTRATION** (choix d'exemple pour illustrer, pas une donnée réelle d'un vrai client) :
- Le texte canonique lui-même (« Je souhaite organiser une prestation… ») et le nom « Julie Caron » saisi en réponse à la question — scénario fictif servant uniquement d'illustration.
- Les montants, dates et pourcentages du scénario — choisis pour la démonstration, sans rapport avec une situation réelle.

**FUTUR** (n'existe pas dans le produit actuel, ne doit apparaître nulle part dans la vidéo) :
- Aucune vérification juridique automatique, aucune prédiction, aucune décision automatisée — PACTE ne fait aucune de ces choses aujourd'hui et ne doit jamais être montré en train de le faire.
- Le carton de titre de conclusion (« L'humain raconte / PACTE structure / L'humain valide ») est un ajout éditorial de montage — il ne doit pas être confondu avec une capture d'écran réelle du produit.

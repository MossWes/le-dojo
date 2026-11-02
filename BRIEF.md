# Le Dojo — Brief de développement pour Claude Code

*Rédigé par Wesley, le 2 novembre 2026. Ce document est la référence du projet. Les annexes du dossier `annexes/` le détaillent, les données de départ sont dans `seed/`, les icônes et le PDF de référence dans `assets/`.*

---

## 0. Comment je veux qu'on travaille

1. **Tu lis tout le dossier avant de coder** : ce brief, `CLAUDE.md`, les annexes, les fichiers `seed/`.
2. **Tu avances étape par étape** (partie 9). Avant chaque étape, tu me présentes ton plan en quelques lignes. Après chaque étape, tu me dis ce qui marche, comment le tester sur mon iPhone, et tu attends mon feu vert.
3. **Tu me parles en français**, de façon directe et structurée. Je suis autiste : j'ai besoin de réponses claires, sans remplissage, une question à la fois quand tu as besoin de moi.
4. **Tu ne touches jamais à ce qui tourne déjà sur mon serveur** (mes conteneurs Hermès, mon bot Telegram, mes autres sites) sans me demander d'abord.
5. **Aucun mot de passe, aucune clé, aucun jeton dans le code, les fichiers générés ou la conversation.** Tout passe par des variables d'environnement que je saisis moi-même sur le serveur.

---

## 1. Ce que je construis

**Le Dojo** est mon système de stratégie personnelle. Il me ramène chaque jour à ma Voie et me fait avancer, mission par mission, vers mon objectif 2027 : vivre de mes propres entreprises, sans jamais mettre les miens en danger.

Ma Voie : *« Je mène les miens vers la liberté sans jamais les mettre en danger, en me battant d'abord contre qui j'étais hier. »*

Le système a trois parties. L'application en est le cœur quotidien :

- **Les livrets (PDF)** : cinq livrets qui suivent les cinq anneaux de Musashi (Terre, Eau, Vent, Feu, Vide). Ils sont rédigés à part ; l'app les affiche.
- **Les lectures quotidiennes** : une lecture par jour, reliée à la phase de ma campagne. Plus des lectures de secours (colère, doute, fatigue…).
- **L'application** : elle affiche et lit à voix haute la lecture du jour, tient mes missions classées par rang (D à S), mes quêtes (comme mon défi des 100 jours), mon expérience, mon grade et mes bilans.

**Mes piliers** : Musashi et les accords toltèques au centre, Sun Tzu pour la stratégie, le stoïcisme pour ce qui dépend de moi et le bilan du soir, les vertus du Bushido. **Mon iconographie** : des symboles Adinkra, or sur encre. Le nom et les grades gardent une touche japonaise, mais le décor ne doit pas être japonais.

**Pour qui** : moi seul. C'est un prototype personnel. Un deuxième profil viendra peut-être plus tard : le modèle de données doit le permettre sans le coder maintenant.

---

## 2. Mes contraintes

| Sujet | Ce que je veux |
| --- | --- |
| Appareil | iPhone, app web installée sur l'écran d'accueil (PWA) |
| Hébergement | Mon VPS Hostinger (KVM 8), en conteneur Docker, à côté de ce qui tourne déjà |
| Données | Sur mon serveur, sauvegardées chaque jour. Aucun service tiers obligatoire |
| Voix | Gratuite : la synthèse vocale française de l'iPhone (Web Speech API) |
| Ambiance | Sombre, encre et parchemin, sobre et soignée (voir `annexes/03-design.md` et le PDF de référence) |
| Langue | Interface 100 % en français |
| Fuseau | Europe/Paris pour toute la logique de dates |
| Budget | Zéro abonnement nouveau. Le nom de domaine : un sous-domaine d'un domaine que j'ai déjà, ou un nouveau. Tu me demandes lequel à l'étape du déploiement |
| Liberté | Pas de dépendance à un fournisseur unique. Tout doit pouvoir se réinstaller ailleurs |

**Mes horaires actuels** (je travaille encore de nuit) : réveil à 3 h 30 ; mon créneau calme est entre 20 h et 22 h 30, sur téléphone ou tablette. Les horaires des rituels doivent être réglables, parce qu'ils changeront quand je sortirai du travail de nuit (mi-décembre 2026 au plus tôt).

---

## 3. La stack recommandée

Tu peux proposer mieux, à condition de m'expliquer pourquoi en trois lignes.

- **SvelteKit + TypeScript**, en mode serveur Node (`adapter-node`) : une seule application pour les pages et l'API.
- **SQLite** (fichier unique sur un volume Docker) avec **Drizzle ORM** et des migrations versionnées.
- **PWA** : manifeste, service worker, icônes iOS (`apple-touch-icon`), mode `standalone`.
- **Tests** : Vitest pour la logique (XP, grades, verrou S, dates, sélection de la lecture du jour), Playwright pour le parcours principal.
- **Déploiement** : `docker compose`, un seul service applicatif + un service de sauvegarde. HTTPS via le reverse proxy déjà présent sur le serveur, sinon Caddy.
- **Polices et icônes hébergées localement** : aucune requête vers un CDN ou un service tiers.

---

## 4. Le périmètre

### V1 — Le lancement (ce que j'utilise dès le premier jour)

1. **Connexion** : un seul compte, mot de passe haché (argon2id), session longue (cookie `HttpOnly`, `Secure`, `SameSite=Lax`, 90 jours), limitation des tentatives.
2. **L'écran Aujourd'hui** : date, grade et barre d'expérience ; la mission S en cours ; la lecture du jour avec bouton « Écouter » ; le mantra en grand ; mes missions du jour à cocher ; mes quêtes du jour ; le bouton du serment ; le bilan du soir (mis en avant à partir de l'heure réglée).
3. **Les missions** : créer, modifier, classer de D à S, rattacher à un front, dater, planifier pour un jour, cocher, abandonner, mettre en réserve avec une condition de départ, marquer comme test avec une date de bilan. **Une seule mission S active à la fois** : la deuxième est refusée avec un message clair.
4. **L'expérience et les grades** : calculés à partir d'un journal d'événements (jamais un compteur modifié à la main). Passage de grade affiché sobrement.
5. **Les quêtes** : le défi des 100 jours (du 1er septembre au 9 décembre 2026). Chaque jour : « Tenu » ou « Incartade ». Une incartade ne remet pas la quête à zéro et ne retire pas d'expérience : elle est notée, c'est tout. Paliers aux jours 30, 50, 75 et 100.
6. **Le rattrapage du défi** : le défi a commencé avant l'app. À la création de la quête, je peux marquer en une fois les jours déjà passés comme « Tenu », puis corriger un jour précis si besoin.
7. **Le bilan du soir** : trois questions (qu'ai-je bien fait, où ai-je manqué à un principe et que je corrige demain, ai-je tenu ma parole), enregistrées et relisibles.
8. **La bibliothèque** : les livrets PDF, les lectures par phase, les lectures de secours accessibles en un geste.
9. **La lecture à voix haute** : de la lecture du jour, du mantra et du serment.
10. **Le hors-ligne en lecture** : lectures, livrets et dernier état de l'écran Aujourd'hui consultables sans réseau. Les modifications demandent le réseau en V1, avec un message clair si je suis hors ligne.
11. **Les réglages** : horaires des rituels, choix de la voix, vitesse de lecture, objectif de pas (pour la V2), export de toutes mes données en JSON, déconnexion.
12. **La sauvegarde** : une copie quotidienne de la base, gardée 30 jours, et une procédure de restauration testée.

### V2 — Les liaisons

- **Les pas** : un raccourci iPhone (app Raccourcis) envoie chaque soir mon nombre de pas à une route sécurisée par jeton (`annexes/04-raccourci-pas-iphone.md`). Quête « pas quotidiens » avec objectif réglable.
- **Les notifications Web Push** (iOS 16.4+, app installée) : rappel du rituel et du bilan aux heures réglées. Jamais plus de deux par jour.
- **La file hors ligne** : les cases cochées hors ligne sont mises en attente et envoyées au retour du réseau.
- **La revue du dimanche** : missions accomplies, expérience gagnée, ce qui a glissé, choix des missions de la semaine.
- **L'agenda** : export d'une mission datée vers Google Agenda (fichier .ics ou lien).
- **Les statistiques** : régularité, missions par front, courbe d'expérience.

### V3 — Les extensions (ne pas coder, seulement ne pas bloquer)

- Un conseiller branché sur mon infrastructure Hermès (Ollama Cloud), qui lit mes livrets et ma campagne.
- Les rappels et le bilan via mon bot Telegram.
- Le suivi de mes trois enveloppes budget.

---

## 5. Les règles du jeu

### Les rangs et l'expérience

| Rang | Sens | Expérience |
| --- | --- | --- |
| S | Change le cours de ma vie. Une seule à la fois | 500 |
| A | Fait avancer un front majeur | 150 |
| B | Étape nécessaire, sans laquelle le reste bloque | 50 |
| C | Utile, fait progresser | 25 |
| D | Le quotidien, la discipline | 10 |

- **Rituels quotidiens** (rang D, automatiques) : lecture du jour lue ou écoutée, serment récité, bilan du soir rempli. 10 XP chacun, une fois par jour.
- **Quêtes** : 10 XP par jour tenu. Bonus de palier : jour 30 = 50 XP, jour 50 = 75 XP, jour 75 = 100 XP, jour 100 = 300 XP.
- **Une mission abandonnée ou en retard ne retire jamais d'expérience.** Un principe trahi se répare, il ne se punit pas.
- **Décocher une mission** annule l'événement d'expérience correspondant (correction d'erreur, pas punition).

### Les grades (la voie du sabre)

| Grade | Seuil d'XP |
| --- | --- |
| Aspirant | 0 |
| Ashigaru | 300 |
| Rōnin | 1 000 |
| Samouraï | 3 000 |
| Hatamoto | 7 000 |
| Maître d'armes | 12 000 |
| Kensei | 20 000 |

### La lecture du jour

- Chaque lecture appartient à une **phase** (période de ma campagne avec une date de début et de fin) ou au groupe **secours** (avec des étiquettes de situation).
- La lecture du jour est choisie **dans la phase en cours**, en rotation déterministe : même lecture toute la journée, ordre stable, aucune répétition avant d'avoir fait le tour de la phase.
- Si aucune phase ne couvre la date du jour, ou si la phase en cours n'a pas encore de lectures, l'app reprend la dernière phase qui en a et affiche discrètement « Phase à mettre à jour ».
- Je peux passer à la lecture suivante d'un geste, sans gagner d'XP en double.
- L'action du jour d'une lecture peut devenir une mission en un geste (rang D par défaut, modifiable).

---

## 6. Le ton de l'interface

- **Sobre et respectueux.** Pas de confettis, pas de sons, pas de messages culpabilisants (« tu as raté… »). Une incartade s'écrit « Noté. Demain, je reprends. »
- **Prévisible.** Les éléments restent toujours à la même place. Pas de pop-up surprise. Les actions destructrices demandent une confirmation.
- **Rédigé au je** quand l'app me parle de moi : « Ma Voie », « Mes missions », « Mon bilan ».
- **Exemples de messages** :
  - Verrou S : « Une seule mission S à la fois. Je termine ou je mets en réserve “[titre]” avant d'en ouvrir une autre. »
  - Passage de grade : « Nouveau grade : Rōnin. Je me bats contre qui j'étais hier. »
  - Hors ligne : « Pas de réseau. Je peux lire, mais pas enregistrer pour l'instant. »

---

## 7. Données de départ (`seed/`)

| Fichier | Contenu |
| --- | --- |
| `fronts.json` | Mes 6 fronts actifs et 3 projets en réserve |
| `grades.json` | Grades, seuils, XP par rang, bonus de quête |
| `missions.json` | Mes missions réelles de novembre 2026 |
| `quests.json` | Le défi des 100 jours (la quête des pas est créée à la V2) |
| `phases.json` | Les phases de ma campagne : « Négociation » et « Préparation » |
| `readings.json` | 12 lectures de la phase « Négociation » et 7 lectures de secours |
| `serment.json` | Le texte du serment et du bilan du soir |

Le script de seed doit être **idempotent** (relançable sans créer de doublons, clé : `slug`) et ne jamais écraser une donnée que j'ai modifiée dans l'app.

Les lectures et les phases s'enrichiront souvent. Prévois une commande simple pour **importer un nouveau fichier de lectures** (même format) sans toucher au reste.

---

## 8. Sécurité et vie privée

- HTTPS obligatoire, en-têtes de sécurité (CSP stricte, HSTS, `X-Content-Type-Options`, `Referrer-Policy`).
- Aucune donnée envoyée à un service tiers. Pas de traceur, pas d'analytics.
- Le fichier SQLite et les sauvegardes ne sont accessibles qu'au conteneur et à root.
- Les variables sensibles (`SESSION_SECRET`, hash du mot de passe initial, jeton des pas) sont dans un `.env` hors du dépôt, avec un `.env.example` sans valeurs.
- Le mot de passe initial se crée par une commande que je lance moi-même sur le serveur (`npm run create-user` ou équivalent), qui me le demande en saisie masquée.
- Le dépôt Git est privé : il contient mes missions réelles.

---

## 9. Les étapes de développement

Chaque étape se termine par une démonstration et mon feu vert.

| Étape | Contenu | C'est fini quand… |
| --- | --- | --- |
| 0. Reconnaissance | Tu inspectes mon serveur en lecture seule : version de Docker, conteneurs en place, ports 80/443, reverse proxy existant, espace disque | Tu me rends un état des lieux et ta proposition de déploiement, sans rien avoir modifié |
| 1. Fondations | Projet SvelteKit, Docker, base SQLite, migrations, design tokens, polices et icônes locales | L'app démarre en local et affiche une page vide aux couleurs du Dojo |
| 2. Données | Modèle de données, seed, tests de la logique XP / grades / verrou S / dates | Les tests passent ; le seed se relance sans doublons |
| 3. Aujourd'hui | L'écran principal complet, lecture du jour, voix | Je vois ma lecture, je l'écoute, je coche une mission et mon XP bouge |
| 4. Missions | Liste, filtres, création, réserve, tests, verrou S | Je gère mes missions de novembre depuis mon téléphone |
| 5. Quêtes et bilan | Défi des 100 jours avec rattrapage, bilan du soir, historique | Mon défi affiche le bon jour et mes paliers |
| 6. Bibliothèque | Livrets, lectures par phase, secours, import de lectures | J'ouvre mon livret hors ligne |
| 7. PWA et connexion | Installation iPhone, hors-ligne en lecture, authentification | L'app s'installe sur mon écran d'accueil et demande ma connexion |
| 8. Déploiement | Mise en ligne sur le VPS, HTTPS, sauvegarde quotidienne, restauration testée | J'utilise l'app en vrai, et une restauration a été testée |
| 9. V2 | Une fonction à la fois, dans l'ordre : pas, notifications, file hors ligne, revue du dimanche, agenda, statistiques | À définir avec moi |

---

## 10. Les critères d'acceptation de la V1

- [ ] L'app s'installe sur l'écran d'accueil de mon iPhone et s'ouvre en plein écran, sans barre Safari.
- [ ] L'écran Aujourd'hui s'affiche en moins de 2 secondes en 4G.
- [ ] La lecture du jour change à minuit (heure de Paris) et reste la même toute la journée.
- [ ] Le bouton « Écouter » lit le texte en français ; je peux mettre en pause et choisir la voix.
- [ ] Impossible d'avoir deux missions S actives, y compris en appelant l'API directement.
- [ ] Le défi des 100 jours affiche le bon numéro de jour (le 2 novembre 2026 = jour 63) et se termine le 9 décembre 2026 (jour 100).
- [ ] Une incartade ne retire pas d'XP et ne remet pas la quête à zéro.
- [ ] L'XP total est toujours égal à la somme du journal d'événements.
- [ ] Les livrets et les lectures s'ouvrent sans réseau après une première visite.
- [ ] L'export JSON contient toutes mes données et peut être réimporté sur une installation neuve.
- [ ] La sauvegarde quotidienne existe et une restauration a été testée devant moi.
- [ ] Aucun texte en anglais dans l'interface ; aucune requête réseau vers un domaine tiers.

---

## 11. Les annexes

| Fichier | Contenu |
| --- | --- |
| `annexes/01-modele-de-donnees.md` | Tables, champs, règles, routes de l'API |
| `annexes/02-ecrans.md` | Chaque écran, son contenu, ses actions |
| `annexes/03-design.md` | Couleurs, typographie, icônes, composants |
| `annexes/04-raccourci-pas-iphone.md` | Le raccourci iPhone pour envoyer mes pas (V2) |
| `annexes/05-deploiement-vps.md` | Déploiement, sauvegarde, restauration |
| `assets/icons/` | Les 6 symboles Adinkra (licence Apache 2.0, voir `LICENSE-adinkra-icons`) |
| `assets/reference/` | Le PDF du Livret 1, partie 1 : référence visuelle et contenu de la bibliothèque |

# Règles de travail — Le Dojo

Ce fichier est lu par Claude Code à chaque session. Le brief complet est dans `BRIEF.md`.

## Communication
- Tu me parles en français, de façon directe et structurée, sans remplissage.
- Une question à la fois quand tu as besoin de moi, avec ta recommandation en premier.
- Avant chaque étape du brief (partie 9) : ton plan en 5 lignes maximum. Après : ce qui marche, comment le tester sur iPhone, ce qui reste. Puis tu attends mon feu vert.

## Code
- TypeScript strict. Pas de `any` sans commentaire qui le justifie.
- Toute la logique de dates passe par une seule fonction utilitaire en fuseau `Europe/Paris`.
- L'expérience se calcule toujours depuis la table `xp_events`. Jamais de compteur stocké modifié à la main.
- Le verrou « une seule mission S active » est appliqué côté serveur, dans la même transaction que l'écriture.
- Chaque règle métier (XP, grades, paliers, verrou S, lecture du jour, numéro de jour d'une quête) a ses tests Vitest.
- Textes de l'interface en français, centralisés dans un fichier de libellés.
- Pas de dépendance chargée depuis un CDN. Polices et icônes servies par l'app.

## Serveur
- Étape 0 en lecture seule : tu observes, tu ne modifies rien.
- Tu ne redémarres, ne modifies et ne supprimes aucun conteneur, volume, réseau ou fichier de configuration existant sans mon accord explicite pour cette action précise.
- Avant une commande destructrice ou irréversible, tu me la montres et tu attends mon « oui ».

## Secrets
- Aucun mot de passe, clé ou jeton dans le code, les commits, les logs ou la conversation.
- Les secrets vivent dans `.env` (ignoré par Git). Tu fournis un `.env.example` sans valeurs.
- Je crée moi-même le mot de passe initial avec la commande prévue, en saisie masquée.

## Git
- Dépôt privé. Commits petits et en français : `étape 3 : écran Aujourd'hui`.
- Le fichier SQLite, les sauvegardes et `.env` ne sont jamais commités.

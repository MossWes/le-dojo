# Le Dojo

Mon système de stratégie personnelle. Le brief complet est dans `BRIEF.md`, les règles de travail dans `CLAUDE.md`.

## Stack
SvelteKit 2 (TypeScript strict, `adapter-node`) · SQLite + Drizzle ORM · Vitest · Docker derrière Traefik.

## Commandes
| Commande | Rôle |
| --- | --- |
| `npm install` | installer les dépendances (Node 22) |
| `npm run dev` | lancer en développement (http://localhost:5173) |
| `npm run check` | vérifier les types |
| `npm test` | lancer les tests |
| `npm run build` puis `npm start` | lancer la version de production (port 3000) |
| `npm run db:generate` | créer une migration après un changement de `src/lib/server/db/schema.ts` |
| `npm run seed` | charger les données de `seed/` (relançable, n'écrase jamais mes modifications) |
| `npm run import-readings -- fichier.json` | importer un nouveau fichier de lectures ou de phases |

Les migrations s'appliquent toutes seules au démarrage. La base est créée dans `./data/dojo.sqlite` (variable `DATABASE_PATH`). Elle n'est jamais commitée.

## Sur le serveur (Docker)
```bash
docker compose exec app node build/cli/seed.js
docker compose exec -T app node build/cli/import-readings.js - < nouvelles-lectures.json
```

## Règles du seed
- Fronts, missions, quêtes : créés **une seule fois**. Si je les modifie ou les supprime dans l'app, le seed ne les recrée pas et ne les écrase pas (table `seed_log`).
- Phases et lectures : contenu géré par fichiers, mis à jour par `slug` à chaque import.
- Le compte est créé sans mot de passe ; le mot de passe se définit avec la commande de l'étape 7.

## Organisation
- `src/lib/styles/tokens.css` : **seul** fichier où sont définies couleurs, polices et tailles (un test le vérifie).
- `src/lib/labels.ts` : tous les textes de l'interface, en français.
- `src/lib/dates.ts` : **seule** logique de dates (fuseau Europe/Paris).
- `src/lib/rules.ts`, `src/lib/daily-reading.ts` : règles du jeu (fonctions pures, testées).
- `src/lib/server/services/` : missions (verrou S), quêtes, rituels, XP.
- `src/lib/server/db/` : schéma, connexion, migrations (`drizzle/`).
- `src/cli/` : commandes `seed` et `import-readings`.
- `assets/icons/` : symboles Adinkra (licence Apache 2.0), intégrés à l'app au build.

## Déploiement
Voir `annexes/05-deploiement-vps.md` et `docs/00-etat-des-lieux.md`. La procédure complète (domaine, sauvegarde, restauration) sera écrite à l'étape 8.

Icônes Adinkra : Adinkra Icons, licence Apache 2.0 (`assets/icons/LICENSE-adinkra-icons`).

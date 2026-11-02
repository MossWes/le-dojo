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
| `npm run db:migrate` | appliquer les migrations (aussi fait au démarrage de l'app) |

La base est créée dans `./data/dojo.sqlite` (variable `DATABASE_PATH`). Elle n'est jamais commitée.

## Organisation
- `src/lib/styles/tokens.css` : **seul** fichier où sont définies couleurs, polices et tailles (un test le vérifie).
- `src/lib/labels.ts` : tous les textes de l'interface, en français.
- `src/lib/server/db/` : schéma, connexion, migrations (`drizzle/`).
- `assets/icons/` : symboles Adinkra (licence Apache 2.0), intégrés à l'app au build.

## Déploiement
Voir `annexes/05-deploiement-vps.md` et `docs/00-etat-des-lieux.md`. La procédure complète (domaine, sauvegarde, restauration) sera écrite à l'étape 8.

Icônes Adinkra : Adinkra Icons, licence Apache 2.0 (`assets/icons/LICENSE-adinkra-icons`).

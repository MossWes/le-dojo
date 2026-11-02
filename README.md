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
| `npm run create-user` | définir ou changer mon mot de passe (saisie masquée, déconnecte les autres appareils) |

Les migrations s'appliquent toutes seules au démarrage. La base est créée dans `./data/dojo.sqlite` (variable `DATABASE_PATH`). Elle n'est jamais commitée.

## Sur le serveur (Docker)
```bash
docker compose exec app node build/cli/seed.js
docker compose exec -T app node build/cli/import-readings.js - < nouvelles-lectures.json
docker compose exec app node build/cli/create-user.js
# Réinstaller depuis un export JSON (base neuve uniquement), puis create-user :
docker compose exec -T app node build/cli/import-data.js - < le-dojo-export.json
```

## Livrets
Les PDF suivent le nom `Le_Dojo_Livret{N}_{Anneau}_P{partie}_{Titre}.pdf` (ex. `Le_Dojo_Livret2_Eau_P1_Le_Chemin.pdf`).
Je les dépose dans `data/livrets/` sur le serveur : ils apparaissent dans la Bibliothèque sans redéployer.

## Sécurité
- Connexion : mot de passe argon2id, cookie `HttpOnly` / `Secure` / `SameSite=Lax`, session de 90 jours prolongée à l'usage.
- 5 essais ratés par adresse en 15 minutes, 20 au total par heure, puis attente.
- CSP stricte, HSTS, aucune ressource externe. Les PDF et toutes les pages exigent la connexion.

## Règles du seed
- Fronts, missions, quêtes : créés **une seule fois**. Si je les modifie ou les supprime dans l'app, le seed ne les recrée pas et ne les écrase pas (table `seed_log`).
- Phases et lectures : contenu géré par fichiers, mis à jour par `slug` à chaque import.
- Le compte est créé sans mot de passe ; le mot de passe se définit avec la commande de l'étape 7.

## V2
- **Pas** : raccourci iPhone → `POST /api/integrations/steps` (jeton Bearer, créé dans Moi, stocké haché, 10 envois/heure). Guide : `docs/raccourci-pas.md`.
- **Rappels** : Web Push (clés VAPID dans `.env`), rituel du matin et bilan du soir, jamais plus de deux par jour.
- **File hors ligne** : les cases cochées sans réseau partent au retour du réseau.
- **Revue du dimanche** : Moi → Ma revue du dimanche (aussi dans le bloc du soir le dimanche).
- **Agenda** : fiche d'une mission datée → fichier `.ics` ou lien Google Agenda.
- **Statistiques** : Moi → Mes statistiques.

## Organisation
- `src/lib/styles/tokens.css` : **seul** fichier où sont définies couleurs, polices et tailles (un test le vérifie).
- `src/lib/labels.ts` : tous les textes de l'interface, en français.
- `src/lib/dates.ts` : **seule** logique de dates (fuseau Europe/Paris).
- `src/lib/rules.ts`, `src/lib/daily-reading.ts` : règles du jeu (fonctions pures, testées).
- `src/lib/server/services/` : missions (verrou S), quêtes, rituels, XP.
- `src/lib/server/db/` : schéma, connexion, migrations (`drizzle/`).
- `src/cli/` : commandes `seed`, `import-readings`, `create-user`, `import-data`, `generate-vapid`.
- `src/service-worker.ts` : lecture hors ligne (pages vues, lectures, livrets).
- `scripts/make-icons.cjs` : régénère les icônes de l'app (outil de développement).
- `assets/icons/` : symboles Adinkra (licence Apache 2.0), intégrés à l'app au build.

## Déploiement
Procédure complète pas à pas : **`docs/deploiement.md`** (domaine, installation, iPhone, sauvegarde, restauration, mise à jour).

- Sauvegarde : service `backup`, chaque nuit à 2 h (Paris), copie cohérente vérifiée, gardée 30 jours dans `backups/`.
- Restauration : `sudo scripts/restore.sh backups/dojo-….sqlite.gz` (la base remplacée est gardée à part).
- Mise à jour : `sudo scripts/update.sh`.

Icônes Adinkra : Adinkra Icons, licence Apache 2.0 (`assets/icons/LICENSE-adinkra-icons`).

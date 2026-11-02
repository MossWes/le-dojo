# Annexe 1 — Modèle de données et API

Toutes les dates « jour » sont des chaînes `YYYY-MM-DD` calculées en fuseau `Europe/Paris`. Les horodatages sont en ISO 8601 UTC. Chaque table porte `id`, `created_at`, `updated_at`. Chaque table liée à un utilisateur porte `user_id` (un seul utilisateur en V1, mais la colonne existe).

## 1. Tables

### `users`
| Champ | Type | Règle |
| --- | --- | --- |
| `name` | texte | « Wesley » |
| `password_hash` | texte | argon2id |
| `settings` | JSON | voir ci-dessous |

`settings` :
```json
{
  "timezone": "Europe/Paris",
  "ritual_morning_time": "03:30",
  "ritual_morning_mode": "mantra_only",
  "ritual_evening_start": "20:00",
  "ritual_evening_end": "22:30",
  "voice_name": null,
  "voice_rate": 0.95,
  "steps_goal": 8000
}
```
`ritual_morning_mode` : `mantra_only` (tant que je travaille de nuit) ou `full` (serment complet le matin).

### `fronts`
| Champ | Type | Règle |
| --- | --- | --- |
| `slug` | texte unique | ex. `wash31` |
| `name` | texte | ex. « Wash 31 » |
| `description` | texte | |
| `status` | `active` \| `reserve` | |
| `sort_order` | entier | |

### `missions`
| Champ | Type | Règle |
| --- | --- | --- |
| `slug` | texte unique, nullable | renseigné pour les missions du seed |
| `title` | texte | obligatoire |
| `notes` | texte | |
| `rank` | `D` \| `C` \| `B` \| `A` \| `S` | |
| `front_id` | FK `fronts` | nullable |
| `status` | `todo` \| `doing` \| `done` \| `dropped` \| `reserve` | |
| `due_date` | jour | échéance |
| `planned_date` | jour | jour où je prévois de la faire (alimente « Mes missions du jour ») |
| `start_condition` | texte | obligatoire si `status = reserve` |
| `is_test` | booléen | une voie testée à petit coût |
| `review_date` | jour | obligatoire si `is_test` |
| `parent_id` | FK `missions` | sous-missions, un seul niveau |
| `done_at` | horodatage | |
| `source` | `manual` \| `seed` \| `reading` | |

**Verrou S** : au plus une mission `rank = S` avec `status` dans (`todo`, `doing`) par utilisateur. Vérifié côté serveur dans la transaction ; erreur HTTP 409 avec le code `S_LOCK` et le titre de la mission S active.

**« Mes missions du jour »** = missions non terminées dont `planned_date` ≤ aujourd'hui, ou dont `due_date` = aujourd'hui, triées par rang (S → D) puis échéance.

### `xp_events`
| Champ | Type | Règle |
| --- | --- | --- |
| `day` | jour | |
| `kind` | `mission` \| `ritual` \| `quest_day` \| `quest_milestone` | |
| `ref_type`, `ref_id` | texte, entier | objet à l'origine |
| `ritual` | `reading` \| `oath` \| `evening_review` | si `kind = ritual` |
| `amount` | entier | positif |
| `revoked_at` | horodatage | nullable : une mission décochée révoque son événement |

- XP total = somme des `amount` non révoqués.
- Unicité : un seul événement actif par (`kind`, `ref_type`, `ref_id`, `day`) pour les rituels et les jours de quête, et un seul par mission.

### `quests`
| Champ | Type | Règle |
| --- | --- | --- |
| `slug` | texte unique | |
| `title` | texte | |
| `kind` | `daily_hold` \| `daily_steps` | |
| `start_date` | jour | |
| `length_days` | entier | nullable (quête sans fin) |
| `milestones` | JSON | `[{"day":30,"xp":50},…]` |
| `xp_per_day` | entier | |
| `status` | `active` \| `done` \| `archived` | |

Numéro du jour = nombre de jours entre `start_date` et aujourd'hui, + 1. Fin = `start_date` + `length_days` − 1.

### `quest_logs`
| Champ | Type | Règle |
| --- | --- | --- |
| `quest_id` | FK | |
| `day` | jour | unique par quête |
| `status` | `held` \| `slip` \| `logged` | `slip` = incartade ; `logged` = pas enregistrés sous l'objectif (quête des pas), sans XP ni reproche |
| `value` | entier | nombre de pas pour `daily_steps` |
| `note` | texte | |

- Un jour `held` → événement `quest_day`. Un `slip` → aucun événement, rien n'est retiré.
- Palier : versé une seule fois, quand le jour N du palier reçoit un log (`held` ou `slip`). Le palier récompense la constance dans la durée, pas la perfection.
- **Rattrapage** : une action marque `held` tous les jours sans log entre `start_date` et hier.

### `phases`
| Champ | Type | Règle |
| --- | --- | --- |
| `slug` | texte unique | |
| `name` | texte | |
| `start_date`, `end_date` | jour | |
| `description` | texte | |

### `readings`
| Champ | Type | Règle |
| --- | --- | --- |
| `slug` | texte unique | |
| `group` | `phase` \| `secours` | |
| `phase_slug` | texte | si `group = phase` |
| `situations` | JSON | étiquettes : `colere`, `doute`, `fatigue`, `peur-echec`, `famille`, `tentation`, `attente` |
| `order` | entier | ordre dans la phase |
| `pillar` | `musashi` \| `tolteques` \| `sun-tzu` \| `stoicisme` \| `bushido` | |
| `source` | texte | ex. « Épictète, Manuel, I » |
| `quote` | texte | nullable |
| `quote_kind` | `citation` \| `reformulation` | une citation exacte porte sa traduction dans `source` |
| `title` | texte | |
| `body` | texte | ma traduction au je |
| `mantra` | texte | |
| `action` | texte | |
| `evening_question` | texte | |
| `symbol` | texte | nom d'une icône de `assets/icons/` |

### `reading_views`
`day`, `reading_id`, `listened` (booléen). Sert à la rotation et au rituel « lecture ».

### `evening_reviews`
| Champ | Type |
| --- | --- |
| `day` | jour, unique |
| `did_well` | texte |
| `missed_principle` | texte |
| `fix_tomorrow` | texte |
| `kept_word` | `oui` \| `en_partie` \| `non` |
| `energy` | entier 1 à 5, facultatif |

### `oath_logs`
`day` unique. Sert au rituel « serment ».

### `push_subscriptions` (V2) et `api_tokens` (V2, pour le raccourci des pas, jeton haché).

## 2. Lecture du jour

1. Trouver la phase dont `start_date` ≤ aujourd'hui ≤ `end_date`. Si aucune phase ne couvre la date, ou si la phase en cours n'a encore aucune lecture, prendre la dernière phase qui en a, avec l'indicateur « Phase à mettre à jour ».
2. Lister ses lectures par `order`.
3. Index = (nombre de jours depuis `start_date` de la phase) modulo (nombre de lectures).
4. Si l'utilisateur demande « lecture suivante », afficher la suivante dans l'ordre, sans créer de second événement XP « lecture ».

Fonction pure, testée.

## 3. Routes de l'API

Toutes sous `/api`, JSON, protégées par la session (sauf `/api/auth/login` et la route des pas, protégée par jeton).

| Méthode | Route | Rôle |
| --- | --- | --- |
| POST | `/auth/login` | connexion |
| POST | `/auth/logout` | déconnexion |
| GET | `/today` | tout l'écran Aujourd'hui en un appel : date, grade, XP, mission S, lecture du jour, missions du jour, quêtes du jour, état des rituels |
| GET | `/missions?status=&rank=&front=` | liste filtrée |
| POST | `/missions` | création (verrou S) |
| PATCH | `/missions/:id` | modification, changement de statut (verrou S, XP) |
| DELETE | `/missions/:id` | suppression avec confirmation côté client |
| GET | `/fronts` | liste |
| GET | `/quests` | liste avec numéro du jour et paliers |
| PUT | `/quests/:id/days/:day` | `held` ou `slip`, avec note |
| POST | `/quests/:id/backfill` | rattrapage jusqu'à hier |
| GET | `/readings?group=&phase=&situation=` | bibliothèque |
| POST | `/readings/:id/view` | lecture vue ou écoutée (rituel) |
| POST | `/readings/:id/to-mission` | l'action devient une mission |
| POST | `/rituals/oath` | serment récité |
| GET, PUT | `/reviews/:day` | bilan du soir |
| GET | `/progress` | grade, seuils, historique XP |
| GET, PATCH | `/settings` | réglages |
| GET | `/export` | export complet JSON |
| POST | `/integrations/steps` (V2) | `{ "date": "YYYY-MM-DD", "steps": 9123 }`, jeton Bearer |

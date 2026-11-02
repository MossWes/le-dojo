# Étape 0 — État des lieux du VPS (2 novembre 2026)

Relevé en lecture seule. Rien n'a été modifié.

## Système
- Ubuntu 24.04.4 LTS, Docker 29.4.3, Docker Compose v5.1.3.
- Disque : 44 Go libres sur 96 Go. Mémoire : 6,5 Go disponibles sur 7,8 Go, pas de swap.

## Ce qui tourne (on n'y touche pas)
| Projet Compose | Conteneurs | Ports publiés |
| --- | --- | --- |
| `hermes-agent-tl0g` | hermes-agent (Hostinger) | 32770 |
| `hermes-webui-viug` | hermes-webui, hermes-agent | 32771 |
| `hermes-telegram` | bot Telegram | — |
| `ollama-1cxu` | ollama | 32769 |
| (hors Compose) | qdrant | 6333-6334 |
| `traefik` | traefik | 80, 443 (réseau hôte) |

## Reverse proxy : Traefik (cas 1)
- `network_mode: host`, fournisseur Docker activé, `exposedbydefault=false`.
- Entrées : `web` (:80, redirigée vers HTTPS) et `websecure` (:443).
- Certificats : résolveur `letsencrypt`, défi HTTP sur `web`.

## Branchement prévu du Dojo
Aucune modification de Traefik. Le conteneur du Dojo porte ces étiquettes :

```yaml
labels:
  - traefik.enable=true
  - traefik.http.routers.dojo.rule=Host(`<domaine>`)
  - traefik.http.routers.dojo.entrypoints=websecure
  - traefik.http.routers.dojo.tls.certresolver=letsencrypt
  - traefik.http.services.dojo.loadbalancer.server.port=3000
```

- Aucun port publié par le Dojo : seul Traefik le joint.
- Prérequis : l'enregistrement DNS A du domaine pointe vers le VPS **avant** le premier démarrage (défi HTTP).
- En-têtes de sécurité (CSP, HSTS…) posés par l'app elle-même.
- Arborescence : `/opt/le-dojo/` (annexe 5).

## À surveiller (hors périmètre du Dojo)
- Qdrant, Ollama et Hermès écoutent sur toutes les interfaces : à vérifier côté pare-feu.
- Traefik utilise l'image `traefik:latest` : une mise à jour majeure pourrait changer son comportement.

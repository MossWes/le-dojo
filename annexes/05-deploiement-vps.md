# Annexe 5 — Déploiement sur mon VPS

## 1. Ce qu'on sait du serveur

- VPS Hostinger KVM 8, Linux.
- Des conteneurs Docker tournent déjà : Hermès WebUI, Hermès Agent, Qdrant, mon bot Telegram, peut-être d'autres. **On n'y touche pas.**
- Le reverse proxy en place (s'il y en a un) est inconnu : l'étape 0 le détermine.

## 2. Étape 0 : la reconnaissance (lecture seule)

Commandes autorisées sans demander : `docker ps`, `docker network ls`, `docker compose ls`, `ss -tlnp`, `df -h`, `free -h`, `cat /etc/os-release`, lecture des fichiers de configuration du proxy.

Livrable : un état des lieux en français (ce qui tourne, qui écoute sur 80/443, place disponible) et une proposition :
- **cas 1**, un reverse proxy existe (Nginx, Caddy, Traefik, Nginx Proxy Manager) : on y ajoute une route vers le Dojo ;
- **cas 2**, rien n'écoute sur 80/443 : on ajoute un conteneur Caddy dédié avec HTTPS automatique.

## 3. L'arborescence sur le serveur

```
/opt/le-dojo/
  docker-compose.yml
  .env                 # secrets, droits 600, jamais commité
  data/dojo.sqlite     # la base, volume
  data/livrets/        # PDF des livrets
  backups/             # sauvegardes quotidiennes
```

## 4. Le domaine

Je choisis à l'étape 8 : un sous-domaine d'un domaine que je possède (par exemple `dojo.mondomaine.fr`) ou un nouveau domaine. Claude Code me donne l'enregistrement DNS exact à créer (type A vers l'IP du VPS) et attend que je confirme qu'il est en place.

## 5. La sauvegarde

- Un service `backup` dans le même `docker-compose.yml` : chaque nuit à 2 h (heure de Paris), copie cohérente de la base avec `sqlite3 .backup` (ou `VACUUM INTO`), compressée, horodatée, dans `/opt/le-dojo/backups/`.
- Rétention : 30 jours.
- Option plus tard : envoi d'une copie vers mon stockage distant avec rclone (je l'utilise déjà).
- **Restauration** : une commande documentée dans le README du dépôt, testée devant moi à l'étape 8 sur une copie.

## 6. Mise à jour de l'app

Une commande unique, documentée : récupérer la nouvelle version, reconstruire l'image, relancer le conteneur, appliquer les migrations. La base n'est jamais recréée.

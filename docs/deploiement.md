# Mise en ligne du Dojo sur mon VPS

Tout se fait en SSH sur le serveur, en `root`. Chaque bloc est à copier tel quel.
Rien ici ne touche à Hermès, Ollama, Qdrant, au bot Telegram ni à la configuration de Traefik.

> Je ne colle jamais un mot de passe, une clé ou un jeton dans une conversation.

---

## 1. Le domaine (une seule fois)

**Choix actuel : adresse gratuite sslip.io, sans inscription ni réglage DNS.**
`ledojo.76-13-60-29.sslip.io` pointe déjà vers le VPS : je passe directement à l'étape 2
et je mets `DOJO_DOMAIN=ledojo.76-13-60-29.sslip.io` dans `.env`.

Si le certificat HTTPS échoue (message « too many certificates » dans
`docker logs traefik-traefik-1`, limite partagée par tous les utilisateurs de sslip.io),
je passe sur un sous-domaine d'un domaine que je possède, comme ci-dessous,
puis je change `DOJO_DOMAIN` dans `.env` et je relance `docker compose up -d`.

**Variante : sous-domaine d'un domaine à moi.**

Je choisis un sous-domaine, par exemple `dojo.mondomaine.fr`.
Chez mon registraire (ou Hostinger), je crée un enregistrement **DNS de type A** :

| Type | Nom | Valeur | TTL |
| --- | --- | --- | --- |
| A | `dojo` | l'adresse IPv4 du VPS | 3600 |

Je vérifie qu'il est en place (la commande doit afficher l'IP du VPS) :

```bash
getent hosts dojo.mondomaine.fr
```

**Je ne passe à la suite que lorsque c'est bon** : Traefik a besoin du DNS pour obtenir le certificat HTTPS.

## 2. Récupérer le code (dépôt privé)

Une clé de déploiement en lecture seule, propre au serveur :

```bash
ssh-keygen -t ed25519 -f /root/.ssh/le-dojo-deploy -N "" -C "le-dojo VPS"
cat /root/.ssh/le-dojo-deploy.pub
```

Sur GitHub : dépôt `le-dojo` → Settings → Deploy keys → Add deploy key → je colle la clé **publique** (`.pub`), sans cocher « Allow write access ».

```bash
cat >> /root/.ssh/config <<'CONF'
Host github-le-dojo
  HostName github.com
  User git
  IdentityFile /root/.ssh/le-dojo-deploy
  IdentitiesOnly yes
CONF
git clone git@github-le-dojo:MossWes/le-dojo.git /opt/le-dojo
cd /opt/le-dojo
```

## 3. Les secrets et les dossiers

```bash
cd /opt/le-dojo
cp .env.example .env
chmod 600 .env
sed -i "s/^SESSION_SECRET=.*/SESSION_SECRET=$(openssl rand -hex 32)/" .env
nano .env        # je remplis DOJO_DOMAIN=dojo.mondomaine.fr, puis Ctrl+O, Entrée, Ctrl+X
mkdir -p data/livrets backups
chown -R 1000:1000 data backups
chmod 700 data backups
```

## 4. Démarrer

```bash
cd /opt/le-dojo
docker compose up -d --build
docker compose ps          # « app » doit passer à (healthy) en moins d'une minute
docker compose exec app node build/cli/seed.js
docker compose exec app node build/cli/create-user.js    # mon mot de passe, saisie masquée
```

J'ouvre `https://dojo.mondomaine.fr` : la page de connexion s'affiche avec le cadenas HTTPS.
Le premier certificat peut prendre une minute.

## 5. Installer sur l'iPhone

1. Safari → `https://dojo.mondomaine.fr` → je me connecte.
2. Bouton Partager → « Sur l'écran d'accueil » → Ajouter.
3. J'ouvre Le Dojo depuis l'icône : plein écran, sans barre Safari.
4. Pour la voix : Réglages iPhone → Accessibilité → Contenu énoncé → Voix → Français → je télécharge une voix « améliorée ».
   Puis dans le Dojo : Moi → Réglages → Voix → je choisis, je teste.

## 6. Sauvegarde et restauration (à tester une fois, devant moi)

La sauvegarde tourne seule chaque nuit à 2 h (heure de Paris), gardée 30 jours, dans `/opt/le-dojo/backups/`.

**Test de restauration :**

```bash
cd /opt/le-dojo
docker compose exec backup /usr/local/bin/backup.sh     # 1. sauvegarde maintenant
ls -lt backups | head -3                                 # 2. je note son nom
```

3. Dans l'app, je note mon XP, puis je coche une mission : l'XP bouge.

```bash
sudo scripts/restore.sh backups/dojo-AAAA-MM-JJ_HHMM.sqlite.gz   # 4. je tape OUI
```

5. Je recharge l'app : l'XP est revenue à la valeur notée. La base remplacée est gardée dans `data/avant-restauration-…/`.

Le journal des sauvegardes : `docker compose logs backup`.

**Copie hors du serveur (facultatif, plus tard)** : j'utilise déjà rclone, par exemple chaque nuit à 3 h :
`0 3 * * * rclone copy /opt/le-dojo/backups moncloud:le-dojo-backups --max-age 48h`

## 7. Mettre à jour

```bash
cd /opt/le-dojo && sudo scripts/update.sh
```

Le script fait une sauvegarde, récupère la nouvelle version, reconstruit et redémarre.
Les migrations s'appliquent seules ; la base n'est jamais recréée.

## 8. Ajouter des lectures ou des livrets

```bash
cd /opt/le-dojo
docker compose exec -T app node build/cli/import-readings.js - < nouvelles-lectures.json
cp Le_Dojo_Livret1_Terre_P2_Le_Terrain.pdf data/livrets/ && chown 1000:1000 data/livrets/*
```

## 9. Déménager ailleurs (aucune dépendance à un fournisseur)

Sur la nouvelle machine : étapes 2 à 4 sans le seed, puis soit je copie `data/dojo.sqlite`,
soit j'importe mon export JSON (Moi → Exporter) :

```bash
docker compose exec -T app node build/cli/import-data.js - < le-dojo-export-AAAA-MM-JJ.json
docker compose exec app node build/cli/create-user.js
```

## 10. V2 — Rappels (notifications)

Une seule fois, sur le serveur :

```bash
cd /opt/le-dojo
docker compose run --rm --no-deps app node build/cli/generate-vapid.js
nano .env          # je colle les 3 lignes VAPID_… (et mon adresse dans VAPID_SUBJECT)
docker compose up -d
```

Puis sur l'iPhone, **depuis l'icône de l'écran d'accueil** (iOS 16.4 ou plus) :
Moi → Rappels → « Activer les rappels sur cet appareil » → Autoriser.
Je coche les rappels voulus dans Réglages, j'enregistre, et j'envoie un rappel de test.

## 11. V2 — Mes pas

Voir `docs/raccourci-pas.md`.

## En cas de souci

| Ce que je vois | Ce que je fais |
| --- | --- |
| Pas de cadenas / erreur de certificat | Je vérifie le DNS (étape 1), puis `docker logs traefik-traefik-1 --tail 50` |
| « Bad Gateway » | `docker compose ps` puis `docker compose logs app --tail 50` |
| « Trop d'essais » | J'attends 15 minutes |
| Mot de passe oublié | `docker compose exec app node build/cli/create-user.js` |

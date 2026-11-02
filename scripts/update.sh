#!/bin/sh
# Updates the app: backup now, fetch the new version, rebuild, restart.
# Migrations run by themselves at start-up; the database is never recreated.
set -eu
cd "$(dirname "$0")/.."
echo "1/4 Sauvegarde avant mise à jour"
docker compose exec -T backup /usr/local/bin/backup.sh
echo "2/4 Nouvelle version"
git pull --ff-only
echo "3/4 Construction"
docker compose build
echo "4/4 Redémarrage"
docker compose up -d
sleep 10
docker compose ps

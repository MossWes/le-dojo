#!/bin/sh
# Restores a backup:  sudo scripts/restore.sh backups/dojo-AAAA-MM-JJ_HHMM.sqlite.gz
# The current database is kept in data/avant-restauration-<date>/ first.
set -eu
cd "$(dirname "$0")/.."
FILE="${1:-}"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
	echo "Usage : scripts/restore.sh backups/dojo-AAAA-MM-JJ_HHMM.sqlite.gz"
	echo "Sauvegardes disponibles :"
	ls -1t backups/dojo-*.sqlite.gz 2>/dev/null | head -10
	exit 1
fi
gzip -t "$FILE" || { echo "Fichier abîmé : $FILE"; exit 1; }

echo "Je vais remplacer la base actuelle par : $FILE"
printf "La base actuelle sera gardée à part. Taper OUI pour continuer : "
read -r answer
[ "$answer" = "OUI" ] || { echo "Rien n'a changé."; exit 1; }

docker compose stop app
keep="data/avant-restauration-$(date +%Y-%m-%d_%H%M%S)"
mkdir -p "$keep"
for f in data/dojo.sqlite data/dojo.sqlite-wal data/dojo.sqlite-shm; do
	[ -f "$f" ] && mv "$f" "$keep/"
done
gunzip -c "$FILE" > data/dojo.sqlite
chown 1000:1000 data/dojo.sqlite "$keep" "$keep"/* 2>/dev/null || true
chmod 600 data/dojo.sqlite
docker compose start app
echo "Restauration faite. Ancienne base gardée dans $keep"

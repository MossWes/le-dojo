#!/bin/sh
# One backup now: consistent copy, integrity check, compression, 30-day retention.
set -eu
DB=/data/dojo.sqlite
DIR=/backups
KEEP_DAYS="${KEEP_DAYS:-30}"
umask 077

if [ ! -f "$DB" ]; then
	echo "$(date '+%F %T') ERREUR : base introuvable ($DB)"
	exit 1
fi

stamp=$(date +%Y-%m-%d_%H%M)
tmp="$DIR/.en-cours-$stamp.sqlite"
sqlite3 "$DB" ".backup '$tmp'"
check=$(sqlite3 "$tmp" "PRAGMA integrity_check;")
if [ "$check" != "ok" ]; then
	echo "$(date '+%F %T') ERREUR : copie corrompue ($check)"
	rm -f "$tmp"
	exit 1
fi
gzip -9 "$tmp"
mv "$tmp.gz" "$DIR/dojo-$stamp.sqlite.gz"
find "$DIR" -name 'dojo-*.sqlite.gz' -type f -mtime "+$((KEEP_DAYS - 1))" -delete
count=$(find "$DIR" -name 'dojo-*.sqlite.gz' -type f | wc -l)
echo "$(date '+%F %T') Sauvegarde OK : dojo-$stamp.sqlite.gz ($count conservées)"

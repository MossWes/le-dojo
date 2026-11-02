#!/bin/sh
# Waits until BACKUP_TIME (Paris time) every day, then runs backup.sh.
set -u
echo "Sauvegarde quotidienne à ${BACKUP_TIME} (${TZ}), conservation ${KEEP_DAYS} jours."
while true; do
	now=$(date +%s)
	target=$(date -d "$(date +%Y-%m-%d) ${BACKUP_TIME}" +%s)
	[ "$target" -le "$now" ] && target=$((target + 86400))
	sleep $((target - now))
	/usr/local/bin/backup.sh || echo "$(date '+%F %T') La sauvegarde a échoué, nouvel essai demain."
	sleep 60
done

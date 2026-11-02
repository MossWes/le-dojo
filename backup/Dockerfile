# Daily backup of the Dojo database (consistent copy with sqlite3 .backup).
FROM alpine:3.20
RUN apk add --no-cache sqlite tzdata gzip
COPY backup.sh run.sh /usr/local/bin/
RUN chmod 755 /usr/local/bin/backup.sh /usr/local/bin/run.sh
ENV TZ=Europe/Paris \
	BACKUP_TIME=02:00 \
	KEEP_DAYS=30
# Same user as the app: files keep the right owner.
USER 1000:1000
CMD ["/usr/local/bin/run.sh"]

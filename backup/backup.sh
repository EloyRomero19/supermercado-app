#!/bin/sh
# Copias de seguridad automáticas de la base de datos. Lo ejecuta el servicio "backup" de
# docker-compose.prod.yml: hace una copia al arrancar y luego cada BACKUP_INTERVAL_HOURS horas,
# y conserva las BACKUP_KEEP más recientes. Se guardan en /backups = carpeta backups/ del
# servidor (fuera de los volúmenes de Docker, para poder descargarlas y que "down -v" no las borre).
set -eu

INTERVAL_HOURS="${BACKUP_INTERVAL_HOURS:-24}"
KEEP="${BACKUP_KEEP:-14}"
# Las copias contienen los datos de los usuarios: solo las puede leer el dueño del archivo
umask 077

backup() {
  file="/backups/quefalta-$(date +%Y%m%d-%H%M%S).dump"
  # -Fc: formato propio de PostgreSQL, comprimido; se restaura con pg_restore (ver restore.sh).
  # Primero a un .tmp: si falla a medias, no queda una copia rota que parezca buena.
  if pg_dump -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f "$file.tmp"; then
    mv "$file.tmp" "$file"
    echo "$(date '+%F %T') copia hecha: $(basename "$file") ($(du -h "$file" | cut -f1))"
  else
    rm -f "$file.tmp"
    echo "$(date '+%F %T') ERROR: no se pudo hacer la copia" >&2
  fi
  # Borra las más antiguas, dejando las $KEEP más recientes (por fecha en el nombre)
  ls -1 /backups/quefalta-*.dump 2>/dev/null | sort -r | tail -n "+$((KEEP + 1))" | while read -r old; do
    rm -f "$old" && echo "$(date '+%F %T') borrada la copia antigua $(basename "$old")"
  done
}

while true; do
  backup
  sleep "$((INTERVAL_HOURS * 3600))"
done

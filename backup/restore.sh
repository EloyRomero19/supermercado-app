#!/bin/sh
# Restaura una copia de seguridad en la base de datos de producción. Se ejecuta EN EL SERVIDOR,
# desde la raíz del proyecto:
#   ./backup/restore.sh backups/quefalta-20261014-040000.dump
# Sustituye TODOS los datos actuales por los de la copia, así que antes pide confirmación.
set -eu

file="${1:-}"
if [ -z "$file" ] || [ ! -f "$file" ]; then
  echo "Uso: $0 backups/quefalta-AAAAMMDD-HHMMSS.dump" >&2
  echo "Copias disponibles:" >&2
  ls -1t backups/*.dump 2>/dev/null | head -n 5 >&2 || echo "  (ninguna)" >&2
  exit 1
fi

compose="docker compose -f docker-compose.prod.yml"

printf 'Se borrarán los datos actuales y se sustituirán por los de %s. ¿Seguro? (escribe "si"): ' "$(basename "$file")"
read -r answer
[ "$answer" = "si" ] || { echo "Cancelado."; exit 1; }

# Sin backend durante la restauración: nadie escribe a medias mientras se reemplazan los datos
$compose stop backend
# La restaura el contenedor "backup": ve las copias en /backups (son de root y solo él puede
# leerlas), tiene la contraseña de la base de datos y el pg_restore de la misma versión.
# --clean --if-exists: borra cada tabla antes de recrearla; --single-transaction: todo o nada.
# Comillas simples: las variables las expande el shell del contenedor (valores del .env), no el nuestro.
if $compose exec -T backup sh -c 'pg_restore -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --single-transaction "/backups/$1"' sh "$(basename "$file")"; then
  echo "Copia restaurada."
else
  echo "ERROR al restaurar: la base de datos se ha quedado como estaba." >&2
fi
$compose start backend

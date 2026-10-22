#!/usr/bin/env bash
# ENTORNO DE PRUEBAS TEMPORAL
# Levanta una base PostgreSQL 18 con datos de prueba y el backend de
# NU-B Studio, para correr las pruebas de integración, rendimiento y
# esfuerzo sin tocar producción. Lo usan release.yml y manual.yml.
#
#   base (Docker) ─> datos (sql/01..05) ─> backend (node) ─> http://localhost:4000
#
# Uso:
#   scripts/entorno/levantar-entorno.sh           # todo: base, datos y backend
#   scripts/entorno/levantar-entorno.sh base      # solo crea el contenedor de PostgreSQL
#   scripts/entorno/levantar-entorno.sh datos     # solo carga los .sql en una base vacía ya creada
#   scripts/entorno/levantar-entorno.sh backend   # solo arranca el backend y espera a que responda
#   scripts/entorno/levantar-entorno.sh detener   # detiene el backend y borra el contenedor
#
# Variables (todas tienen valor por defecto):
#   BACKEND_DIR   carpeta con el código de Nub_studio_back (backend)
#   REPORTES      carpeta donde quedan backend.log y backend.pid (reports)
#   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD   conexión a la base
#   API_PORT      puerto del backend (4000)
#
# Las contraseñas y llaves de aquí solo existen dentro de este entorno
# temporal. Brevo, Cloudinary, Supabase, Mercado Pago y Anthropic reciben
# valores falsos: no se manda ningún correo ni se toca ningún servicio real.
set -euo pipefail

DIR_SQL="$(cd "$(dirname "$0")" && pwd)/sql"
BACKEND_DIR="${BACKEND_DIR:-backend}"
REPORTES="${REPORTES:-reports}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-nub_studio_ci}"
DB_USER="${DB_USER:-nub_owner}"
DB_PASSWORD="${DB_PASSWORD:-entorno_ci}"
API_PORT="${API_PORT:-4000}"
CONTENEDOR="nub-entorno-db"
# Contraseña de los roles usr_* (la misma que pone sql/01-roles.sql)
CLAVE_ROLES="entorno_ci"

mkdir -p "$REPORTES"

psql_entorno() {
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" "$@"
}

base() {
  echo "▶ Creando PostgreSQL 18 en Docker (puerto $DB_PORT)"
  docker rm -f "$CONTENEDOR" >/dev/null 2>&1 || true
  # El backend siempre se conecta con SSL (src/config/db.js), así que se
  # activa con el certificado autofirmado que trae la imagen.
  docker run -d --name "$CONTENEDOR" \
    -e POSTGRES_USER="$DB_USER" \
    -e POSTGRES_PASSWORD="$DB_PASSWORD" \
    -e POSTGRES_DB="$DB_NAME" \
    -p "$DB_PORT:5432" \
    postgres:18 \
    -c ssl=on \
    -c ssl_cert_file=/etc/ssl/certs/ssl-cert-snakeoil.pem \
    -c ssl_key_file=/etc/ssl/private/ssl-cert-snakeoil.key >/dev/null

  # La imagen arranca, inicializa y se reinicia; se espera a que acepte conexiones por TCP.
  for _ in $(seq 1 30); do
    if psql_entorno -Atc 'SELECT 1' >/dev/null 2>&1; then
      echo "✔ PostgreSQL listo"
      return
    fi
    sleep 2
  done
  echo "✖ PostgreSQL no arrancó en 60 s"
  docker logs "$CONTENEDOR" | tee "$REPORTES/postgres.log"
  exit 1
}

datos() {
  if [ "$(psql_entorno -Atc 'SHOW ssl')" != "on" ]; then
    echo "✖ La base no tiene SSL activado y el backend no se podría conectar"
    exit 1
  fi
  for archivo in "$DIR_SQL"/*.sql; do
    echo "▶ Cargando $(basename "$archivo")"
    psql_entorno -q -v ON_ERROR_STOP=1 -f "$archivo"
  done
  echo "✔ Base lista: $(psql_entorno -Atc "SELECT count(*) FROM obras WHERE estado = 'publicada' AND activa") obras publicadas"
}

backend() {
  if [ ! -f "$BACKEND_DIR/package.json" ]; then
    echo "✖ No se encontró el backend en $BACKEND_DIR (define BACKEND_DIR)"
    exit 1
  fi
  if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo "▶ Instalando dependencias del backend"
    (cd "$BACKEND_DIR" && npm ci --no-audit --no-fund)
  fi

  local log
  log="$(cd "$REPORTES" && pwd)/backend.log"
  echo "▶ Arrancando el backend en el puerto $API_PORT"
  # Se definen todas las variables que lee el backend; dotenv no reemplaza
  # las que ya existen, así que un .env local no cambia este entorno.
  (
    cd "$BACKEND_DIR"
    export NODE_ENV=development PORT="$API_PORT" \
      DB_HOST="$DB_HOST" DB_HOST_DIRECT="$DB_HOST" DB_PORT="$DB_PORT" DB_NAME="$DB_NAME" \
      DB_USER="$DB_USER" DB_PASSWORD="$DB_PASSWORD" \
      DB_PASS_ADMIN="$CLAVE_ROLES" DB_PASS_ARTISTA="$CLAVE_ROLES" \
      DB_PASS_CLIENTE="$CLAVE_ROLES" DB_PASS_VISITANTE="$CLAVE_ROLES" \
      JWT_SECRET="entorno-de-pruebas-temporal-no-usar-en-otro-lugar" \
      BACKEND_URL="http://localhost:$API_PORT" FRONTEND_URL="http://localhost:5173" \
      SUPABASE_URL="http://localhost:54321" SUPABASE_SERVICE_KEY="desactivado-entorno" \
      BREVO_API_KEY="desactivado-entorno" \
      CLOUDINARY_CLOUD_NAME="desactivado-entorno" CLOUDINARY_API_KEY="desactivado-entorno" \
      CLOUDINARY_API_SECRET="desactivado-entorno" \
      ANTHROPIC_API_KEY="desactivado-entorno" \
      ML_SERVICE_URL="http://localhost:9" ML_TIMEOUT_MS=1000 \
      MP_PUBLIC_KEY="desactivado-entorno" MP_ACCESS_TOKEN="desactivado-entorno"
    nohup node src/server.js >"$log" 2>&1 &
    echo $! >"$(dirname "$log")/backend.pid"
  )

  for _ in $(seq 1 30); do
    if curl -sf -o /dev/null "http://localhost:$API_PORT/api/categorias"; then
      echo "✔ Backend listo en http://localhost:$API_PORT"
      return
    fi
    sleep 2
  done
  echo "✖ El backend no respondió en 60 s. Últimas líneas del log:"
  tail -n 40 "$log"
  exit 1
}

detener() {
  if [ -f "$REPORTES/backend.pid" ]; then
    kill "$(cat "$REPORTES/backend.pid")" 2>/dev/null || true
    rm -f "$REPORTES/backend.pid"
    echo "✔ Backend detenido"
  fi
  if command -v docker >/dev/null && docker ps -a --format '{{.Names}}' | grep -qx "$CONTENEDOR"; then
    docker rm -f "$CONTENEDOR" >/dev/null
    echo "✔ Contenedor de PostgreSQL borrado"
  fi
}

case "${1:-todo}" in
  todo) base; datos; backend ;;
  base) base ;;
  datos) datos ;;
  backend) backend ;;
  detener) detener ;;
  *)
    echo "Uso: $0 [todo|base|datos|backend|detener]"
    exit 1
    ;;
esac

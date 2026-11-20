#!/usr/bin/env bash
# PRUEBA DE COMPATIBILIDAD EN UN DISPOSITIVO — issue #49
# Corre en el emulador de cada versión de Android (manual.yml, etapa 09) o en un celular
# conectado por USB con la depuración activada.
#
#   instalar APK ─> datos del dispositivo ─> flujos E2E (Maestro) ─> arranque en frío ─> memoria
#                                                                      ─> cierres y ANR de la app
#
# Uso:
#   pnpm test:compatibilidad ruta/al/app.apk
#
# Los flujos son los mismos de la etapa 07 (tests/e2e) y necesitan el backend del entorno
# temporal en http://localhost:4000 (scripts/entorno/levantar-entorno.sh).
#
# Deja en reports/:
#   dispositivo.txt   modelo, versión de Android, pantalla, densidad y RAM
#   maestro.xml       resultado de cada flujo (JUnit)
#   maestro/          capturas de cada flujo, para comparar el diseño entre versiones
#   arranque.txt      TotalTime de 5 arranques en frío, en ms
#   memoria.txt       memoria de la app (PSS) en Login, en KB
#   fallas.txt        cierres inesperados y ANR de la app durante toda la prueba
#   fallas-detalle.txt  las líneas del registro de cada falla, solo si hubo
#   logcat.txt        solo si algún flujo falla
#
# Termina con error si algún flujo falla, pero antes mide el arranque y la memoria.
set -uo pipefail

APK="${1:?Falta la ruta del APK}"
PAQUETE=com.nubstudio.movil
mkdir -p reports

prop() { adb shell getprop "$1" | tr -d '\r'; }
valor_wm() { adb shell wm "$1" | tr -d '\r' | awk '/Physical/ {print $NF}'; }

# En los emuladores, ocultar los avisos de "<app> isn't responding" de otras apps. En la
# primera ejecución (20 de nov), la pantalla de inicio del emulador de Android 14 (Pixel
# Launcher) se trabó al arrancar y su aviso tapó la app en los 8 flujos, aunque la app sí
# había abierto debajo. Los cierres y ANR de NUB Studio se siguen contando desde el
# registro (fallas.txt). En un celular real no se cambia ningún ajuste.
if [ "$(prop ro.kernel.qemu)" = 1 ] || [ "$(prop ro.boot.qemu)" = 1 ]; then
  adb shell settings put global hide_error_dialogs 1
  adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS > /dev/null 2>&1 || true
fi
# Hora del dispositivo al empezar, para contar solo las fallas de esta prueba.
inicio="$(adb shell date '+%m-%d %H:%M:%S.000' | tr -d '\r')"

adb install -r "$APK" || exit 1
# Dentro del emulador, localhost:4000 llega al backend del entorno temporal.
adb reverse tcp:4000 tcp:4000 || exit 1

{
  echo "nombre=${NOMBRE_DISPOSITIVO:-$(prop ro.product.model)}"
  echo "modelo=$(prop ro.product.model)"
  echo "android=$(prop ro.build.version.release)"
  echo "api=$(prop ro.build.version.sdk)"
  echo "pantalla=$(valor_wm size)"
  echo "densidad=$(valor_wm density)"
  echo "ram_mb=$(adb shell cat /proc/meminfo | tr -d '\r' | awk '/MemTotal/ {printf "%d", $2 / 1024}')"
} > reports/dispositivo.txt
cat reports/dispositivo.txt

pnpm test:e2e
resultado=$?
if [ "$resultado" -ne 0 ]; then
  adb logcat -d > reports/logcat.txt
fi

# Arranque en frío, igual que en REPORTE_RENDIMIENTO.md: 1 apertura de calentamiento que no
# cuenta y 5 medidas. TotalTime = milisegundos hasta dibujar la primera pantalla.
abrir() { adb shell am start -W -n "$PAQUETE/.MainActivity" | tr -d '\r'; }
adb shell am force-stop "$PAQUETE"
abrir > /dev/null
sleep 5
: > reports/arranque.txt
for _ in 1 2 3 4 5; do
  adb shell am force-stop "$PAQUETE"
  sleep 2
  abrir | awk -F': ' '/TotalTime/ {print $2}' >> reports/arranque.txt
  sleep 5
done
echo "Arranque en frío (ms): $(tr '\n' ' ' < reports/arranque.txt)"

# Memoria con la app abierta en Login, 10 s después del último arranque. Se toma el primer
# número de la fila TOTAL de dumpsys meminfo, que es el PSS total en KB en todas las versiones.
sleep 10
adb shell dumpsys meminfo "$PAQUETE" | tr -d '\r' \
  | awk '/^ *TOTAL/ { for (i = 2; i <= NF; i++) if ($i ~ /^[0-9]+$/) { print $i; exit } }' \
  > reports/memoria.txt
echo "Memoria en Login (PSS, KB): $(cat reports/memoria.txt)"

# Cierres inesperados (registro crash) y ANR (registro events) de la app desde el inicio.
# Los cierres que hace Maestro al reiniciar la app entre flujos no aparecen aquí.
adb logcat -d -b crash -T "$inicio" | tr -d '\r' | grep -B 1 -A 4 "Process: $PAQUETE" > reports/fallas-detalle.txt
adb logcat -d -b events -T "$inicio" | tr -d '\r' | grep "am_anr.*$PAQUETE" >> reports/fallas-detalle.txt
{
  echo "cierres=$(grep -c "Process: $PAQUETE" reports/fallas-detalle.txt)"
  echo "anr=$(grep -c "am_anr" reports/fallas-detalle.txt)"
} > reports/fallas.txt
[ -s reports/fallas-detalle.txt ] || rm reports/fallas-detalle.txt
echo "Fallas de la app: $(tr '\n' ' ' < reports/fallas.txt)"

exit "$resultado"

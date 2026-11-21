# Reporte de pruebas de rendimiento — Nub-studio-movil

Resultados de la issue #55: rapidez y fluidez de la app y del API en uso
normal, con el servidor ya despierto. Cubre HU-01 a HU-04, HU-06 y HU-10.
La [sección 6](#6-versión-release-110-cpu-memoria-y-arranque-157) agrega la
medición de CPU, memoria y arranque de la versión Release 1.1.0 (#157).

**Resultado general: las 4 mediciones cumplen.** No se abrió ningún bug.

| Medición | Resultado | Referencia | Estado |
| --- | --- | --- | --- |
| Arranque en frío | **579 ms** de promedio (510–652 ms) | Excesivo: 5 s o más (Android vitals) | ✅ |
| Fluidez del catálogo | **0.06 %** de cuadros con tirón; p95 = 15 ms | Cuadro lento: más de 16 ms; congelado: más de 700 ms | ✅ |
| Carga del catálogo (percibida) | **~1 s** en los 3 intentos, sin fallas | Menos de 2 s | ✅ |
| Respuesta del API | p95 = **4.3 ms**, 0 % de errores | p95 < 1.5 s y errores < 1 % | ✅ |

---

## 1. Entorno

| Elemento | Valor |
| --- | --- |
| Fecha | 9 de noviembre de 2026 |
| Responsable | Luis Gustavo Hernández Hernández |
| Dispositivo | Teléfono Android físico, modelo `2312FPCA6G`, pantalla 1080 × 2400 |
| Sistema | Android 16 |
| App | NUB Studio **1.0.0 (versionCode 3)**, instalada desde la prueba cerrada de Google Play |
| Herramienta | `adb` (Android SDK Platform-Tools) por USB |
| Servidor | Backend de producción, **despierto** antes de medir (se abrió el catálogo una vez) |

### Por qué `adb` y no Perf Monitor

El plan ([recursos-pruebas.md](recursos-pruebas.md)) proponía **Perf Monitor**
de React Native, pero ese monitor solo existe en compilaciones de desarrollo
(Expo Go). Para medir lo que vive el usuario se midió la **compilación de
release publicada en Google Play** con `adb`, que entrega los mismos datos
(tiempo de arranque y tiempos por cuadro) y las cifras que usa Android vitals.

## 2. Arranque en frío (HU-01)

Tiempo hasta que la app dibuja su primera pantalla (TTID), con la app
cerrada por completo antes de cada intento:

```bat
for /L %i in (1,1,5) do (adb shell am force-stop com.nubstudio.movil & timeout /t 2 >nul & adb shell am start -W -n com.nubstudio.movil/.MainActivity | findstr TotalTime)
```

| Intento | 1 | 2 | 3 | 4 | 5 | **Promedio** |
| --- | --- | --- | --- | --- | --- | --- |
| TotalTime | 579 ms | 510 ms | 578 ms | 576 ms | 652 ms | **579 ms** |

Android vitals considera **excesivo** un arranque en frío de **5 s o más**.
NUB Studio arranca unas 9 veces más rápido que ese límite.

## 3. Fluidez de la lista del catálogo (HU-01)

Se reiniciaron los contadores, se deslizó el catálogo hacia abajo y hacia
arriba durante unos 10 s, y se leyeron las estadísticas de dibujo:

```bat
adb shell dumpsys gfxinfo com.nubstudio.movil reset
:: (deslizar el catálogo ~10 s)
adb shell dumpsys gfxinfo com.nubstudio.movil | findstr /C:"Total frames" /C:"Janky" /C:"percentile"
```

| Métrica | Valor |
| --- | --- |
| Cuadros dibujados | 1,694 |
| Cuadros con tirón (`Janky frames`) | **1 (0.06 %)** |
| Percentil 50 / 90 / 95 / 99 | 10 / 14 / **15** / 18 ms |
| GPU, percentil 50 / 99 | 6 / 9 ms |

- Android define un **cuadro lento** como el que tarda **más de 16 ms** y uno
  **congelado** como el que tarda **más de 700 ms**. El 95 % de los cuadros
  quedó en 15 ms o menos, y el más lento del 99 % en 18 ms: no hubo cuadros
  congelados.
- `Janky frames (legacy)` marcó 15.35 %. Es el cálculo antiguo, que supone
  una pantalla de 60 Hz y exagera en pantallas de mayor frecuencia; el valor
  vigente es `Janky frames` (0.06 %).

## 4. Carga del catálogo percibida (HU-01)

Con cronómetro: desde tocar la pestaña Catálogo hasta ver la primera fila
de obras. Incluye la red y el backend real, con el servidor despierto.

| Intento | 1 | 2 | 3 |
| --- | --- | --- | --- |
| Tiempo | ~1 s | ~1 s | ~1 s |

Las obras cargaron completas en los tres intentos, sin errores.

> Con el servidor **dormido** (sin uso por más de 15 minutos), la primera
> carga puede tardar hasta unos 50 s mientras Render lo despierta. Ese caso
> no es de rendimiento sino de disponibilidad: la app muestra un mensaje de
> espera y aguanta hasta 60 s (PR #116, caso CP-NF-01 del
> [plan de pruebas](../PLAN_DE_PRUEBAS.md)).

## 5. Respuesta del API (HU-01)

Tomado del pipeline de Release, job **05 · Pruebas de rendimiento**
([ejecución del 9 de noviembre](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/actions/runs/42643800640/job/129253287904)),
que corre `tests/performance/carga.js` con **k6**: 20 usuarios virtuales
durante 2 minutos sobre destacadas, catálogo, categorías, filtros combinados
y búsqueda.

| Métrica | Línea base (22 oct) | Actual (9 nov) | Cambio | Estado |
| --- | --- | --- | --- | --- |
| Tiempo de respuesta p95 | 4.9 ms | 4.3 ms | −11.4 % | ✅ |
| Tiempo de respuesta promedio | 3.2 ms | 2.8 ms | −13.2 % | ✅ |
| Peticiones con error | 0.00 % | 0.00 % (0 de 8,990) | — | ✅ |
| Revisiones (`checks`) | — | 100 % (8,990 de 8,990) | — | ✅ |

Los umbrales fijos del guion (p95 < 1.5 s y errores < 1 %) se cumplen con
amplio margen.

> **Alcance de esta cifra:** k6 corre contra un backend temporal dentro del
> mismo servidor de GitHub Actions, sin internet de por medio, porque el
> backend de Render comparte la base de datos con la web en producción y no
> se usa para pruebas. Mide qué tan rápido responde el código del backend; el
> tiempo que percibe el usuario, con red incluida, es el de la sección 4.

## 6. Versión Release 1.1.0: CPU, memoria y arranque (#157)

Mide cuánto CPU y memoria usa la versión Release 1.1.0 y cuánto tarda en
arrancar, y la compara con la 1.0.0 para ver el efecto de R8 (#140). Lo que
se midió como "1.1.0" es el código de `develop`: la 1.1.0 más el Certificate
Pinning (#159), que saldrá en la 1.2.0. Por eso también muestra si el pinning
afecta el rendimiento.

| Medición | 1.0.0 | 1.1.0 | Cambio |
| --- | --- | --- | --- |
| Tamaño del APK (`arm64-v8a`) | 37.5 MB | **32.0 MB** | **−14.8 %** |
| Arranque en frío (promedio de 5) | 283.0 ms | 281.4 ms | −0.6 % |
| Memoria en Inicio, en reposo (PSS) | 158.1 MB | **145.1 MB** | **−8.2 %** |
| Memoria después de abrir 5 obras (PSS) | 307.2 MB | 294.2 MB | −4.2 % |
| CPU en reposo en Inicio | 3.7 % | 3.9 % | Igual |
| CPU al deslizar el catálogo (promedio) | 65.5 % | 63.3 % | −3.4 % |
| Cuadros del catálogo, p95 | 14 ms | 14 ms | Igual |

**Resultado: la 1.1.0 es más ligera que la 1.0.0 e igual de rápida.** R8 redujo
el APK y la memoria del código; el pinning no se nota en el arranque ni en el
CPU. Las dos versiones comparten dos puntos de mejora, que pasan al plan de
#158 ([sección 6.7](#67-hallazgos-para-el-plan-de-mejora-158)).

### 6.1 Entorno

| Elemento | Valor |
| --- | --- |
| Fecha | 14 de noviembre de 2026 |
| Responsable | MishelGvea |
| Dispositivo | Realme 7 (`RMX2151`), 8 núcleos, 8 GB de RAM, pantalla 1080 × 2400 |
| Sistema | Android 10 |
| Versiones | **1.0.0** compilada desde la etiqueta `v1.0.0` (sin R8) y **1.1.0** compilada desde `develop` (con R8). `develop` incluye además el Certificate Pinning (#160), que la 1.1.0 publicada en Google Play no tiene |
| Compilación | Las dos igual, en la laptop: `./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a`, firma de depuración y `PERMITIR_HTTP=true` |
| Servidor | Backend y base de datos **locales** en la laptop, por la misma red Wi-Fi |
| Sesión | Cuenta de cliente de la base local |
| Herramienta | `adb` (Android SDK Platform-Tools) por USB |

**Por qué se compilaron las dos versiones en la laptop.** La 1.0.0 de Google
Play llega como AAB partido por arquitectura y firmado con otra llave, así
que su tamaño y su arranque no se pueden comparar de forma justa con un APK
local. Compiladas de la misma forma, lo único que cambia entre las dos es el
código de cada versión.

**Por qué se usó el backend local.** Arranque, CPU y memoria dependen del
teléfono, no del servidor; con el backend local Render dormido no mete ruido y
no se usa producción para pruebas. Por eso aquí no se mide la carga percibida
con red real (eso es la sección 4).

**Estas cifras no se comparan con las secciones 2 y 3**, que se midieron en
otro teléfono, con Android 16. La comparación válida es la de 1.0.0 contra
1.1.0, las dos en el mismo Realme 7.

### 6.2 Procedimiento

Cada versión se desinstaló, se instaló en limpio, se inició sesión y se
visitó el catálogo una vez. Después se corrió el mismo guion en las dos:

1. **Arranque en frío:** 1 apertura de calentamiento que no cuenta y 5
   medidas, cerrando la app por completo antes de cada una.
2. **Reposo:** la app quieta en Inicio; memoria y 10 muestras de CPU.
3. **Catálogo:** deslizar la lista unos 10 s (3 vueltas de 3 deslizamientos
   hacia abajo y 3 hacia arriba) mientras se mide CPU y fluidez; luego memoria.
4. **Detalle de obras:** abrir 5 obras del catálogo, una tras otra, y regresar;
   memoria. Después volver a Inicio, esperar 15 s y tomar la memoria otra vez.

Los deslizamientos y toques se hicieron con `adb shell input`, no con el dedo,
para que las dos versiones recibieran exactamente los mismos movimientos.

```bash
P=com.nubstudio.movil

# Arranque en frío (TotalTime = tiempo hasta dibujar la primera pantalla)
adb shell am force-stop $P
adb shell am start -W -n $P/.MainActivity | grep TotalTime

# Memoria: sección "App Summary" (PSS, en KB)
adb shell dumpsys meminfo $P

# CPU: una muestra por segundo; la columna %CPU es la del proceso
adb shell top -b -d 1 -n 11 -p $(adb shell pidof $P)

# Fluidez: reiniciar contadores, deslizar y leer las estadísticas
adb shell dumpsys gfxinfo $P reset
adb shell input swipe 540 1900 540 700 250
adb shell dumpsys gfxinfo $P
```

### 6.3 Tamaño del APK

| Versión | Bytes | MB |
| --- | --- | --- |
| 1.0.0 (sin R8) | 39,330,063 | 37.5 |
| 1.1.0 (con R8) | 33,505,652 | 32.0 |
| **Diferencia** | **−5,824,411** | **−5.6 (−14.8 %)** |

R8 quita el código que no se usa, acorta los nombres y elimina recursos sin
referencias. La 1.1.0 pesa menos aunque trae funciones nuevas (editar datos
y sesión vencida). El APK de Google Play es todavía más chico, porque
cada teléfono descarga solo su arquitectura.

### 6.4 Arranque en frío

| Intento | 1 | 2 | 3 | 4 | 5 | **Promedio** |
| --- | --- | --- | --- | --- | --- | --- |
| 1.0.0 | 288 ms | 276 ms | 278 ms | 282 ms | 291 ms | **283.0 ms** |
| 1.1.0 | 267 ms | 312 ms | 279 ms | 272 ms | 277 ms | **281.4 ms** |

La diferencia (1.6 ms) es menor que la variación entre intentos de una misma
versión, así que el arranque quedó **igual**: R8 no lo acelera de forma
visible y el pinning no lo hace más lento. Los dos están muy lejos del límite
de **5 s** que Android vitals considera excesivo.

### 6.5 Memoria

PSS total, que es la memoria que Android le cuenta a la app (1 MB = 1024 KB):

| Momento | 1.0.0 | 1.1.0 | Cambio |
| --- | --- | --- | --- |
| Inicio, en reposo | 158.1 MB | 145.1 MB | −8.2 % |
| Catálogo, después de deslizar | 224.1 MB | 211.1 MB | −5.8 % |
| Catálogo, después de abrir 5 obras | 307.2 MB | 294.2 MB | −4.2 % |
| Inicio, 15 s después de regresar | 301.5 MB | 287.9 MB | −4.5 % |

Desglose en Inicio, en reposo:

| Tipo | Qué guarda | 1.0.0 | 1.1.0 | Cambio |
| --- | --- | --- | --- | --- |
| Java Heap | Objetos de Android | 8.2 MB | 8.1 MB | −1.1 % |
| Native Heap | Motor de JavaScript e imágenes decodificadas | 36.9 MB | 36.8 MB | −0.3 % |
| **Code** | **Código de la app y librerías** | **42.3 MB** | **31.3 MB** | **−26.0 %** |
| Graphics | Texturas e imágenes en pantalla | 35.0 MB | 35.1 MB | +0.2 % |
| Private Other | Otros datos propios | 21.8 MB | 21.2 MB | −2.7 % |
| System | Memoria compartida del sistema | 13.8 MB | 12.6 MB | −9.1 % |
| **Total** | | **158.1 MB** | **145.1 MB** | **−8.2 %** |

- La 1.1.0 usa unos **13 MB menos en todos los momentos**, y casi toda la
  diferencia está en **Code**: es el código que R8 dejó de cargar.
- El teléfono tiene 8 GB de RAM: ni en el peor momento (307 MB) la app pasa
  del 4 % de la memoria del equipo.
- En las dos versiones la memoria **crece al ver obras y no baja al regresar
  a Inicio** (ver la sección 6.7).

### 6.6 CPU y fluidez

En `top`, el 100 % equivale a un núcleo completo; con 8 núcleos el máximo es
800 %. La primera muestra de cada serie no se cuenta, porque `top` la calcula
desde que arrancó el proceso.

| Medición | 1.0.0 | 1.1.0 |
| --- | --- | --- |
| CPU en reposo en Inicio (promedio de 10 s) | 3.7 % | 3.9 % |
| CPU al deslizar el catálogo (promedio de 12 s) | 65.5 % | 63.3 % |
| CPU al deslizar, pico | 152 % | 145 % |
| Cuadros dibujados | 792 | 826 |
| Percentil 50 / 90 / 95 / 99 | 6 / 13 / 14 / 19 ms | 6 / 12 / 14 / 19 ms |
| Cuadros con el hilo de UI lento | 35 | 21 |

- Al deslizar, la app usa en promedio menos de un núcleo (unos 8 % de la
  capacidad total del teléfono), con picos de un núcleo y medio.
- El **95 % de los cuadros** se dibujó en **14 ms o menos** en las dos
  versiones, por debajo de los **16 ms** de un cuadro lento; no hubo cuadros
  congelados.
- `Janky frames` marcó 21.34 % (1.0.0) y 20.34 % (1.1.0). En Android 10 ese
  contador suma cualquier cuadro con alguna marca, y casi todas son `High input
  latency` (157 y 161): las genera el deslizamiento simulado con `adb`, cuyos
  eventos llegan con retraso respecto al toque real. Por eso aquí la fluidez
  se juzga con los percentiles, igual que en la sección 3.

### 6.7 Hallazgos para el plan de mejora (#158)

Ninguna medición incumple una referencia, pero salieron dos puntos que se
repiten igual en las dos versiones (no los causó la 1.1.0):

1. **La memoria de imágenes no se libera.** Al abrir 5 obras, *Graphics* pasa
   de 35 MB a 119 MB y *Native Heap* de 37 MB a 87 MB. Al regresar a Inicio y
   esperar 15 s, siguen en 119 MB y 84 MB. Las imágenes de las obras se
   quedan en memoria aunque ya no estén en pantalla. Hay que revisar el
   tamaño con el que se piden las imágenes y la caché en memoria de
   `expo-image`; en un teléfono con menos RAM, Android podría cerrar la app
   al quedarse en segundo plano.
2. **La app usa CPU estando quieta.** En Inicio, sin tocar nada, se mantiene
   entre 3 y 5 % de CPU. Algo sigue trabajando (una animación, un temporizador
   o un componente que se vuelve a dibujar); hay que encontrarlo porque gasta
   batería. **Actualización (#168):** la causa es React Native, no el código de
   la app (sección 6.8).

### 6.8 CPU en reposo: de dónde sale (#168)

Se buscó qué usa el CPU con la app quieta en Inicio (acción 4 del
[plan de mejora](plan-mejora-rendimiento.md)).

| Elemento | Valor |
| --- | --- |
| Fecha | 21 de noviembre de 2026 |
| Responsable | SoraidaMedina |
| Dispositivo | Motorola moto g42, 8 núcleos, Android 13, pantalla de 60 Hz |
| App | NUB Studio **1.1.0** de Google Play, con sesión de cliente |
| Herramientas | `adb` por Wi-Fi (depuración inalámbrica) y **Perfetto**, el rastreador de Android |

**1. CPU en reposo**, 10 muestras de 1 s (sin contar la primera), con la app quieta en
Inicio:

| Prueba | Muestras (%) | Promedio |
| --- | --- | :-: |
| Inicio después de abrir Catálogo una vez (como en #157) | 1, 3, 2, 1, 1, 2, 2, 1, 3, 1 | **1.7 %** |
| Inicio con la app recién abierta, sin entrar a Catálogo | 2, 2, 2, 2, 3, 2, 1, 3, 2, 1 | **2.0 %** |
| Ajustes de Android, quieto (comparación) | 0, 0, 1, 0, 0, 0, 0, 0, 0, 0 | 0.1 % |

**2. Qué hilo lo usa y si se dibuja algo:**

- Con `top -H`, casi todo el CPU es del **hilo principal** (el de la interfaz, ~1.9 %). El
  hilo de JavaScript (`mqt_v_js`) está en **0 %**.
- Con `dumpsys gfxinfo`, en 11 s **no se dibujó ningún cuadro** (`Total frames rendered: 0`).

**3. Rastreo de 6 s con Perfetto** (`perfetto -t 6s sched gfx view input am wm`):

| Hilo | Tiempo en CPU | Veces que corrió |
| --- | :-: | :-: |
| Principal (`nubstudio.movil`) | 140.8 ms | 353 |
| JavaScript (`mqt_v_js`) | 2.0 ms | 12 |

El hilo principal se despierta **346 veces en 6 s (~58 por segundo, una por cada refresco
de la pantalla)**. En cada una corre la etapa `animation` de `Choreographer`, que incluye
`BatchEventDispatchedListeners`, vuelve a pedir el siguiente refresco
(`Choreographer#scheduleVsyncLocked`) y no dibuja nada.

**4. La causa está en React Native 0.86.** Dos partes de la Nueva Arquitectura (Fabric) se
vuelven a programar en **cada cuadro mientras la app está en primer plano**, haya o no
trabajo:

- `FabricUIManager.DispatchUIFrameCallback`, que monta en pantalla los cambios de React:
  al terminar cada cuadro llama a `schedule()` en un bloque `finally`, y solo se detiene con
  `pause()`, cuando la app pasa a segundo plano.
- `FabricEventDispatcher.ScheduleDispatchFrameCallback`, que reparte los eventos (toques,
  scroll): mientras `shouldStop` es `false` vuelve a llamar a `postFrameCallback`, y solo se
  detiene en `onHostPause`. Es el que deja la marca `BatchEventDispatchedListeners` en el
  rastreo.

Los dos están en `node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/`
(`fabric/FabricUIManager.java` y `uimanager/events/FabricEventDispatcher.kt`).

**5. Lo que se descartó:**

| Sospecha | Cómo se descartó |
| --- | --- |
| El brillo de los skeletons (`ShimmerProvider`, `withRepeat` infinito) sigue corriendo | Una animación visible dibujaría cuadros, y se dibujaron 0. `ShimmerProvider` además cancela la animación al desmontarse (`cancelAnimation`) |
| La pestaña de Catálogo, que sigue montada detrás de Inicio, mantiene un skeleton | Sin entrar a Catálogo el CPU es el mismo (2.0 %) |
| Un temporizador o un componente de Inicio que se vuelve a dibujar | JavaScript usó 2 ms en 6 s. En `src/` no hay `setInterval` ni otras animaciones infinitas |

**Conclusión:** el CPU en reposo es el costo de que React Native revise en cada cuadro si
hay cambios o eventos. No depende del código de la app y no se puede quitar sin modificar
React Native; la arquitectura anterior, que no lo hacía, ya no existe en la 0.86. En el moto
g42 es de **1.7–2.0 %**. El 3.9 % del Realme 7 (sección 6.6) probablemente es mayor porque su
pantalla refresca a 90 Hz (90 revisiones por segundo en lugar de 60) y por su procesador.
Al pasar la app a segundo plano las dos revisiones se detienen, así que no gasta batería
cuando no se usa.

Cómo repetirlo:

```bash
P=com.nubstudio.movil
adb shell top -H -b -d 1 -n 6 -p $(adb shell pidof $P) -o TID,%CPU,CMD   # CPU por hilo
adb shell dumpsys gfxinfo $P reset; sleep 10; adb shell dumpsys gfxinfo $P | grep "Total frames"
adb shell perfetto -o /data/misc/perfetto-traces/nub.pftrace -t 6s sched gfx view input am wm -a $P
adb pull /data/misc/perfetto-traces/nub.pftrace   # se abre en https://ui.perfetto.dev
```

## 7. Conclusiones

1. La app arranca en poco más de medio segundo y desliza el catálogo sin
   tirones en un teléfono actual.
2. El backend responde en milisegundos y no empeoró respecto a la línea base.
3. No se encontraron incumplimientos, así que no se abrieron bugs para #48.
4. La versión Release 1.1.0 pesa 14.8 % menos y usa unos 13 MB menos de
   memoria que la 1.0.0 gracias a R8, con el mismo arranque, CPU y fluidez. El
   Certificate Pinning de `develop`, que saldrá en la 1.2.0, no afectó el
   rendimiento.
5. La memoria de imágenes que no se libera y el CPU en reposo pasan al plan de
   mejora (#158).
6. El CPU en reposo (1.7–2.0 % en el moto g42) lo genera React Native, que
   revisa en cada cuadro si hay cambios o eventos; no es un error de la app
   (sección 6.8, #168).

## 8. Pendientes

- Repetir el arranque en frío y la fluidez en un **teléfono de gama baja o
  más antiguo** durante las pruebas de compatibilidad (#49), donde los
  tiempos serán mayores.
- Atender el hallazgo de memoria de la sección 6.7 en el plan de mejora (#158,
  acción 3) y repetir la medición después del cambio. El de CPU en reposo ya
  quedó explicado (sección 6.8).
- Volver a medir el CPU en reposo al actualizar React Native, por si una
  versión nueva deja de revisar en cada cuadro cuando no hay trabajo.

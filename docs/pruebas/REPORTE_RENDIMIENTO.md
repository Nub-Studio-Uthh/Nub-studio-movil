# Reporte de pruebas de rendimiento — Nub-studio-movil

Resultados de la issue #55: rapidez y fluidez de la app y del API en uso
normal, con el servidor ya despierto. Cubre HU-01 a HU-04, HU-06 y HU-10.

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

## 6. Conclusiones

1. La app arranca en poco más de medio segundo y desliza el catálogo sin
   tirones en un teléfono actual.
2. El backend responde en milisegundos y no empeoró respecto a la línea base.
3. No se encontraron incumplimientos, así que no se abrieron bugs para #48.

## 7. Pendientes

- Repetir el arranque en frío y la fluidez en un **teléfono de gama baja o
  más antiguo** durante las pruebas de compatibilidad (#49), donde los
  tiempos serán mayores.
- Repetir estas mediciones con la siguiente versión (1.1.0) y, si se activa
  R8 (#140), comparar el arranque en frío antes y después.

# Acuerdos de nivel de servicio (SLA, SLO y SLI) — NUB Studio (#144)

Define qué nivel de servicio promete NUB Studio a quien usa la app, con qué meta interna se
trabaja para cumplirlo y cómo se mide. Cada acuerdo tiene su fórmula, su fuente de datos, su
periodo y lo que se hace si no se cumple. La sección 4 tiene la primera medición.

## 1. Qué es cada cosa

| Término | Qué es | Ejemplo en NUB Studio |
| --- | --- | --- |
| **SLA** (acuerdo de nivel de servicio) | La promesa hacia el usuario y lo que pasa si no se cumple | "El API está disponible al menos el 99 % del mes" |
| **SLO** (objetivo de nivel de servicio) | La meta interna del equipo. Es más exigente que el SLA para tener margen antes de romper la promesa | 99.5 % del mes |
| **SLI** (indicador de nivel de servicio) | El número que se mide, con su fórmula y su fuente | Porcentaje de tiempo en que el monitor recibe respuesta del API |

La diferencia entre el 100 % y el SLO es el **presupuesto de error**: cuánto puede fallar el
servicio en el periodo sin romper la meta. Mientras quede presupuesto se pueden publicar
cambios con normalidad; si se acaba, se aplica la sección 5.

Alcance: el API de producción (`Nub_studio_back` en Render, plan gratuito) y la app Android
publicada en Google Play. No incluye la página web, que es de otro equipo.

## 2. Resumen de los acuerdos

| # | Acuerdo (SLA) | Meta interna (SLO) | Indicador (SLI) | Fuente | Periodo | Responsable |
| --- | --- | --- | --- | --- | --- | --- |
| SLA-01 | Disponibilidad del API ≥ 99 % | ≥ 99.5 % | % de tiempo arriba | UptimeRobot, monitor "NUB Studio API" | Mes calendario | Gustavo5B |
| SLA-02 | Catálogo: 95 % de las respuestas en menos de 1.5 s, con menos de 1 % de errores | p95 < 1 s | p95 y tasa de errores de k6 | Pipeline de Release, etapa 05 | Cada ejecución (cada lunes y cada `release/*`) | Gustavo5B |
| SLA-03 | La app no se cierra ni se congela: cierres < 1.09 % y ANR < 0.47 % de los usuarios diarios | Cierres ≤ 0.5 % y ANR ≤ 0.2 % | Tasas percibidas por el usuario | Google Play Console, Android vitals | Últimos 28 días | MishelGvea |
| SLA-04 | La app abre en menos de 5 s (arranque en frío) | < 2 s | Promedio de `TotalTime` de 5 arranques | `adb shell am start -W` | Cada versión publicada | SoraidaMedina |

Los valores del SLA-03 y del SLA-04 son los límites de Google Play: a partir de ahí Android
vitals considera que la app se porta mal o arranca de forma excesiva. Los SLO son la meta del
equipo, con margen debajo de esos límites.

## 3. Detalle de cada acuerdo

### SLA-01. Disponibilidad del API

- **Acuerdo:** el API responde al menos el **99 %** del tiempo de cada mes. Para un mes de 30
  días son como máximo **7 h 12 min** sin servicio.
- **SLO:** **99.5 %** al mes. Presupuesto de error: **3 h 36 min** en un mes de 30 días.
- **SLI:**

  ```
  Disponibilidad (%) = (tiempo total del periodo − tiempo caído) / tiempo total del periodo × 100
  ```

  Lo calcula UptimeRobot. Cada 5 minutos el monitor pide `GET /` al API de producción
  (`https://nub-studio-back.onrender.com/`). Si la respuesta no llega o no es 2xx/3xx, marca el
  servicio como caído hasta la siguiente verificación correcta y avisa por correo.
- **Fuente:** monitor **"NUB Studio API"** en UptimeRobot (plan gratuito: 50 monitores,
  intervalo de 5 minutos, guarda 3 meses de historial). Activo desde el **19 de noviembre de
  2026**.
- **Qué cuenta como caída:** todo lo que UptimeRobot marque como _Down_, sin excepciones. Si el
  servicio no responde durante un despliegue o un reinicio, el usuario tampoco puede usar la
  app, así que también cuenta.
- **Por qué `GET /`:** es la ruta de bienvenida del backend y no consulta la base de datos. Así
  el monitor no gasta las horas de cómputo gratuitas de Neon. **Límite:** si la base de datos
  falla pero el servidor sigue arriba, este indicador no lo ve. Esos errores aparecen en el
  SLA-02 y en las pruebas funcionales.
- **Efecto secundario buscado:** Render duerme el servicio después de 15 minutos sin tráfico y
  despertar tarda cerca de un minuto (hallazgo H5 del
  [plan de mejora](plan-mejora-rendimiento.md)). Una petición cada 5 minutos lo mantiene
  despierto, así que este monitor también cubre la acción 5 de ese plan. El plan gratuito de
  Render da 750 horas al mes por espacio de trabajo y un mes tiene como máximo 744 horas:
  alcanza solo si este es el único servicio gratuito del espacio de trabajo.

### SLA-02. Tiempo de respuesta del catálogo

- **Acuerdo:** con 20 personas usando el catálogo a la vez, el **95 %** de las respuestas llega
  en menos de **1.5 s** y menos del **1 %** de las peticiones falla.
- **SLO:** p95 menor a **1 s**.
- **SLI:**

  ```
  p95 = tiempo en que se respondió el 95 % de las peticiones (http_req_duration de k6)
  Errores (%) = peticiones fallidas / peticiones totales × 100 (http_req_failed de k6)
  ```

- **Fuente:** etapa **05 · Pruebas de rendimiento** del pipeline de Release
  (`tests/performance/carga.js`): 20 usuarios virtuales durante 2 minutos sobre destacadas,
  catálogo, categorías, filtros y búsqueda. Corre cada lunes a la 01:00 (hora de Huejutla) y en
  cada rama `release/*`. Los umbrales del SLA ya están en el guion (`p(95)<1500` y
  `rate<0.01`), así que **la etapa falla sola si el acuerdo se rompe**.
- **Límite:** k6 corre contra un backend temporal dentro de GitHub Actions, nunca contra
  Render, porque la base de producción la comparte la página web
  ([REPORTE_RENDIMIENTO.md](REPORTE_RENDIMIENTO.md), sección 5). Mide qué tan rápido responde
  el código, sin la red del usuario.
- **Dato de apoyo con red real:** la gráfica de tiempo de respuesta del monitor del SLA-01
  muestra cuánto tarda el servidor de Render en contestar desde internet. No forma parte del
  acuerdo porque mide `GET /`, no el catálogo, pero sirve para ver si Render se vuelve lento.

### SLA-03. Estabilidad de la app

- **Acuerdo:** menos del **1.09 %** de los usuarios diarios ve un cierre inesperado y menos del
  **0.47 %** ve que la app deja de responder (ANR). Son los límites de "mal comportamiento" de
  Google Play: si se pasan, Play puede mostrar menos la app en la tienda.
- **SLO:** cierres **≤ 0.5 %** y ANR **≤ 0.2 %**.
- **SLI** (definiciones de Android vitals):

  ```
  Tasa de cierres (%) = usuarios diarios con al menos un cierre inesperado mientras usaban la app
                        / usuarios activos diarios × 100
  Tasa de ANR (%)     = usuarios diarios con al menos un ANR mientras usaban la app
                        / usuarios activos diarios × 100
  ```

  Las dos se promedian en los **últimos 28 días**.
- **Fuente:** Google Play Console → **Supervisar y mejorar** → **Android vitals**.
- **Límite:** Android vitals solo muestra las tasas cuando hay suficientes usuarios. Mientras la
  app esté en prueba cerrada con pocos verificadores, puede decir que no hay datos suficientes.
  En ese caso se revisa la lista de fallas y ANR de la misma sección (en inglés _Crashes and
  ANRs_), que muestra cada cierre aunque sean pocos, y se toma como resultado el número de cierres y ANR encontrados en
  el periodo.

### SLA-04. Arranque de la app

- **Acuerdo:** la app abre en menos de **5 s** en un arranque en frío (la app no estaba en
  memoria). Android vitals considera excesivo un arranque en frío de 5 s o más.
- **SLO:** menos de **2 s**.
- **SLI:**

  ```
  Arranque en frío = promedio de TotalTime de 5 arranques (después de 1 de calentamiento que no cuenta)
  ```

  ```bash
  P=com.nubstudio.movil
  adb shell am force-stop $P
  adb shell am start -W -n $P/.MainActivity | grep TotalTime
  ```

  Es el mismo procedimiento de [REPORTE_RENDIMIENTO.md](REPORTE_RENDIMIENTO.md) (secciones 2
  y 6).
- **Fuente:** teléfonos del equipo con la versión publicada en Play o la versión Release. Cuando
  Play junte suficientes datos, Android vitals también muestra el arranque de los usuarios
  reales.
- **Periodo:** cada versión nueva antes de pasarla a producción.

## 4. Primera medición

**Periodo:** del viernes 20 al lunes 23 de noviembre de 2026 (4 días completos, 96 horas). Los
datos se toman el martes 24 de noviembre. El pipeline de Release del lunes 23 queda dentro del
periodo.

Presupuesto de error del SLA-01 en ese periodo: 96 h × 0.5 % = **29 min** para el SLO y
96 h × 1 % = **58 min** para el SLA.

| # | SLI medido | Resultado | SLO | SLA | Evidencia |
| --- | --- | --- | --- | --- | --- |
| SLA-01 | Disponibilidad del 20 al 23 de nov | _Se llena el 24 de nov_ | — | — | Captura del monitor en UptimeRobot |
| SLA-02 | p95 y errores de la ejecución del lunes 23 de nov | _Se llena el 24 de nov_ | — | — | Enlace a la ejecución en Actions |
| SLA-03 | Cierres y ANR, últimos 28 días | _Se llena el 24 de nov_ | — | — | Captura de Android vitals |
| SLA-04 | Arranque en frío, versión 1.1.0 (Realme 7) | **281 ms** | ✅ < 2 s | ✅ < 5 s | [REPORTE_RENDIMIENTO.md](REPORTE_RENDIMIENTO.md), sección 6 |

Mediciones anteriores, como referencia:

- **SLA-02:** la ejecución del 9 de noviembre dio p95 = **4.3 ms** y **0 %** de errores (0 de
  8,990 peticiones) ([REPORTE_RENDIMIENTO.md](REPORTE_RENDIMIENTO.md), sección 5).
- **SLA-04:** la versión 1.0.0 instalada desde Play arrancó en **579 ms** de promedio.
- **SLA-01:** el monitor empezó el 19 de noviembre por la noche con el servicio arriba.

## 5. Qué se hace si no se cumple

Basado en la política de presupuesto de error del libro de SRE de Google (referencia 2).

| Situación | Qué se hace |
| --- | --- |
| Se cumple el SLO | Se trabaja normal. |
| Se rompe el SLO, pero no el SLA | Se abre una issue con la etiqueta `bug` que enlaza la evidencia, y se atiende antes de la siguiente versión. |
| Se rompe el SLA | Issue con la etiqueta `bug` y prioridad alta. Hasta corregirla no se publican funciones nuevas, solo correcciones y parches de seguridad. La causa y la solución se anotan en esta sección. |

Cada incumplimiento tiene su propia issue, aunque varios tengan la misma causa.

## 6. Cuándo se revisa

| Cuándo | Qué | Quién |
| --- | --- | --- |
| Al llegar un correo de UptimeRobot | Ver si la caída sigue; si dura más de 30 min, abrir la issue | Gustavo5B |
| Cada lunes, después del pipeline de Release | Resultado de la etapa 05 (SLA-02) | Gustavo5B |
| Cada lunes | Android vitals (SLA-03) | MishelGvea |
| Antes de pasar una versión a producción | Arranque en frío (SLA-04) | SoraidaMedina |
| El primer día de cada mes | Disponibilidad del mes anterior (SLA-01) y actualizar la sección 4 | Gustavo5B |

## 7. Referencias

1. Google. _Service Level Objectives_. Site Reliability Engineering, capítulo 4.
   https://sre.google/sre-book/service-level-objectives/
2. Google. _Example Error Budget Policy_. The Site Reliability Workbook, apéndice B.
   https://sre.google/workbook/error-budget-policy/
3. Android Developers. _Android vitals_ (límites de mal comportamiento para cierres y ANR).
   https://developer.android.com/google/play/vitals
4. Android Developers. _App startup time in Android vitals_.
   https://developer.android.com/google/play/vitals/launch-time
5. Grafana Labs. _Thresholds_. Documentación de k6.
   https://grafana.com/docs/k6/latest/using-k6/thresholds/
6. UptimeRobot. _Pricing_ (características del plan gratuito). https://uptimerobot.com/pricing/

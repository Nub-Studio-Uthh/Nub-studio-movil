# Plan de mejora del rendimiento — NUB Studio (#158)

Convierte los resultados de las pruebas de rendimiento y de esfuerzo en acciones concretas:
qué se encontró, qué se va a hacer, quién lo hace, cómo se sabrá que funcionó y para cuándo.
La acción de mayor impacto ya se aplicó y se midió antes y después (sección 4).

Fuentes de los resultados:

- [REPORTE_RENDIMIENTO.md](REPORTE_RENDIMIENTO.md): arranque, fluidez, carga del catálogo y
  respuesta del API (#55); CPU, memoria y tamaño de la versión Release (#157).
- [resultados-esfuerzo.md](resultados-esfuerzo.md): el API con hasta 50 usuarios a la vez (#56).

---

## 1. Métricas, metas y resultados

| Métrica | Herramienta | Meta | De dónde sale la meta | Resultado | Estado |
| --- | --- | --- | --- | --- | --- |
| Arranque en frío | `adb shell am start -W` | Menos de 5 s | Android vitals lo considera excesivo desde 5 s | 579 ms (1.0.0) y 281 ms (1.1.0, Realme 7) | ✅ |
| Fluidez del catálogo | `adb shell dumpsys gfxinfo` | p95 de cuadro ≤ 16 ms | Un cuadro de más de 16 ms se ve como tirón | 15 ms y 14 ms | ✅ |
| Carga percibida del catálogo | Cronómetro sobre la app instalada | Menos de 2 s | Meta del plan de pruebas | ~1 s | ✅ |
| Respuesta del API, carga normal | k6 en el pipeline | p95 < 1.5 s y errores < 1 % | Umbrales del pipeline | p95 = 4.3 ms, 0 % | ✅ |
| Inicio de sesión con 50 usuarios | k6, prueba de esfuerzo | p95 < 4 s | Umbral de la prueba de esfuerzo | **4.7 s**, máximo 14.4 s | ❌ |
| Errores con 50 usuarios | k6, prueba de esfuerzo | Ningún error 500 | Un usuario no debería ver errores por carga | **48 errores 500** (0.6 %) | ❌ |
| Memoria al volver a Inicio | `adb shell dumpsys meminfo` | Máximo 20 % arriba de la memoria en reposo, 15 s después de volver | Meta del equipo: lo que ya no está en pantalla se libera | 145 MB en reposo → **288 MB** (+98 %) | ❌ |
| CPU con la app quieta | `adb shell top` | Menos de 1 % | Meta del equipo: sin actividad no debe gastar batería | **3.9 %** | ❌ |
| Primera carga con el servidor dormido | Prueba funcional CP-NF-01 | La app espera sin marcar error | Plan de pruebas | Hasta ~50 s, sin error | ⚠️ Disponibilidad |

Lo que cumple se mantiene vigilado con las mismas pruebas. Lo que no cumple pasa a la sección 3.

## 2. Análisis de los hallazgos

### H1. El login y los errores 500 bajo carga: la causa real

La prueba de esfuerzo mostró que con 50 usuarios el login llega a 4.7 s y que catálogo y
Mis pedidos, que normalmente responden en milisegundos, tuvieron máximos de ~10.4 s y errores
`Connection terminated due to connection timeout`. La primera hipótesis
([resultados-esfuerzo.md](resultados-esfuerzo.md), sección 4) era que el login ocupaba una
conexión de la base mientras comparaba la contraseña. **Al revisar el código no es así:** el
login usa `pool.query`, que regresa la conexión al terminar cada consulta.

La causa está en el **threadpool de Node** (libuv), que tiene **4 hilos** por defecto:

- `bcrypt.compare` (con costo 12, unos 240 ms) corre en esos hilos.
- **Abrir una conexión nueva a PostgreSQL** también los necesita: `dns.lookup` para encontrar
  el servidor y `crypto.pbkdf2` para la autenticación SCRAM.
- Con 50 logins a la vez, los 4 hilos se llenan de bcrypt y abrir una conexión espera en la
  misma fila. El pool corta a los 10 s (`connectionTimeoutMillis`) y la petición falla, sea
  de login, catálogo o pedidos. Por eso los máximos de catálogo y pedidos son casi 10 s.

Se comprobó con un script en Node que lanza 50 `bcrypt.compare` reales y mide cuánto tardan
esos dos pasos mientras tanto (2 núcleos, misma versión de `bcrypt` que el backend):

| Caso | Espera de `dns.lookup` | Espera de `pbkdf2` | p95 de los 50 logins |
| --- | --- | --- | --- |
| Sin carga | 4 ms | 1 ms | — |
| 50 logins, como estaba | **5,689 ms** | **5,686 ms** | 5,749 ms |
| 50 logins con 16 hilos (`UV_THREADPOOL_SIZE=16`) | 5,429 ms | 5,428 ms | 5,835 ms |
| **50 logins, solo 2 bcrypt a la vez** | **12 ms** | **2 ms** | 5,688 ms |

Conclusiones:

- Subir el número de hilos **no sirve**: bcrypt los vuelve a llenar.
- Limitar bcrypt a 2 a la vez deja siempre hilos libres y abrir conexiones vuelve a tardar
  milisegundos, **sin cambiar el tiempo del login**.
- El login sigue tardando con 50 usuarios porque bcrypt usa CPU a propósito (es lo que lo hace
  seguro). Bajar el costo de 12 lo haría más rápido pero más fácil de romper por fuerza bruta,
  así que no se toca. Lo que sí se puede evitar es que una ráfaga de logins llegue hasta
  bcrypt (H2).

### H2. El login no tiene límite de intentos por IP

Hoy una cuenta se bloquea después de 3 contraseñas incorrectas, pero no hay límite de
peticiones por IP en `/api/auth/login`. Una ráfaga desde una misma IP (fuerza bruta o un
error en un cliente) llena el threadpool como en H1 y afecta a todos los usuarios.

### H3. La memoria de las imágenes no se libera

Al abrir 5 obras, _Graphics_ pasa de 35 MB a 119 MB y _Native Heap_ de 37 MB a 87 MB; 15 s
después de volver a Inicio siguen igual (#157, sección 6.7). En el código, las imágenes del
catálogo, del carrusel y de la **galería del detalle de la obra** usan
`cachePolicy="memory-disk"` de `expo-image`, que guarda en memoria cada imagen ya vista. En la
galería son imágenes grandes que normalmente solo se ven una vez.

### H4. La app usa CPU estando quieta

En Inicio, sin tocar nada, la app usa entre 3 y 5 % de CPU (#157, sección 6.6). Algo sigue
trabajando: una animación en bucle (por ejemplo el brillo de los skeletons, que usa
`withRepeat` infinito mientras está montado), un temporizador o un componente que se vuelve a
dibujar.

### H5. El servidor dormido de Render

El backend usa el plan gratuito de Render: se duerme después de 15 minutos sin tráfico y
despertar tarda alrededor de un minuto. La app ya espera hasta 60 s con un mensaje (#116),
pero la primera persona del día espera hasta ~50 s. Es un tema de disponibilidad y se conecta
con los acuerdos de servicio de #144.

### H6. No hay mediciones en un teléfono de gama baja

Todas las mediciones son en teléfonos con 8 GB de RAM. En uno con 2 o 3 GB, H3 puede hacer que
Android cierre la app en segundo plano. Queda pendiente con las pruebas de compatibilidad (#49).

## 3. Plan de acción

Prioridad según el impacto (cuántos usuarios afecta y qué tan grave es) y el esfuerzo.
Responsables y fechas son la propuesta del equipo.

| # | Hallazgo | Acción | Responsable | Meta para darla por cumplida | Fecha | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | H1 | Limitar bcrypt a 2 operaciones a la vez en el backend (`src/services/bcryptLimitado.js`) | Gustavo5B | Con 50 usuarios: ningún error 500 por conexión y máximo de catálogo y Mis pedidos menor a 2 s; login p95 < 4 s o explicado | 2026-11-19 | Aplicada, en medición (sección 4) |
| 2 | H2 | Límite de intentos de login por IP con `express-rate-limit`, configurable para la prueba de esfuerzo | Gustavo5B | Una ráfaga recibe `429` sin llegar a bcrypt; el login normal no cambia | 2026-11-24 | Pendiente |
| 3 | H3 | Galería del detalle con `cachePolicy="disk"` y `Image.clearMemoryCache()` al salir de la obra; revisar que el catálogo pida imágenes del tamaño en que se muestran | MishelGvea | 15 s después de volver a Inicio, máximo 20 % arriba del reposo (≤ 174 MB) | 2026-11-26 | Pendiente |
| 4 | H4 | Encontrar con el Profiler de React DevTools qué se dibuja o anima en Inicio sin interacción y detenerlo | SoraidaMedina | CPU en reposo menor a 1 % (promedio de 10 s) | 2026-11-26 | Pendiente |
| 5 | H5 | Monitor externo que consulte el API cada 10 min (mantiene despierto el servicio y mide la disponibilidad de #144). Revisar que alcancen las 750 horas gratis al mes | Gustavo5B | Primera carga del catálogo menor a 2 s a cualquier hora | 2026-11-28 | Pendiente |
| 6 | H6 | Repetir arranque, fluidez y memoria en un teléfono o emulador de 2–3 GB de RAM (#49) | Equipo | Arranque < 5 s y p95 de cuadro ≤ 16 ms, o la diferencia explicada | 2026-11-28 | Pendiente |

## 4. Mejora aplicada: límite de bcrypt (acción 1)

**Cambio:** `src/services/bcryptLimitado.js` en `Nub_studio_back` envuelve `bcrypt.compare` y
`bcrypt.hash`. Como máximo 2 corren a la vez (los 4 hilos menos 2 que siempre quedan libres);
las demás esperan su turno en una fila de JavaScript, en el orden en que llegaron. Los
controladores de login, registro, recuperación y cuenta solo cambian el `import`. El costo de
bcrypt sigue en 12. Tiene pruebas unitarias del límite, del orden de la fila y de los errores.

**Cómo se mide:** la misma prueba de esfuerzo, en la misma máquina de GitHub, una vez con el
backend de `main` (antes) y otra con la rama del cambio (después). Ver sección 5.

| Medición con 50 usuarios | Antes (`main`) | Después (límite de bcrypt) | Meta |
| --- | --- | --- | --- |
| Errores 500 | Pendiente | Pendiente | 0 |
| Login p95 | Pendiente | Pendiente | < 4 s o explicado |
| Catálogo, máximo | Pendiente | Pendiente | < 2 s |
| Mis pedidos, máximo | Pendiente | Pendiente | < 2 s |
| Recuperación p95 | Pendiente | Pendiente | < 1.5 s |

## 5. Cómo volver a medir

1. Actions → **Pruebas manuales** → **Run workflow**.
2. En **Rama de Nub_studio_back que se prueba** escribir `main` para el "antes" o la rama del
   cambio para el "después". Dejar 50 usuarios.
3. Al terminar, el artefacto `reporte-esfuerzo` trae `fases-esfuerzo.md` con la tabla por fase
   y por endpoint.

Las dos corridas pueden lanzarse al mismo tiempo: cada una usa su propia máquina y su propia
base temporal. Nunca se usa el backend de Render.

## 6. Referencias

1. Node.js. (2026). _Don't Block the Event Loop (or the Worker Pool)_. Node.js Learn.
   https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop
2. libuv. (2026). _Thread pool work scheduling_. libuv documentation.
   https://docs.libuv.org/en/v1.x/threadpool.html
3. OWASP. (2026). _Password Storage Cheat Sheet_. OWASP Cheat Sheet Series.
   https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
4. Android Developers. (2026). _App startup time_.
   https://developer.android.com/topic/performance/launch-time
5. Android Developers. (2026). _Understanding and troubleshooting Android memory_.
   https://developer.android.com/topic/performance/memory/guide
6. Grafana Labs. (2026). _Thresholds_. Grafana k6 documentation.
   https://grafana.com/docs/k6/latest/using-k6/thresholds/
7. Expo. (2026). _Image (expo-image)_. Expo SDK 57 reference.
   https://docs.expo.dev/versions/v57.0.0/sdk/image/
8. Render. (2026). _Deploy for Free_. Render Docs. https://render.com/docs/free

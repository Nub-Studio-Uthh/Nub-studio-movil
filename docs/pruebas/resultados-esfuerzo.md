# Resultados de las pruebas de esfuerzo (#56)

Ejecución de `tests/performance/estres.js` con k6 contra el entorno temporal
(`scripts/entorno/levantar-entorno.sh`: PostgreSQL 18 con datos de prueba y el backend
`Nub_studio_back` en `main`), sin tocar el backend de Render. Cómo se lanza: sección 06 de
[pipelines.md](pipelines.md).

| Dato | Valor |
| --- | --- |
| Fecha | 2026-11-08 |
| Máquina | Laptop de desarrollo (Windows 11, Docker Desktop); backend y base en la misma máquina |
| Carga | Sube hasta **50 usuarios virtuales**, se mantiene **2 minutos** y luego 1 minuto de recuperación con 5 |
| Endpoints | Catálogo (HU-01), inicio de sesión (HU-06) y Mis pedidos (HU-10) |

> Los tiempos absolutos dependen de la máquina. Lo que importa es la comparación entre
> endpoints y entre fases, y que el comportamiento se repite en el runner de GitHub Actions.

## 1. Con la cuenta de prueba (camino real)

Cada usuario virtual inicia sesión con la contraseña correcta y pide Mis pedidos con token.

| Fase | p95 | Promedio | Errores | Umbrales |
| --- | --- | --- | --- | --- |
| Estrés | 4366.6 ms | 1061.2 ms | 0.67 % | ❌ p(95)<4000 · ✅ rate<0.10 |
| Recuperación | 525.8 ms | 162.6 ms | 0.00 % | ✅ p(95)<1500 · ✅ rate<0.01 · ✅ checks>0.99 |

Por endpoint en el pico, del más lento al más rápido:

| Endpoint | p95 | Promedio | Máximo |
| --- | --- | --- | --- |
| Inicio de sesión (HU-06) | **4701.3 ms** | 2981.3 ms | 14433.0 ms |
| Catálogo (HU-01) | 18.0 ms | 65.9 ms | 10379.9 ms |
| Mis pedidos (HU-10) | 11.3 ms | 136.4 ms | 10398.5 ms |

Volumen: 8 038 peticiones (25.7 por segundo); 48 fallaron (0.6 %).

## 2. Sin cuenta (cómo estaba el guion antes)

Login con un correo inexistente y Mis pedidos sin token.

| Fase | p95 | Promedio | Errores | Umbrales |
| --- | --- | --- | --- | --- |
| Estrés | 91.2 ms | 30.2 ms | 0.00 % | ✅ |
| Recuperación | 34.5 ms | 14.5 ms | 0.00 % | ✅ |

Volumen: 45 255 peticiones (151 por segundo), sin errores. El backend rechaza estas
peticiones antes de verificar la contraseña o consultar la base, así que **esconde el límite
real**: por eso el guion ahora usa la cuenta de prueba cuando está disponible.

## 3. Hallazgos

1. **El inicio de sesión es el primer punto de quiebre.** Con 50 usuarios su p95 llega a
   4.7 s y algunos tardan hasta 14 s. Cada login compara la contraseña con bcrypt de costo 12
   (lento a propósito, por seguridad) y Node solo hace unas pocas comparaciones a la vez; las
   demás esperan en fila. Catálogo y Mis pedidos siguen respondiendo en milisegundos (p95 de
   18 ms y 11 ms).
2. **Se agotan las conexiones a la base.** Las 48 peticiones fallidas son errores 500 con
   `Connection terminated due to connection timeout` en el log del backend (catálogo,
   Mis pedidos y login). Cada pool de `src/config/db.js` permite 10 conexiones y espera
   10 s por una libre; en el pico, los logins en fila ocupan conexiones y el resto se queda
   sin ellas. Por eso catálogo y pedidos tienen máximos de ~10 s aunque su p95 sea bajo.
3. **La API se recupera.** Al bajar a 5 usuarios vuelve a la meta de una carga normal
   (p95 de 0.5 s, sin errores): no queda degradada después del pico.

**Límite observado:** la API sostiene 50 usuarios simultáneos en catálogo y pedidos, pero
el inicio de sesión deja de cumplir la meta de 4 s alrededor de ese punto y arrastra al resto
cuando se agotan las conexiones. En el uso real, iniciar sesión es mucho menos frecuente que
navegar el catálogo, así que el riesgo aparece solo en picos (por ejemplo, una campaña que
lleve a muchas personas a entrar al mismo tiempo).

## 4. Recomendaciones para el backend

> **Actualización (#158):** al revisar el código, el login no ocupa una conexión mientras
> compara la contraseña (usa `pool.query`). La causa real de los errores es que bcrypt llena el
> threadpool de Node y no deja abrir conexiones nuevas a la base. El análisis, la mejora
> aplicada y la comparación antes/después están en
> [plan-mejora-rendimiento.md](plan-mejora-rendimiento.md).

Son cambios de `Nub_studio_back` (otro repositorio); se dejan aquí para que el equipo los
evalúe:

- **No ocupar una conexión de la base mientras se compara la contraseña.** Leer el usuario,
  liberar la conexión, correr `bcrypt.compare` y después escribir la sesión.
- **Revisar el tamaño de los pools** (`max: 10`) contra el límite de conexiones del plan de
  la base, y bajar `connectionTimeoutMillis` para fallar rápido en vez de esperar 10 s.
- **Limitar los intentos de login por IP** (hoy no hay rate limit en `/api/auth/login`): además
  de proteger contra ataques de fuerza bruta, evita que una ráfaga de logins sature el servidor.
- Volver a correr esta prueba (Actions → Pruebas manuales) después de cada cambio y comparar
  la tabla por endpoint.

## 5. Después de la mejora (#158)

Con el límite de bcrypt en el backend (`src/services/bcryptLimitado.js`), la misma prueba en
GitHub, lanzada al mismo tiempo con `main` y con la rama del cambio:

| Fase de estrés, 50 usuarios | Antes (`main`) | Después |
| --- | --- | --- |
| Errores | 0.01 % | 0.00 % |
| Mis pedidos, máximo | 10,005 ms | 17 ms |
| Login, p95 | 1,927 ms | 3,137 ms |
| Login, máximo | 8,523 ms | 3,167 ms |

Desaparecen los errores y las esperas de 10 s por conexión; el login queda parejo y dentro de
la meta de 4 s. El análisis completo y las dos rondas de medición están en
[plan-mejora-rendimiento.md](plan-mejora-rendimiento.md), sección 4.

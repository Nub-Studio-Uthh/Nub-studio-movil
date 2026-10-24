# Pipelines de pruebas — Nub-studio-movil

Las pruebas automáticas corren en GitHub Actions con un **pipeline estándar de tres archivos** en `.github/workflows/`, separados según **cuándo** se ejecutan. Cada tipo de prueba definido en la planeación (issues con la etiqueta `testing` del tablero Scrumban) es una **etapa** con su número, así que en la pestaña Actions se ve claramente qué tipo de prueba pasó, falló o se omitió.

> **Importante:** no hay un backend de pruebas en la nube y el de Render comparte la base con la web en producción. Por eso las etapas de integración, rendimiento, esfuerzo y aceptación **arman su propio entorno temporal** dentro de GitHub Actions: una base PostgreSQL con datos de prueba y el backend, que se destruyen al terminar. Ver la [sección 5](#5-entorno-temporal-de-pruebas).

## 1. Estructura

```
.github/
├── actions/preparar/action.yml   # paso compartido: pnpm, Node 22, pnpm install y carpeta reports/
└── workflows/
    ├── ci.yml        # en cada Pull Request
    ├── release.yml   # en ramas release/*, cada lunes y a mano
    └── manual.yml    # solo a mano (pruebas pesadas)
```

Todas las etapas siguen **la misma plantilla**:

**preparar → `pnpm test:<tipo>` → guardar `reporte-<tipo>`**

1. `actions/checkout` y la acción compartida `preparar`.
2. Un solo comando de `package.json` (`pnpm test:estatico`, `pnpm test:unit`, …). Son los mismos comandos que se usan en local.
3. La salida se guarda en `reports/` y se sube como artefacto `reporte-<tipo>` por 14 días (en Actions → la ejecución → *Artifacts*).

Reglas comunes de los tres archivos: permisos de solo lectura (`permissions: contents: read`), tiempo límite por etapa (`timeout-minutes`) y `concurrency`, que cancela la ejecución anterior cuando se sube un commit nuevo a la misma rama.

## 2. ¿Cuándo corre cada etapa?

Se sigue el flujo **Git Flow** del proyecto (`feature/*` → `develop` → `release/*` → `main`):

| # | Etapa | Archivo | Se ejecuta cuando… | Comando |
| --- | --- | --- | --- | --- |
| 01 | **Análisis estático** (#54) | `ci.yml` | Se abre o actualiza un PR a `develop` o `main` | `pnpm test:estatico`, `pnpm test:doctor` |
| 08 | **Seguridad** (#60) | `ci.yml` | Igual que la 01 | `pnpm test:seguridad` + TruffleHog, gitleaks y Semgrep |
| 02 | **Pruebas unitarias** (#43, #44) | `ci.yml` | Igual que la 01, si pasaron la 01 y la 08 | `pnpm test:unit` |
| — | **Build de Android** | `ci.yml` | Igual que la 01, si pasó la 02 | `pnpm build` |
| 04 | **Pruebas de regresión** (#58) | `release.yml` | Al subir una rama `release/*`, cada lunes (01:00, hora de Huejutla) sobre `develop` o a mano | Vuelve a correr `ci.yml` completo |
| 03 | **Pruebas de integración** (#45, #46) | `release.yml` | Después de la regresión, en el entorno temporal | `pnpm test:integration`, `pnpm test:api` |
| 05 | **Pruebas de rendimiento** (#55) | `release.yml` | Después de la regresión, en el entorno temporal | `pnpm test:carga` |
| 07 | **Pruebas de aceptación** (#57, #90) | `release.yml` | Después de la regresión, en el entorno temporal con un emulador Android | `pnpm test:e2e` |
| 06 | **Pruebas de esfuerzo** (#56) | `manual.yml` | **Solo a mano** (se elige el número máximo de usuarios), en el entorno temporal | `pnpm test:estres` |

```
ci.yml        01 Análisis estático ─┐
(cada PR)     08 Seguridad ─────────┴─> 02 Unitarias ─> Build de Android

release.yml   04 Regresión (ci.yml completo) ─┬─> 03 Integración†
(release/*,                                   ├─> 05 Rendimiento†
 lunes, manual)                               └─> 07 Aceptación† ─> Build UAT

manual.yml    06 Esfuerzo†

† levanta el entorno temporal (PostgreSQL + backend) en la misma máquina
```

Si una etapa falla, las que dependen de ella no se ejecutan: si falla el lint, no se gastan minutos en las pruebas unitarias ni en el build.

## 3. Detalle de cada etapa

### 01) Análisis de código estático — `ci.yml`

- **ESLint y Prettier** (`pnpm test:estatico`): falla si hay errores de código o archivos sin formato.
- **expo-doctor** (`pnpm test:doctor`): revisa que las dependencias y la configuración sean compatibles con el SDK de Expo instalado.

### 08) Seguridad — `ci.yml`

- **Dependencias** (`pnpm test:seguridad`): `pnpm audit` falla si una dependencia de producción tiene una vulnerabilidad alta o crítica.
- **TruffleHog:** busca contraseñas o tokens **verificados** en los commits del PR.
- **gitleaks:** revisa **todo el historial** de git, incluidos secretos que no se pueden verificar. Deja un reporte JSON (con los valores ocultos).
- **Semgrep:** busca patrones de código inseguro en JavaScript y React.

Más detalle de cada herramienta y cómo usarlas en local: [`docs/seguridad.md`](../seguridad.md).

### 02) Pruebas unitarias — `ci.yml`

Ejecuta `pnpm test:unit --ci --coverage` con Jest. El reporte de cobertura queda en `reporte-unitarias`. La etapa falla si la cobertura de `src/utils` baja del mínimo configurado en `package.json`: 80 % de líneas, funciones y sentencias, y 70 % de ramas.

Pruebas incluidas: `tests/unit/` (funciones puras de cada historia de usuario), `tests/unit/componentes/` (pantallas con `@testing-library/react-native` y la API simulada) y `tests/unit/viewmodels/` (un ViewModel por pantalla, con `renderHook` y el servicio simulado). Las simulaciones de módulos nativos están en `tests/setup/jest.setup.js`.

### Build de Android — `ci.yml`

`pnpm build` (`expo export --platform android`) comprueba que la app se pueda empaquetar. Si un PR rompe el build, no se puede fusionar.

### 04) Pruebas de regresión — `release.yml`

Complementa el recorrido manual en Expo Go del issue #58.

Vuelve a correr **`ci.yml` completo** (01, 08, 02 y build) reutilizándolo con `workflow_call`, sin copiar sus pasos. La ejecución de cada lunes sobre `develop` detecta si algo que ya funcionaba se rompió al juntar el trabajo de los tres integrantes. Después de la regresión siguen las etapas 03, 05 y 07.

### 03) Pruebas de integración — `release.yml`

1. `pnpm test:integration` prueba contra la API del backend que:
   - las rutas públicas (`/api/obras`, `/api/categorias`, `/api/artistas`, `/api/colecciones`, `/api/blog/posts`) respondan 200;
   - el login rechace credenciales inválidas;
   - carrito y favoritos exijan sesión (401/403);
   - con una cuenta de cliente de prueba, se pueda agregar y quitar un favorito.
2. `pnpm test:api` ejecuta con **Newman** la colección `tests/api/nub-studio.postman_collection.json`:
   - rutas públicas de HU-01 a HU-05 (el catálogo debe responder en menos de 3 s);
   - rutas que exigen sesión, sin token;
   - con la cuenta de prueba: login, sesión válida, favoritos (HU-07), carrito (HU-08), mis pedidos (HU-10) y cierre de sesión. Estas peticiones solo consultan; no modifican los datos de la cuenta.

   Si no se pasan `email` y `password`, las pruebas con sesión aparecen como omitidas (*skipped*). Lo mismo pasa con "Abrir publicación" y "Abrir colección" si la base no tiene publicaciones o colecciones.

### 05) Pruebas de rendimiento — `release.yml`

Cubre la parte del API del issue #55. La parte de la app (arranque en frío y fluidez de listas) se mide manualmente con Perf Monitor y Android Studio Profiler.

`pnpm test:carga` ejecuta `tests/performance/carga.js` con **k6**, simulando usuarios que recorren HU-01: destacadas de Inicio, catálogo, categorías, filtros combinados y búsqueda.

| Parámetro | Valor |
| --- | --- |
| Carga | 20 usuarios virtuales simultáneos |
| Duración | 2 minutos: 30 s de subida, 1 min sostenido y 30 s de bajada |
| Métricas | Tiempo de respuesta (p95 y promedio), tasa de errores y peticiones por segundo |
| Umbrales fijos | p95 < **1.5 s** y errores < **1 %** (si no se cumplen, k6 falla) |
| Línea base | `tests/performance/linea-base.json`, tomada de una ejecución en GitHub Actions |
| Comparación | Falla si el p95 o el promedio empeoran más de un **20 %** respecto a la línea base (y más de 50 ms, para no fallar por milisegundos de ruido) |

Después de k6, `pnpm test:reporte carga` compara el resultado con la línea base y publica una tabla (métrica, línea base, actual, cambio y estado) en el resumen de la ejecución y en `comparacion-linea-base.md`. Todo se guarda en `reporte-rendimiento`, incluido el `carga.json` completo.

**Actualizar la línea base** (solo cuando un cambio mejore o cambie el rendimiento a propósito): descargar el `carga.json` de una ejecución de `release.yml` y correr

```bash
pnpm --silent test:reporte linea-base carga.json > tests/performance/linea-base.json
```

### 06) Pruebas de esfuerzo — `manual.yml`

`pnpm test:estres` ejecuta `tests/performance/estres.js` con **k6** sobre catálogo (HU-01), inicio de sesión (HU-06) y pedidos (HU-10), en dos fases seguidas. Un usuario virtual es un programa que repite las peticiones como lo haría una persona; no son usuarios reales.

| | Fase 1: Estrés | Fase 2: Recuperación |
| --- | --- | --- |
| Carga | Sube por etapas de 30 s (25 % → 50 % → 100 %) hasta el máximo elegido al lanzarlo (**50 por defecto**, issue #56) | **5** usuarios constantes |
| Duración | 4 min: 1.5 min de subida, **2 min** en el pico y 30 s de bajada | **1 min**, empieza al terminar el estrés |
| Umbrales | p95 < **4 s** y errores < **10 %** (amplios: se busca el punto de quiebre) | p95 < **1.5 s**, errores < **1 %** y más del 99 % de checks correctos (la meta de una carga normal) |
| Qué demuestra | Hasta dónde aguanta la API | Que la API **vuelve a la normalidad** después del pico; si no, la etapa falla |

Métricas de cada fase: tiempo de respuesta (p95 y promedio) y tasa de errores. Para login y pedidos sin sesión, un 401 o 403 es la respuesta correcta; solo cuentan como error las respuestas 5xx o la falta de respuesta.

Después de k6, `pnpm test:reporte estres` publica una tabla por fase en el resumen de la ejecución y en `fases-esfuerzo.md`. Todo se guarda en `reporte-esfuerzo`, incluido el `estres.json` completo.

Se lanza desde **Actions → Pruebas manuales → Run workflow**. Corre contra el entorno temporal, así que la carga no afecta al backend que comparte la base con la web.

### 07) Pruebas de aceptación — `release.yml`

Apoya al issue #57: la aceptación final la da el cliente revisando la app en Expo Go. Esta etapa comprueba antes esos mismos flujos de forma automática y genera el APK que se le entrega.

Solo corre si pasó la regresión (análisis estático, seguridad, unitarias y build). Tiene dos trabajos en secuencia:

1. **E2E con Maestro** (issue #90):
   1. Levanta el entorno temporal (base con datos de prueba y backend en `http://localhost:4000`).
   2. Genera el proyecto Android (`expo prebuild`) y compila un **APK de prueba** que apunta a `http://localhost:4000`. Ese APK es el único que permite HTTP sin cifrar: `app.config.js` activa `usesCleartextTraffic` solo cuando existe `PERMITIR_HTTP=true`. La app normal y los builds de EAS siguen bloqueando HTTP.
   3. Levanta un emulador Android (API 34), instala el APK y conecta el emulador con el backend con `adb reverse tcp:4000 tcp:4000`.
   4. Ejecuta `pnpm test:e2e` con los 8 flujos de `tests/e2e/`. Si uno falla, la etapa falla y el build UAT no se genera.
2. **Build para el cliente (UAT):** si los flujos pasan, EAS genera un APK de prueba (perfil `preview` en `eas.json`) que se comparte con el cliente para que valide la versión en su teléfono.

Cada flujo comprueba criterios de aceptación de una historia de usuario y guarda capturas como evidencia:

| Flujo | Historia | Criterio de aceptación que comprueba | Capturas |
| --- | --- | --- | --- |
| `01-visitante-explora-catalogo` | HU-01, HU-02 | Un visitante entra sin cuenta, ve Inicio y el catálogo, y abre el detalle de una obra con favorito y "Agregar al carrito" | `01-inicio`, `01-detalle-obra` |
| `02-registro-validaciones` | HU-06 | El registro rechaza un correo con formato inválido | `02-correo-invalido` |
| `03-carrito-requiere-sesion` | HU-08 | Agregar al carrito sin sesión pide iniciar sesión | `03-carrito-pide-sesion` |
| `04-catalogo-filtros` | HU-01 | Los filtros de categoría y precio se combinan y se limpian, hay un mensaje claro sin resultados y no se acepta un mínimo mayor que el máximo | `04-filtros-aplicados`, `04-sin-resultados`, `04-precio-invalido` |
| `05-visitante-lee-blog` | HU-05 | El blog se abre sin cuenta y cada publicación muestra su título y contenido | `05-blog`, `05-publicacion` |
| `06-visitante-ve-perfil-artista` | HU-03 | Desde una obra se abre el perfil del artista con sus obras | `06-perfil-artista` |
| `07-visitante-explora-colecciones` | HU-04 | Las colecciones se listan desde Inicio y cada una muestra sus obras | `07-colecciones`, `07-coleccion` |
| `08-favoritos-requiere-sesion` | HU-07 | Favoritos sin sesión invita a crear cuenta, y el corazón de una obra pide iniciar sesión | `08-favoritos-invitado`, `08-favorito-pide-sesion` |

`reporte-aceptacion` guarda el reporte JUnit (`maestro.xml`), una carpeta por flujo con sus capturas (`maestro/`) y el log del backend.

> Los flujos buscan los elementos por su `testID` (`obra-card-0`, `detalle-agregar-carrito`, `registro-correo`). Si se cambia o se quita un `testID` en un componente, hay que actualizar el flujo. Sin sesión, la app abre en **Login**: cada flujo entra como visitante con `login-explorar` (o va al registro con `login-registrate`).

## 4. Secretos y configuración del repositorio

Los secretos se configuran en **GitHub → Settings → Secrets and variables → Actions** (lo hace quien administra el repositorio):

| Secreto | Para qué | Etapas | ¿Se crea? |
| --- | --- | --- | --- |
| `EXPO_TOKEN` | Token de la cuenta de Expo, para EAS Build | 07 (Build UAT) | Sí |

Las etapas 03, 05, 06 y 07 no necesitan secretos: la URL (`http://localhost:4000`) y la cuenta de prueba (`cliente@nubprueba.com`) están escritas en el workflow porque solo existen dentro del entorno temporal.

Para EAS también hay que ejecutar una sola vez `eas init` en el proyecto, que agrega el `projectId` en `app.json`.

**Reglas de la rama** (Settings → Branches): `develop` y `main` deben exigir que pasen estos checks antes de fusionar un PR: `01 · Análisis estático`, `08 · Seguridad`, `02 · Pruebas unitarias` y `Build de Android`.

## 5. Entorno temporal de pruebas

Las etapas 03, 05, 06 y 07 corren en un entorno que se arma desde cero en cada ejecución (issue #85) y se destruye al terminar, así que siempre parte de los mismos datos y nunca toca producción:

```
PostgreSQL 18 en Docker ─> sql/01..05 ─> backend Nub_studio_back ─> pruebas contra http://localhost:4000
```

1. El workflow descarga el backend (`Gustavo5B/Nub_studio_back`, rama `main`) en la carpeta `backend/`.
2. `scripts/entorno/levantar-entorno.sh` crea el contenedor de PostgreSQL 18 con SSL (el backend siempre se conecta con SSL), carga los archivos de `scripts/entorno/sql/` en orden y arranca el backend.
3. Espera a que `/api/categorias` responda. Si el backend no arranca, la etapa falla y muestra las últimas líneas de su log.
4. El log del backend (`backend.log`) se guarda junto con el reporte de la etapa.

| Archivo | Contenido |
| --- | --- |
| `sql/01-roles.sql` | Roles `usr_admin`, `usr_artista`, `usr_cliente` y `usr_visitante`, con una contraseña que solo existe en este entorno |
| `sql/02-esquema.sql` | Estructura de la base (66 tablas, funciones, índices y triggers), sin datos |
| `sql/03-permisos.sql` | Permisos de cada rol, iguales a los de la base del equipo |
| `sql/04-datos-prueba.sql` | Catálogos fijos y datos **inventados**: 4 cuentas, 2 artistas, 12 obras (3 destacadas, 1 con descuento, 1 pendiente), 2 colecciones, 3 publicaciones y 1 pedido |
| `sql/05-secuencias.sql` | Ajusta las secuencias al id más alto, para que los registros nuevos no choquen |

Cuentas del entorno (contraseña `Prueba2026!` en todas): `admin@nubprueba.com`, `artista@nubprueba.com`, `artista2@nubprueba.com` y `cliente@nubprueba.com`.

Brevo, Cloudinary, Supabase, Mercado Pago y Anthropic reciben valores falsos: el entorno no manda correos ni toca servicios reales.

> En `sql/04-datos-prueba.sql` nunca van datos reales de producción (usuarios, artistas, pedidos): el repositorio es público.

Nunca usar la URL del backend de Render para pruebas, porque comparte la base de datos con la web en producción.

## 6. Cómo correr las pruebas localmente

Los comandos son los mismos que usa el pipeline:

```bash
pnpm install
pnpm test:estatico        # 01 análisis estático (ESLint y Prettier)
pnpm test:doctor          # 01 compatibilidad con el SDK de Expo
pnpm test:seguridad       # 08 dependencias vulnerables
pnpm test:unit            # 02 unitarias
pnpm build                # build de Android

# Con el backend local encendido:
pnpm test:api             # 03 Postman/Newman (usa http://localhost:4000 por defecto)
pnpm test:api --env-var "email=<cliente de tu base>" --env-var "password=<su contraseña>"   # con sesión
pnpm test:e2e             # 07 Maestro, con un emulador o teléfono conectado
pnpm test:aceptacion      # 07 completa: estático → unitarias → Maestro (se detiene al primer fallo)
```

### Aceptación en local, igual que en CI

Necesita Docker, Maestro 2.7.0 (`env MAESTRO_VERSION=2.7.0 bash` con el instalador de `https://get.maestro.mobile.dev`) y un emulador encendido:

```bash
BACKEND_DIR=../Nub_studio_back DB_PORT=5433 bash scripts/entorno/levantar-entorno.sh
export PERMITIR_HTTP=true EXPO_PUBLIC_API_URL=http://localhost:4000
pnpm expo prebuild --platform android --no-install --clean
(cd android && ./gradlew assembleRelease -PreactNativeArchitectures=x86_64)   # solo la arquitectura del emulador
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb reverse tcp:4000 tcp:4000
pnpm test:aceptacion
bash scripts/entorno/levantar-entorno.sh detener
```

> `expo prebuild` cambia los scripts `android` e `ios` de `package.json` a `expo run:*`; no hay que subir ese cambio.

Las etapas 03 (Jest), 05 y 06 leen la URL del backend de la variable `API_URL`:

```bash
# Linux / macOS (bash)
API_URL=http://localhost:4000 pnpm test:integration
API_URL=http://localhost:4000 pnpm test:carga
API_URL=http://localhost:4000 pnpm test:estres
```

```powershell
# Windows (PowerShell)
$env:API_URL="http://localhost:4000"
pnpm test:integration
pnpm test:carga
pnpm test:estres
```

Para las pruebas de integración con sesión, define también `TEST_USER_EMAIL` y `TEST_USER_PASSWORD` con una cuenta de cliente de prueba de la base local.

### El entorno temporal en local

Con **Docker** instalado se levanta el mismo entorno que usa CI, sin tocar la base local. Necesita el backend clonado; si el puerto 5432 o el 4000 están ocupados, se cambian con `DB_PORT` y `API_PORT`:

```bash
BACKEND_DIR=../Nub_studio_back DB_PORT=5433 bash scripts/entorno/levantar-entorno.sh
API_URL=http://localhost:4000 TEST_USER_EMAIL=cliente@nubprueba.com TEST_USER_PASSWORD='Prueba2026!' pnpm test:integration
bash scripts/entorno/levantar-entorno.sh detener   # apaga el backend y borra el contenedor
```

Sin Docker, `levantar-entorno.sh datos` carga los archivos en una base vacía que ya exista (se indica con `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`; el usuario debe poder crear roles) y `levantar-entorno.sh backend` arranca el backend contra ella.

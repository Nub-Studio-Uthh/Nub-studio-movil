# Pipelines de pruebas — Nub-studio-movil

Las pruebas automáticas corren en GitHub Actions con un **pipeline estándar de tres archivos** en `.github/workflows/`, separados según **cuándo** se ejecutan. Cada tipo de prueba definido en la planeación (issues con la etiqueta `testing` del tablero Scrumban) es una **etapa** con su número, así que en la pestaña Actions se ve claramente qué tipo de prueba pasó, falló o se omitió.

> **Importante:** el equipo trabaja con el backend en local, así que GitHub Actions **no tiene acceso a una API**. Las etapas que dependen del backend (integración, rendimiento, esfuerzo y aceptación) aparecen como **omitidas** en CI y se corren en local. Ver la [sección 5](#5-pruebas-con-backend-se-corren-en-local).

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
| 03 | **Pruebas de integración** (#45, #46) | `release.yml` | Después de la regresión, si hay backend de pruebas | `pnpm test:integration`, `pnpm test:api` |
| 05 | **Pruebas de rendimiento** (#55) | `release.yml` | Después de la regresión, si hay backend de pruebas | `pnpm test:carga` |
| 07 | **Pruebas de aceptación** (#57) | `release.yml` | Después de la regresión, si hay backend de pruebas | `pnpm test:e2e` |
| 06 | **Pruebas de esfuerzo** (#56) | `manual.yml` | **Solo a mano** (se elige el número máximo de usuarios) | `pnpm test:estres` |

```
ci.yml        01 Análisis estático ─┐
(cada PR)     08 Seguridad ─────────┴─> 02 Unitarias ─> Build de Android

release.yml   04 Regresión (ci.yml completo) ─┬─> 03 Integración*
(release/*,                                   ├─> 05 Rendimiento*
 lunes, manual)                               └─> 07 Aceptación* ─> Build UAT

manual.yml    06 Esfuerzo*

* solo si existe el secreto API_URL_STAGING; si no, aparece como omitida
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

`pnpm test:carga` ejecuta `tests/performance/carga.js` con **k6**, simulando **20 usuarios** simultáneos durante 2 minutos que recorren HU-01: destacadas de Inicio, catálogo, categorías, filtros combinados y búsqueda. Criterios de aceptación (umbrales):

- El 95 % de las respuestas debe tardar menos de **1.5 s**.
- Menos del **1 %** de las peticiones puede fallar.

Si no se cumplen, la etapa falla. El resumen se guarda en `reporte-rendimiento`.

### 06) Pruebas de esfuerzo — `manual.yml`

`pnpm test:estres` ejecuta `tests/performance/estres.js` con **k6** sobre catálogo (HU-01), inicio de sesión (HU-06) y pedidos (HU-10). Sube la carga por etapas de 30 s (25 % → 50 % → 100 %) hasta el máximo de usuarios virtuales elegido al lanzarlo (**50 por defecto**, como indica el issue #56), lo mantiene **2 minutos** y luego baja. Un usuario virtual es un programa que repite las peticiones como lo haría una persona; no son usuarios reales. Umbrales más flexibles, porque se busca el punto de quiebre:

- p95 < **4 s**;
- errores < **10 %**.

Se lanza desde **Actions → Pruebas manuales → Run workflow**.

### 07) Pruebas de aceptación — `release.yml`

Apoya al issue #57: la aceptación final la da el cliente revisando la app en Expo Go. Esta etapa comprueba antes esos mismos flujos de forma automática y genera el APK que se le entrega.

Tiene dos trabajos en secuencia:

1. **E2E con Maestro:** genera el proyecto Android (`expo prebuild`), compila el APK con la URL del backend de pruebas, levanta un emulador Android (API 34) y ejecuta `pnpm test:e2e` con los flujos de `tests/e2e/`:
   - `01-visitante-explora-catalogo.yaml`: un visitante abre la app (empieza en Inicio, sin cuenta), entra al catálogo y abre el detalle de una obra (HU-01, HU-02).
   - `02-registro-validaciones.yaml`: el registro rechaza un correo inválido (HU-06).
   - `03-carrito-requiere-sesion.yaml`: agregar al carrito pide iniciar sesión (HU-08).
   - `04-catalogo-filtros.yaml`: los filtros de categoría y precio se combinan, se limpian, muestran el mensaje de "sin resultados" y no aceptan un mínimo mayor que el máximo (HU-01).
   - `05-visitante-lee-blog.yaml`: un visitante abre el blog y una publicación (HU-05).
   - `06-visitante-ve-perfil-artista.yaml`: un visitante abre el perfil de un artista (HU-03).
   - `07-visitante-explora-colecciones.yaml`: un visitante recorre las colecciones (HU-04).
   - `08-favoritos-requiere-sesion.yaml`: guardar un favorito pide iniciar sesión (HU-07).
2. **Build para el cliente (UAT):** si los flujos pasan, EAS genera un APK de prueba (perfil `preview` en `eas.json`) que se comparte con el cliente para que valide la versión en su teléfono.

> Los flujos buscan los elementos por su `testID` (`obra-card-0`, `detalle-agregar-carrito`, `registro-correo`). Si se cambia o se quita un `testID` en un componente, hay que actualizar el flujo.

## 4. Secretos y configuración del repositorio

Los secretos se configuran en **GitHub → Settings → Secrets and variables → Actions** (lo hace quien administra el repositorio):

| Secreto | Para qué | Etapas | ¿Se crea? |
| --- | --- | --- | --- |
| `EXPO_TOKEN` | Token de la cuenta de Expo, para EAS Build | 07 (Build UAT) | Sí |
| `API_URL_STAGING` | URL de un backend de pruebas | 03, 05, 06 y 07 | **No** (no hay backend de pruebas) |
| `WEB_URL_STAGING` | URL de la web de pruebas, para el botón de pago del APK | 07 | No |
| `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` | Cuenta de cliente de prueba | 03 | No |

Sin `API_URL_STAGING`, el trabajo **"¿Hay backend de pruebas?"** deja un aviso y las etapas 03, 05, 06 y 07 aparecen como **omitidas** (en gris). No aparecen en verde, para que no parezca que pasaron.

Para EAS también hay que ejecutar una sola vez `eas init` en el proyecto, que agrega el `projectId` en `app.json`.

**Reglas de la rama** (Settings → Branches): `develop` y `main` deben exigir que pasen estos checks antes de fusionar un PR: `01 · Análisis estático`, `08 · Seguridad`, `02 · Pruebas unitarias` y `Build de Android`.

## 5. Pruebas con backend: se corren en local

Acordamos trabajar con el backend en local, así que GitHub Actions no tiene acceso a una API. Por eso las etapas **03, 05, 06 y 07 se corren en local, contra el backend de cada quien** (normalmente en `http://localhost:4000`), y la evidencia (captura o salida de la terminal) se guarda en el issue correspondiente.

> Nunca usar la URL del backend de Render para estas pruebas, porque comparte la base de datos con la web en producción.

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
pnpm test:api --env-var "email=cliente@nubprueba.com" --env-var "password=Prueba2026!"   # con sesión
pnpm test:e2e             # 07 Maestro, con un emulador o teléfono conectado
```

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

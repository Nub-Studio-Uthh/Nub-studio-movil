# Pipelines de pruebas — Nub-studio-movil

Cada tipo de prueba definido en la planeación (issues con la etiqueta `testing` del tablero Scrumban) tiene su propio pipeline (workflow) de GitHub Actions en `.github/workflows/`. Se separaron así para que en cada Pull Request se vea claramente qué tipo de prueba pasó o falló, y para que las pruebas pesadas (E2E, carga y estrés) no se ejecuten en cada cambio.

> **Importante:** el equipo trabaja con el backend en local, así que GitHub Actions **no tiene acceso a una API**. Las pruebas que dependen del backend (Jest de integración, Postman/Newman y k6) se omiten solas en CI y se corren en local. Ver la [sección 4](#4-pruebas-de-api-se-corren-en-local).

## 1. ¿Cuándo corre cada pipeline?

Se sigue el flujo **Git Flow** del proyecto (`feature/*` → `develop` → `release/*` → `main`):

| # | Pipeline | Archivo | Se ejecuta cuando… | Duración aprox. |
| --- | --- | --- | --- | --- |
| — | CI (build) | `ci.yml` | Se abre un PR a `develop` o `main` | 3 min |
| 1 | **Análisis estático** (#54) | `01-analisis-estatico.yml` | Se abre un PR a `develop` o `main` | 2 min |
| 2 | **Pruebas unitarias** (#43, #44) | `02-pruebas-unitarias.yml` | Se abre un PR a `develop` o `main` | 1 min |
| 3 | **Pruebas de integración** (#45, #46) | `03-pruebas-integracion.yml` | Se hace merge a `develop`, se abre un PR a `main` o se lanza manualmente | 2 min |
| 4 | **Pruebas de regresión** (#58) | `04-pruebas-regresion.yml` | Todas las noches (01:00, hora de Huejutla) sobre `develop`, al subir una rama `release/*`, en un PR a `main` o manualmente | 5 min |
| 5 | **Pruebas de rendimiento** (#55) | `05-pruebas-rendimiento.yml` | Al subir una rama `release/*` o manualmente | 3 min |
| 6 | **Pruebas de esfuerzo** (#56) | `06-pruebas-esfuerzo.yml` | **Solo manualmente** (se elige el número máximo de usuarios) | 6 min |
| 7 | **Pruebas de aceptación** (#57) | `07-pruebas-aceptacion.yml` | Al subir una rama `release/*` o manualmente | 30–40 min |

```
feature/*  ──PR──►  develop  ──────────►  release/*  ──PR──►  main
   │                  │                      │                 │
   ├ 1 Estático       ├ 3 Integración        ├ 4 Regresión     ├ 3 Integración
   ├ 2 Unitarias      └ 4 Regresión          ├ 5 Rendimiento   └ 4 Regresión
   └ CI build           (cada noche)         └ 7 Aceptación
                                                (E2E + APK para el cliente)
   6 Esfuerzo → manual, antes de liberar una versión
```

## 2. Detalle de cada pipeline

### 1) Análisis de código estático — `01-analisis-estatico.yml`

Tiene tres trabajos (*jobs*) que corren en paralelo:

- **ESLint y Prettier:** `pnpm lint` y `pnpm format:check`. Falla si hay errores de código o si hay archivos sin formato.
- **Auditoría de dependencias:** `pnpm audit --prod --audit-level high`. Falla si alguna dependencia de producción tiene una vulnerabilidad alta o crítica.
- **Búsqueda de secretos:** TruffleHog revisa todo el historial y falla si encuentra contraseñas o tokens verificados.

### 2) Pruebas unitarias — `02-pruebas-unitarias.yml`

Ejecuta `pnpm test:unit --ci --coverage` con Jest y guarda el reporte de cobertura como artefacto por 14 días. El pipeline falla si la cobertura de `src/utils` baja del mínimo configurado en `package.json`: 80 % de líneas, funciones y sentencias, y 70 % de ramas.

Pruebas incluidas: `tests/unit/` (formato de precios y total del carrito para HU-08; validación del registro para HU-06).

### 3) Pruebas de integración — `03-pruebas-integracion.yml`

1. `pnpm test:integration` prueba contra la API del backend que:
   - las rutas públicas (`/api/obras`, `/api/categorias`, `/api/artistas`, `/api/colecciones`, `/api/blog/posts`) respondan 200;
   - el login rechace credenciales inválidas;
   - `/api/carrito` exija sesión (401/403).
2. **Newman** ejecuta la colección `tests/api/nub-studio.postman_collection.json`, que también revisa que el catálogo responda en menos de 3 s, y guarda un reporte JUnit.

Como `API_URL_STAGING` no se configura, **estos pasos se omiten solos en CI** (se muestra un aviso en lugar de fallar) y se corren en local.

### 4) Pruebas de regresión — `04-pruebas-regresion.yml`

Complementa el recorrido manual en Expo Go del issue #58.

Vuelve a correr la suite completa: lint, pruebas unitarias con cobertura (`pnpm test:unit --ci --coverage`), pruebas de integración (`pnpm test:integration --ci`), la colección de Postman y el build de Android (`expo export`). La ejecución nocturna sobre `develop` detecta si algo que ya funcionaba se rompió al juntar el trabajo de los tres integrantes.

Los pasos de integración y Postman se omiten solos si no existe `API_URL_STAGING`; el resto (lint, unitarias y build) sí corre en CI.

### 5) Pruebas de rendimiento — `05-pruebas-rendimiento.yml`

Cubre la parte del API del issue #55. La parte de la app (arranque en frío y fluidez de listas) se mide manualmente con Perf Monitor y Android Studio Profiler.

Ejecuta `tests/performance/carga.js` con **k6**, simulando **20 usuarios** simultáneos navegando el catálogo durante 2 minutos. Criterios de aceptación (umbrales):

- El 95 % de las respuestas debe tardar menos de **1.5 s**.
- Menos del **1 %** de las peticiones puede fallar.

Si no se cumplen, la prueba falla. El resumen se guarda como artefacto.

En CI los pasos de k6 se omiten solos si no existe `API_URL_STAGING`, así que esta prueba se corre en local.

### 6) Pruebas de esfuerzo — `06-pruebas-esfuerzo.yml`

Ejecuta `tests/performance/estres.js` con **k6** sobre catálogo (HU-01), inicio de sesión (HU-06) y pedidos (HU-10). Sube la carga por etapas de 30 s (25 % → 50 % → 100 %) hasta el máximo de usuarios virtuales elegido al lanzarlo (**50 por defecto**, como indica el issue #56), lo mantiene **2 minutos** y luego baja. Un usuario virtual es un programa que repite las peticiones como lo haría una persona; no son usuarios reales. Umbrales más flexibles, porque se busca el punto de quiebre:

- p95 < **4 s**;
- errores < **10 %**.

Solo se lanza manualmente (**Actions → Pruebas de esfuerzo → Run workflow**). En CI los pasos de k6 se omiten solos si no existe `API_URL_STAGING`, así que en la práctica se corre en local.

### 7) Pruebas de aceptación — `07-pruebas-aceptacion.yml`

Apoya al issue #57: la aceptación final la da el cliente revisando la app en Expo Go. Este pipeline comprueba antes esos mismos flujos de forma automática y genera el APK que se le entrega.

Tiene dos trabajos en secuencia:

1. **E2E con Maestro:** genera el proyecto Android (`expo prebuild`), compila el APK, levanta un emulador Android (API 34) y ejecuta los flujos de `tests/e2e/`:
   - `01-visitante-explora-catalogo.yaml`: un visitante entra sin cuenta y abre una obra (HU-01, HU-02).
   - `02-registro-validaciones.yaml`: el registro rechaza un correo inválido (HU-06).
   - `03-carrito-requiere-sesion.yaml`: agregar al carrito pide iniciar sesión (HU-08).
2. **Build para el cliente (UAT):** si los flujos pasan, EAS genera un APK de prueba (perfil `preview` en `eas.json`) que se comparte con el cliente para que valide la versión en su teléfono.

> Los flujos usan textos y `testID` de los diseños de Figma (`obra-card-0`, `input-correo`). Al programar cada pantalla hay que poner esos mismos `testID` en los componentes.

## 3. Secretos que hay que configurar

Solo se configura **un** secreto en **GitHub → Settings → Secrets and variables → Actions** (lo hace quien administra el repositorio):

| Secreto | Para qué | Pipelines que lo usan |
| --- | --- | --- |
| `EXPO_TOKEN` | Token de la cuenta de Expo, para EAS Build | 7 |

Los secretos `API_URL_STAGING`, `TEST_USER_EMAIL` y `TEST_USER_PASSWORD` **no se crean**. Los pasos que dependen de ellos (pipelines 3, 4, 5 y 6) se omiten solos gracias a un `if`, así que no fallan en CI.

Para EAS también hay que ejecutar una sola vez `eas init` en el proyecto, que agrega el `projectId` en `app.json`.

## 4. Pruebas de API: se corren en local

Acordamos trabajar con el backend en local, por lo que GitHub Actions no tiene acceso a una API. Por eso:

- Las pruebas de **Postman/Newman** y **k6** (pipelines 5 y 6, y los pasos de API de los pipelines 3 y 4) se corren **en local, contra el backend de cada quien**.
- En CI esos pasos se omiten solos (con un aviso) cuando no existe `API_URL_STAGING`, para que no fallen.

Comando de ejemplo para Newman:

```bash
npx newman run tests/api/nub-studio.postman_collection.json --env-var "baseUrl=http://localhost:PUERTO"
```

Comando de ejemplo para k6:

```bash
k6 run -e API_URL=http://localhost:PUERTO tests/performance/carga.js
```

> nunca usar la URL del backend de Render para estas pruebas, porque comparte la base de datos con la web en producción.

## 5. Cómo correr las pruebas localmente

```bash
pnpm install
pnpm lint                 # análisis estático
pnpm test:unit            # unitarias
API_URL=http://localhost:PUERTO pnpm test:integration   # integración
npx newman run tests/api/nub-studio.postman_collection.json --env-var "baseUrl=http://localhost:PUERTO"
k6 run -e API_URL=http://localhost:PUERTO tests/performance/carga.js
maestro test tests/e2e    # con un emulador o teléfono conectado
```

> En PowerShell, para la integración usa: `$env:API_URL="http://localhost:PUERTO"; pnpm test:integration`
# Liberación y despliegue continuo — NUB Studio (app móvil)

Este documento explica cómo una versión de la app pasa del repositorio a Google Play: qué
herramientas se usan, qué hace cada archivo y secreto de configuración, cómo se relacionan los
entornos con los perfiles de EAS y las pistas de Play, y el paso a paso que se siguió en la
1.1.0. Issue #156.

Las pruebas de cada etapa del pipeline se explican en [pruebas/pipelines.md](./pruebas/pipelines.md);
las ramas y el versionado, en [branching-strategy.md](./branching-strategy.md).

---

## 1. Flujo de una versión

```
 feature/* · fix/* · docs/*
          │  PR + ci.yml (01 · 08 · 02 · Build) + 1 aprobación
          ▼
       develop ──────────────────────────────────────────────┐
          │  se crea release/x.y.z                            │
          ▼                                                   │
   release/x.y.z  (version en app.json y package.json,        │
          │        notas en CHANGELOG.md)                     │
          │  push ─> release.yml                              │
          │          04 Regresión ─┬─> 03 Integración         │
          │                        ├─> 05 Rendimiento         │
          │                        └─> 07 Aceptación (E2E)    │
          │                                 └─> 07 Build UAT ─┼─> EAS Build, perfil preview
          │                                                   │   APK en expo.dev (prueba manual)
          │  PR release/x.y.z ─> main  (ci.yml + 1 aprobación)│
          ▼                                                   │
         main ── tag vX.Y.Z                                   │
          │                                                   │
          │  eas build --profile production   (a mano; #155   │
          │  AAB firmado, versionCode + 1      lo automatiza) │
          ▼                                                   │
   Google Play Console                                        │
     Prueba cerrada (alpha) ─> revisión de Google ─> testers  │
     Producción (cuando se otorgue el acceso)                 │
                                                              │
   PR release/x.y.z ─> develop  (cierra el release) ◀─────────┘
```

| Paso | Dónde | Automático | Resultado |
| --- | --- | --- | --- |
| Integrar cambios a `develop` | GitHub (PR) | `ci.yml` | Código revisado y probado |
| Crear `release/x.y.z` | Git | No | Versión congelada para probar |
| Pipeline de release | GitHub Actions (`release.yml`) | Sí, al subir la rama | Pruebas 04, 03, 05 y 07 en verde |
| Build UAT | EAS Build, perfil `preview` | Sí, job 07 del pipeline | APK en expo.dev para la prueba manual |
| Integrar a `main` y etiquetar | GitHub (PR) y Git | No | `main` = versión publicada; tag `vX.Y.Z` |
| Build de producción | EAS Build, perfil `production` | **No** (pendiente, #155) | AAB firmado con `versionCode` nuevo |
| Envío a Play | Play Console | **No** (pendiente, #155) | Versión en la pista de prueba cerrada |
| Regresar el release a `develop` | GitHub (PR) | No | `develop` con la versión y el CHANGELOG |

---

## 2. Herramientas y por qué se eligieron

| Herramienta | Para qué se usa | Por qué |
| --- | --- | --- |
| **EAS Build** (Expo Application Services) | Compilar el APK de prueba y el AAB de Play en la nube | Es la herramienta oficial de Expo SDK 57, el SDK de la app. Compila sin Android Studio ni Gradle local, siempre en una máquina limpia, y guarda la llave de firma (keystore) en Expo, así no vive en ninguna laptop ni en el repositorio. |
| **EAS Submit** | Enviar el AAB a Google Play | Planeado en #155. Hoy el AAB se sube a mano en Play Console. |
| **GitHub Actions** | Correr las pruebas y lanzar el build UAT | El repositorio ya vive en GitHub, las reglas de rama exigen sus checks y no requiere otro servicio. |
| **Google Play Console** | Distribuir la app a testers y, después, a producción | Es la tienda objetivo del proyecto. Con **Play App Signing**, Google vuelve a firmar el AAB con su propia llave; la llave de EAS solo sirve como llave de subida. |

Alternativas descartadas: compilar con Gradle en la laptop (depende de cada máquina y expone la
llave de firma), y servicios como Codemagic o Bitrise (otra cuenta y otra configuración para lo
mismo que EAS ya hace con Expo).

---

## 3. Elementos de configuración

### 3.1 Archivos del repositorio

| Elemento | Qué define | Relación con la liberación |
| --- | --- | --- |
| `eas.json` → `cli.appVersionSource: "remote"` | El `versionCode` de Android lo guarda EAS, no el repositorio | No hay que editar el `versionCode` a mano ni puede chocar entre ramas. |
| `eas.json` → perfil `preview` | Entorno `preview`, `distribution: internal`, `buildType: apk` | APK que se instala desde el enlace de expo.dev. Lo usa el build UAT. **No sube el `versionCode`**. |
| `eas.json` → perfil `production` | Entorno `production`, `autoIncrement: true`, salida AAB | Archivo que se sube a Play. Cada build suma 1 al `versionCode` (la 1.0.0 fue el 3 y la 1.1.0 el 4). |
| `eas.json` → `submit.production` | — | Aún no existe; lo agrega #155 con la pista de Play. |
| `app.json` → `expo.version` | `versionName` que ven los usuarios (por ejemplo 1.1.0) | Se cambia en cada `release/x.y.z`, siguiendo SemVer. |
| `app.json` → `android.package` | `com.nubstudio.movil` | Identifica la app en Play. **No se puede cambiar** después de publicada. |
| `app.json` → `android.blockedPermissions` | Permisos que se quitan del manifiesto | Play revisa los permisos; solo quedan internet y estado de red. |
| `app.json` → plugin `expo-build-properties` | R8 y reducción de recursos en Release (#140) | El AAB sale reducido y ofuscado. |
| `app.json` → plugin `./plugins/withCertificatePinning` | Pines de las autoridades del backend (#159, a partir de la 1.2.0) | Antes de cada release hay que revisar que la raíz de Render siga en la lista ([seguridad.md](./seguridad.md), sección 7). |
| `app.json` → `owner` y `extra.eas.projectId` | Organización `nub-studio-uthh` y proyecto de EAS | Une el repositorio con el proyecto `nub-studio` en expo.dev. |
| `app.config.js` | Permite HTTP solo si `PERMITIR_HTTP=true` | Solo para el APK de las pruebas E2E. Los builds de EAS no lo activan. |
| `package.json` → `version` | Igual que `expo.version` | Se actualiza junto con `app.json`. |
| `CHANGELOG.md` | Notas de cada versión | Base de las notas de la versión en Play Console. |
| `.github/workflows/ci.yml` | Checks de cada PR | `develop` y `main` exigen 01, 08, 02 y Build de Android. |
| `.github/workflows/release.yml` | Pipeline de release y job UAT | Corre al subir `release/**`, cada lunes sobre `develop` y a mano. |

### 3.2 Secretos y variables

| Elemento | Dónde vive | Para qué |
| --- | --- | --- |
| `EXPO_TOKEN` | GitHub → Settings → Secrets and variables → Actions | Token del robot `github-actions` (rol **Developer**) de la organización `nub-studio-uthh` en Expo. El job UAT lo usa para lanzar `eas build`. En los logs sale como `***`. Configurado en #154. |
| `EXPO_PUBLIC_API_URL` | EAS → Environment variables, entornos `preview` y `production` | URL del backend en Render que queda dentro de la app. Es pública: nunca lleva secretos. |
| Llave de firma (keystore) | EAS → Credentials (`Build Credentials ... (default)`) | Firma el AAB y el APK. No está en el repositorio ni en ninguna laptop. |
| Cuenta de servicio de Google Play (JSON) | — | Pendiente (#155). Se guardará en EAS, nunca en el repositorio. |

`EXPO_PUBLIC_WEB_URL` aparece en `.env.example` para desarrollo local, pero no está en EAS: la
define `src/constants/links.js` y ninguna pantalla la usa todavía.

### 3.3 Ramas, tags y versionado

- **Ramas:** Git Flow. Cada versión sale de una rama `release/x.y.z` que se integra a `main` y
  regresa a `develop`. Se mergea siempre con *merge commit* y las ramas no se borran.
- **Reglas de rama:** `develop` y `main` exigen los 4 checks de `ci.yml`, la rama al día y
  1 aprobación.
- **Tags:** uno anotado por versión publicada, `vX.Y.Z`, sobre el merge del release en `main`.
- **Versionado:** SemVer para el `versionName` (`app.json`); el `versionCode` lo sube EAS.

| Versión | `versionCode` | Tag | Pista de Play |
| --- | --- | --- | --- |
| 1.0.0 | 3 | `v1.0.0` | Prueba cerrada (alpha) |
| 1.1.0 | 4 | `v1.1.0` | Prueba cerrada (alpha) |

---

## 4. Entornos, perfiles y pistas de Play

| Entorno | Cómo se ejecuta | Backend | Perfil de EAS | Pista de Play | Quién lo usa |
| --- | --- | --- | --- | --- | --- |
| **Desarrollo** | `pnpm start` con Expo Go o build de desarrollo | Local (`.env`) | — | — | El equipo |
| **Pruebas automáticas** | GitHub Actions, entorno temporal | PostgreSQL y backend temporales | — (APK local con `PERMITIR_HTTP=true`) | — | Pipelines 03, 05, 06 y 07 |
| **Staging / UAT** | APK desde el enlace de expo.dev | Render | `preview` | — | Prueba manual del equipo y del cliente antes de publicar |
| **Pre-producción** | App instalada desde Play | Render | `production` | **Prueba cerrada (alpha)** | 12+ testers inscritos |
| **Producción** | App instalada desde Play | Render | `production` | **Producción** | Público (cuando Google otorgue el acceso) |

- El mismo AAB que pasa la prueba cerrada se **promueve** a producción; no se compila otra vez.
- **Staging y producción comparten el backend de Render.** No hay un backend de staging aparte,
  así que en la prueba del APK no se deben hacer pagos reales ni borrar datos de otras cuentas.
- No se usan actualizaciones OTA (EAS Update): todo cambio de la app pasa por un build nuevo y
  por la revisión de Google.

---

## 5. Paso a paso de una versión

Así se liberó la 1.1.0 (noviembre de 2026).

1. **Crear la rama de release** desde `develop`: `release/x.y.z`.
2. **Preparar la versión** en un commit `chore: preparar la versión x.y.z`: `version` en
   `app.json` y `package.json`, y una sección nueva en `CHANGELOG.md`.
3. **Subir la rama.** `release.yml` corre solo; al final, el job UAT manda el build `preview` a
   EAS (`--no-wait`). La fila gratuita de EAS tarda de segundos a unos 45 minutos y compilar,
   unos 15 a 20.
4. **Abrir el PR `release/x.y.z` → `main`** con Mishel o Soraida de revisoras. La primera vez
   que se abre, GitHub pide "Update branch" para traer el merge del release anterior.
5. **Prueba manual del APK** (desde expo.dev): inicio, catálogo y detalle, registro, login de
   cliente, favoritos, carrito, datos personales, login de artista rechazado y finalizar compra
   hasta Mercado Pago, **sin pagar**. Si el teléfono tiene la versión de Play, hay que
   desinstalarla antes (otra firma); la inscripción como tester no se pierde.
6. **Merge a `main`** y **tag** sobre ese merge:
   ```bash
   git checkout main && git pull
   git tag -a vX.Y.Z -m "Versión X.Y.Z"
   git push origin vX.Y.Z
   ```
7. **Build de producción** desde `main`:
   ```bash
   npx eas-cli build --platform android --profile production
   ```
   El resultado debe decir `Version X.Y.Z (N)`, con `N` uno más que la versión anterior.
8. **Subir a Play Console**: NUB Studio → Probar y lanzar → Pruebas → Prueba cerrada → alpha →
   Crear versión nueva. Subir el `.aab`, **no incluir** la versión anterior, pegar las notas entre
   `<es-419>` y `</es-419>`, Guardar y luego **Enviar cambios a revisión** en "Descripción general
   de la publicación". La revisión de Google suele tardar unas horas.
9. **Cerrar el release**: PR `release/x.y.z` → `develop`.

---

## 6. Pendiente: despliegue continuo completo (#155)

Hoy el build de producción y la subida a Play son manuales (pasos 7 y 8). #155 los automatiza:

1. Una cuenta de servicio de Google Cloud con permiso de publicación en Play Console; su llave
   JSON se guarda en EAS.
2. El perfil `submit.production` en `eas.json` con la pista de Play.
3. Un job de producción en `release.yml` que, al integrar a `main`, corra
   `eas build --platform android --profile production --auto-submit`.

Cuando #155 esté listo, el diagrama de la sección 1 pasa de "a mano" a automático y este
documento se actualiza.

---

## 7. Problemas comunes

| Problema | Causa | Qué hacer |
| --- | --- | --- |
| La etapa 01 falla en todos los PR con `Patch version mismatches` | Expo publicó un parche nuevo y `expo-doctor` lo exige | Actualizar con `pnpm add expo@~X.Y.Z` en una rama `chore/`, esperando al menos 1 día desde su publicación (`minimumReleaseAge` de pnpm). Si después marca `duplicate dependencies`, correr `pnpm dedupe`. |
| El job UAT dice "Falta el secreto EXPO_TOKEN" | El secreto no existe o se borró | Crear un token para el robot `github-actions` en expo.dev y guardarlo como `EXPO_TOKEN`. El token nunca se pega en chats, issues ni commits; si se expone, se revoca y se crea otro. |
| "App no instalada" o "conflicto con un paquete existente" al instalar el APK | El teléfono tiene la versión de Play, firmada con la llave de Google | Desinstalar la versión de Play, instalar el APK y, al terminar, reinstalar desde Play. |
| Play rechaza el AAB por el `versionCode` | Se subió un número que ya existe | Volver a compilar con el perfil `production`; `autoIncrement` asigna uno nuevo. |
| La app no se conecta al backend después de una actualización | Render cambió a una autoridad que no está en los pines (a partir de la 1.2.0) | Revisar la cadena del certificado antes de cada release ([seguridad.md](./seguridad.md), sección 7). |
| El pipeline de cada lunes genera un build en EAS | `release.yml` corre cada lunes sobre `develop` y el job UAT ya tiene `EXPO_TOKEN` | Es esperado. Cada build gasta del plan gratuito de EAS; si el plan se agota, el job UAT puede fallar, pero las demás etapas no se ven afectadas. |

---

## 8. Referencias

1. Expo. (2026). _EAS Build_. Expo Documentation. https://docs.expo.dev/build/introduction/
2. Expo. (2026). _App version management_ (`appVersionSource` y `autoIncrement`). Expo
   Documentation. https://docs.expo.dev/build-reference/app-versions/
3. Expo. (2026). _Submit to the Google Play Store_ (EAS Submit, base de #155). Expo
   Documentation. https://docs.expo.dev/submit/android/
4. Google. (2026). _Set up an open, closed, or internal test_. Ayuda de Play Console.
   https://support.google.com/googleplay/android-developer/answer/9845334
5. Google. (2026). _Use Play App Signing_. Ayuda de Play Console.
   https://support.google.com/googleplay/android-developer/answer/9842756
6. GitHub. (2026). _Using secrets in GitHub Actions_. GitHub Docs.
   https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
7. Preston-Werner, T. (s. f.). _Versionado Semántico 2.0.0_. https://semver.org/lang/es/

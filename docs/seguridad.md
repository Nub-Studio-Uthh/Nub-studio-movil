# Seguridad — Nub-studio-movil

Herramientas de seguridad del proyecto: qué revisa cada una, dónde corre y cómo usarla en local. Como referencia general se usa el estándar **OWASP MASVS** (requisitos de seguridad para apps móviles): https://mas.owasp.org/MASVS/

---

## 1. Resumen

En CI, las herramientas corren en las etapas **01 · Análisis estático** y **08 · Seguridad** de `ci.yml`, en cada Pull Request y también en la regresión de `release.yml` (ver `docs/pruebas/pipelines.md`).

| Herramienta | Qué revisa | Dónde corre |
|---|---|---|
| ESLint + Prettier | Errores comunes y formato | CI (etapa 01, `pnpm test:estatico`) y local |
| `pnpm audit` | Dependencias con vulnerabilidades conocidas | CI (etapa 08, `pnpm test:seguridad`) y local |
| TruffleHog | Secretos **verificados** (llaves que siguen activas) en los commits del PR | CI (etapa 08) |
| gitleaks | Secretos en el commit (local) y en todo el historial (CI), incluidos los que no se pueden verificar | Hook `pre-commit` y CI (etapa 08) |
| Semgrep | Patrones de código inseguro en JavaScript/React (SAST) | CI (etapa 08) y local |
| Dependabot | Alertas y PR de actualizaciones de seguridad | GitHub |
| MobSF | La app **compilada** (APK): permisos, tráfico HTTP, llaves dentro del código | Local, antes de cada release |
| R8 | Reduce y ofusca el código Java/Kotlin de la compilación Release | Cada build Release (EAS y local) |
| Certificate Pinning | Que la app solo acepte certificados de las autoridades esperadas para el backend | En la app instalada (APK/AAB) |

---

## 2. Hook de gitleaks (cada integrante, una sola vez)

Revisa los cambios de cada commit antes de que salgan de tu computadora.

```bash
sudo pacman -S gitleaks                 # Arch/CachyOS; en otros sistemas: https://github.com/gitleaks/gitleaks#installing
git config core.hooksPath .githooks     # dentro del repositorio
```

Si no tienes gitleaks instalado, el hook solo muestra un aviso y deja hacer el commit. Si encuentra algo, el commit se detiene: quita el secreto. Si crees que es un falso positivo, coméntalo con el equipo antes de usar `git commit --no-verify`.

Revisar todo el historial a mano: `gitleaks git --redact --verbose`

---

## 3. Semgrep en local

```bash
pipx install semgrep        # o: uv tool install semgrep
semgrep scan --config p/javascript --config p/react --exclude docs --metrics off
```

---

## 4. Dependencias

```bash
pnpm test:seguridad          # = pnpm audit --prod --audit-level high
```

Las versiones de Expo y React Native van atadas al SDK. Para corregir versiones usa `pnpm expo install --fix`, no actualices a mano.

### Avisos ignorados

Cuando una vulnerabilidad no tiene corrección compatible con el SDK, se ignora en `auditConfig.ignoreGhsas` de `pnpm-workspace.yaml` y se explica aquí. Hay que revisar esta lista en cada actualización del SDK y quitar los avisos que ya tengan corrección.

| Aviso | Paquete | Por qué se ignora | Desde |
| --- | --- | --- | --- |
| [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | `zod` 3.25.76 (alta: consumo de memoria con colecciones muy grandes) | Solo lo usa `@expo/cli`, la herramienta que compila en local y en CI; no va dentro del APK y la app no lo usa. La corrección solo existe en `zod` 4.6.6, y hasta la última versión de `@expo/cli` pide `zod` 3. Se quita cuando Expo actualice. | 23/10/2026 (#90) |
| GHSA-vfj7-8cjw-p6xm, GHSA-86w9-cpqp-85rv | — | Agregados antes de esta tabla (commit `2d55066`). | — |

### Versiones forzadas (`overrides`)

Cuando la corrección existe pero una dependencia interna todavía pide la versión vulnerable, se fuerza la versión corregida en `overrides` de `pnpm-workspace.yaml`:

| Paquete | Versión forzada | Motivo | Desde |
| --- | --- | --- | --- |
| `shell-quote` | `>=1.11.0` | Aviso de seguridad en versiones anteriores. | — |
| `source-map-js` | `>=1.2.2` | Aviso de seguridad en versiones anteriores. | — |
| `node-forge` | `>=1.4.1` (queda en 1.4.2) | Siete avisos altos publicados en octubre de 2026 (GHSA-7wch-p9px-956x, GHSA-jc66-7q78-782g, GHSA-8hrf-8g6f-7xwp, GHSA-hqq3-7jhf-c5jx, GHSA-5x38-2vff-x55p, entre otros). Lo usa `@expo/cli` (firma de código y certificados); 1.4.1 es la primera versión corregida. | 31/10/2026 |

**Dependabot** está configurado para abrir **solo PR de seguridad** hacia `develop`. Hay que activarlo en GitHub: *Settings → Code security* → "Dependabot alerts" y "Dependabot security updates".

---

## 5. MobSF sobre el APK (antes de cada release)

Analiza el APK de `preview` o `production` generado con EAS.

```bash
sudo pacman -S docker && sudo systemctl start docker
docker run -it --rm -p 8000:8000 opensecurity/mobile-security-framework-mobsf:latest
```

Abre http://localhost:8000, sube el APK y revisa el reporte.

**Hallazgo esperado:** en el APK de `preview` aparece el tráfico HTTP sin cifrar permitido. Es intencional, para conectarse al backend local por Wi-Fi. En el build de `production` **no** debe aparecer.

---

## 6. Ofuscación y reducción con R8 (#140)

La compilación Release pasa por **R8**: elimina las clases y los recursos que la app no usa, y cambia los nombres de clases, métodos y campos por nombres cortos sin significado. Así el APK pesa menos y es más difícil de entender si alguien lo descompila.

### Configuración

Se activa con `expo-build-properties` en `app.json`. Como `android/` se genera en cada build, no se edita `build.gradle` a mano:

```json
["expo-build-properties", {
  "android": {
    "enableMinifyInReleaseBuilds": true,
    "enableShrinkResourcesInReleaseBuilds": true
  }
}]
```

Al generar el proyecto, esto queda en `android/gradle.properties` y el `build.gradle` de Release lo usa en `minifyEnabled` y `shrinkResources`. El APK de las pruebas de aceptación (`PERMITIR_HTTP=true`) agrega su opción a este mismo bloque en `app.config.js`, así que también sale con R8.

### Resultado (APK Release local, 9/11/2026)

| | Sin R8 | Con R8 | Cambio |
|---|---|---|---|
| Código Java/Kotlin (`classes*.dex`) | 24.6 MB | 8.7 MB | −65 % |
| Clases | 20 184 | 11 430 | −43 % |
| Archivos en `res/` | 985 | 855 | −130 |
| Librerías nativas (`.so`) | 86.7 MB | 86.7 MB | Igual |
| JavaScript (bytecode de Hermes) | 4.6 MB | 4.6 MB | Igual |
| APK completo | 103.9 MB | 98.1 MB | −5.6 % |

El APK baja poco porque casi todo su peso son librerías nativas para cuatro arquitecturas. En Google Play eso se reduce solo: el AAB entrega a cada celular únicamente la de su procesador.

### Comprobación con JADX

Se abrió el mismo APK con y sin R8 en `jadx-gui`:

| | Sin R8 | Con R8 |
|---|---|---|
| Paquete | `androidx.documentfile.provider` | `N` |
| Clase | `DocumentFile` | `a` |
| Campo | `mParent` | `f4767a` |
| Métodos | `canRead()`, `canWrite()`, `createFile()`… | `a()`, `b()`, `c()`… |
| Clase sin uso `RawDocumentFile` | Existe | Eliminada |

Igual pasa con `expo.modules.filesystem.FileSystemModule`, que queda como `J4.n`. Paquetes completos como `com.google.gson` o `kotlinx.coroutines` ya no aparecen con su nombre.

### Lo que R8 no cubre

- **El JavaScript de la app** (pantallas, ViewModels, servicios) no lo procesa R8: viaja como bytecode de Hermes dentro de `index.android.bundle`. Por eso los secretos nunca van en el código ni en `EXPO_PUBLIC_*`.
- **Los textos** (mensajes, URLs) se conservan tal cual; R8 solo cambia nombres.
- React Native y Expo conservan algunos nombres a propósito, porque los buscan por reflexión.

### Archivo de mapeo

R8 genera `android/app/build/outputs/mapping/release/mapping.txt`, el diccionario entre los nombres originales y los ofuscados. Sirve para leer los errores que reporte Google Play. No se sube al repositorio; en los builds de EAS se descarga desde la página del build y se carga en Play Console junto con el AAB.

### Si algo falla solo en Release

Revisa el error con `adb logcat` y agrega una regla `-keep` para la clase afectada en `extraProguardRules` de `expo-build-properties`. Prueba siempre el APK Release en un celular antes de publicar.

---

## 7. Certificate Pinning (#159)

Protege la conexión con el backend contra ataques de intermediario (MitM). Sin pinning, la app confía en cualquier certificado válido para el dominio, firmado por cualquiera de las autoridades que trae Android, o por un certificado que alguien instaló en el celular para interceptar el tráfico. Con pinning, la app solo acepta la cadena si contiene una de las llaves públicas esperadas (huella SHA-256).

### Cómo está hecho

Con la configuración de seguridad de red de Android (`network_security_config.xml`), que genera el config plugin propio `plugins/withCertificatePinning.js`. No se usa una librería: Android aplica la configuración por debajo de OkHttp, el cliente HTTP de React Native, así que cubre todas las peticiones de la app. Es el mecanismo que recomienda Android y equivale a usar `CertificatePinner` de OkHttp.

Los pines, el dominio y la fecha de expiración están en `app.json`:

| Pin (SHA-256 de la llave pública) | Autoridad | Papel |
|---|---|---|
| `mEflZT5enoR1FuXLgYYGqnVEoZvmf9c2bVBpiOjYQ0c=` | GTS Root R4 (Google Trust Services) | Principal: la raíz que usa Render hoy |
| `hxqRlPTu1bMS/0DITB1SSu0vd4u/8l8TjPgfaAp63Gc=` | GTS Root R1 | Respaldo: Google con llaves RSA |
| `C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=` | ISRG Root X1 (Let's Encrypt) | Respaldo: si Render cambia de autoridad |
| `diGVwiVYbubAI3RW4hB9xU8e/CH2GnkuvVFZE8zmgzI=` | ISRG Root X2 (Let's Encrypt) | Respaldo: Let's Encrypt con llaves ECDSA |

Solo aplica a `nub-studio-back.onrender.com`. Las imágenes de Cloudinary y la web no se fijan.

### Por qué se fijan las raíces y no el certificado del servidor

El certificado de `onrender.com` lo renueva Render cada pocos meses (el actual vence el 20/12/2026). Si se fijara ese, la app dejaría de conectarse en cada renovación. Las raíces cambian muy poco, y con las dos autoridades que usa Render la app sigue funcionando aunque cambie de una a otra. Aun así, deja fuera a las demás autoridades y a cualquier certificado instalado por el usuario o por un atacante.

### Variantes

| Build | HTTP sin cifrar | Pinning hacia Render |
|---|---|---|
| Release (EAS, APK/AAB oficial) | Bloqueado | Activo |
| Debug (`expo run:android`) | Permitido, para Metro | Activo |
| APK de aceptación (`PERMITIR_HTTP=true`) | Permitido, para el backend local | Activo |
| Expo Go | Sin cambios | No aplica: Expo Go ignora esta configuración |

Con `network_security_config`, Android ignora `usesCleartextTraffic`; por eso `app.config.js` le pasa `permitirHttp` también al plugin de pinning.

### Prueba (APK Release local, Realme 7 con Android 10, 11/11/2026)

| Prueba | Resultado |
|---|---|
| Pines correctos | El catálogo carga desde Render (14 obras). `logcat`: `Using Network Security Config from resource network_security_config debugBuild: false` |
| Dos pines inventados | "No pudimos cargar las obras" con Reintentar. En ese momento Render respondía `HTTP 200` y el celular tenía internet: la conexión se rechazó por el pin |

### Cómo obtener o renovar las huellas

La huella de una autoridad se calcula desde su certificado (en CachyOS/Arch están en `/etc/ca-certificates/extracted/cadir/`):

```bash
openssl x509 -in GTS_Root_R4.pem -pubkey -noout \
  | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64
```

Para ver qué autoridad usa hoy el backend:

```bash
echo | openssl s_client -connect nub-studio-back.onrender.com:443 -servername nub-studio-back.onrender.com -showcerts 2>/dev/null | grep -E 's:|i:'
```

**Antes de cada release**, revisa que la raíz de la cadena siga siendo una de las fijadas. Si Render cambia a una autoridad que no está en la lista, agrega su huella **antes** de publicar: con pines que no coinciden, la app no se conecta.

### Expiración

Los pines vencen el **31/12/2027** (`expiracion` en `app.json`). Después de esa fecha Android deja de exigirlos y la app sigue conectándose con la validación normal. Es una salida de seguridad por si una versión vieja de la app se queda sin actualizar; hay que renovar la fecha en cada release.

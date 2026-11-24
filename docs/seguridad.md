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
| `blockedPermissions` | Quita del manifiesto los permisos de Android que la app no usa | Cada build (EAS y local) |
| JWT + sesiones en el servidor | Que solo la persona con sesión válida use su cuenta, y que la sesión se pueda cortar desde el servidor | App y backend |
| `expo-secure-store` | Guarda el token cifrado con una llave del Keystore de Android | En la app instalada |

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

**Dependabot** está configurado (`.github/dependabot.yml`) para abrir hacia `develop`:

- **Paquetes de npm/pnpm:** solo PR de seguridad. Expo y React Native se actualizan a mano con el SDK.
- **Acciones de GitHub Actions:** PR de versiones nuevas una vez al mes. Se revisan las notas de cada versión y se integran si las pruebas pasan. Se ignora `gradle/actions` 6 o mayor, porque desde la v6 su caché es un componente de código cerrado con sus propios Términos de Uso; el equipo se queda en la v5 (licencia MIT).

Hay que activarlo en GitHub: *Settings → Code security* → "Dependabot alerts" y "Dependabot security updates".

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

---

## 8. Permisos de Android

La app solo necesita internet: muestra el catálogo, el carrito y los pedidos que vienen
del backend. No usa cámara, ubicación, contactos, micrófono, archivos del celular,
biometría ni notificaciones.

### Permisos que quedan en el APK

| Permiso | Para qué | Nivel |
| --- | --- | --- |
| `INTERNET` | Hablar con el backend y descargar las imágenes de las obras | Normal |
| `ACCESS_NETWORK_STATE` | Saber si hay conexión; lo pide la librería de imágenes (`expo-image`, que usa Glide) para reintentar descargas cuando vuelve la red | Normal |

Los dos son de nivel **normal**: Android los concede al instalar la app, sin preguntar.
Por eso la app **no muestra ningún diálogo de permisos**. Los diálogos solo aparecen
con los permisos *peligrosos* (cámara, ubicación, almacenamiento, notificaciones…), y la
app no tiene ninguno. En Google Play aparecen como "acceso completo a la red" y "ver
conexiones de red".

Puede aparecer también `com.nubstudio.movil.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`.
Esa la define la propia app (la agrega AndroidX) con nivel `signature`: solo la pueden
usar apps firmadas con la misma llave y la persona usuaria no la ve.

### Permisos bloqueados (#122)

La plantilla de Expo y algunas librerías agregan permisos por defecto aunque la app no
los use. Google Play los revisa y pide justificarlos, así que se quitan del manifiesto
con `android.blockedPermissions` en `app.json`:

| Permiso bloqueado | De dónde venía |
| --- | --- |
| `SYSTEM_ALERT_WINDOW` | Plantilla de Expo (dibujar encima de otras apps; solo sirve para el menú de desarrollo) |
| `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` | Plantilla de Expo y Glide (`expo-image`), hasta Android 12. La app guarda la caché de imágenes en su carpeta privada, que no pide permiso |
| `USE_BIOMETRIC`, `USE_FINGERPRINT` | `androidx.biometric`, que trae `expo-secure-store` para pedir la huella al leer un dato. La app no usa esa opción |
| `VIBRATE` | Plantilla de Expo; la app no vibra |

Si algún día se agrega una función que necesite uno de estos permisos, hay que quitarlo
de la lista y explicarlo aquí.

### Cómo comprobarlo

- **En el celular (CP-GP-05):** Ajustes → Apps → NUB Studio → Permisos. Debe decir que
  la app no pide permisos.
- **En el APK:** con las *build-tools* del SDK de Android,
  ```bash
  aapt2 dump permissions NUB-Studio-1.1.0.apk
  ```
  Solo deben salir `INTERNET`, `ACCESS_NETWORK_STATE` y, si aparece, el permiso
  `signature` de la propia app.
- **En MobSF** (sección 5): la tabla *Permissions* no debe tener ninguno marcado como
  *dangerous*.

---

## 9. Sesión con JWT y manejo del error 401

### Cómo se inicia y se guarda la sesión

1. El cliente inicia sesión con correo y contraseña. El backend responde con un **token
   JWT** firmado con HS256, con emisor `nub-studio`, audiencia `nub-users`, un `jti`
   (identificador único) y su vencimiento.
2. El backend registra esa sesión en la tabla `sesiones_activas`, buscable por la huella
   SHA-256 del token, con la misma fecha de vencimiento.
3. La app guarda el token con `expo-secure-store` (sección 10) y lo manda en cada
   petición protegida como `Authorization: Bearer <token>` (`src/models/api.js`). Ningún
   otro archivo arma ese encabezado.

| Rol | Duración de la sesión | Por qué |
| --- | --- | --- |
| Cliente | 7 días | Solo compra y guarda favoritos; así no tiene que iniciar sesión cada día (#147) |
| Artista y administrador | 24 horas | Manejan obras, ventas y datos de otras personas. Además, no usan la app (#148) |

### Qué revisa el backend en cada petición

El middleware `authenticateToken` del backend revisa la firma, el emisor, la audiencia y
el vencimiento del token, y luego que la sesión siga en `sesiones_activas`. Si algo
falla responde `401` con un código:

| Código | Cuándo |
| --- | --- |
| `TOKEN_EXPIRED` | El token ya venció (pasaron los 7 días) |
| `INVALID_TOKEN` | El token está mal formado o alguien lo modificó |
| `SESSION_REVOKED` | El token es válido, pero la sesión ya se cerró en el servidor |
| `VERIFICATION_ERROR` | Otro error al verificar el token |
| `NO_TOKEN` | La petición no trae token. No hay sesión que cerrar, así que la app no lo trata como sesión vencida |

La sesión se cierra en el servidor, aunque el token no haya vencido, cuando el cliente:
cierra sesión, cambia o recupera su contraseña (se cierran **todas** sus sesiones) o
elimina su cuenta.

### Qué hace la app con un 401 (#129)

`src/models/api.js` es el único lugar donde se hacen las peticiones, así que ahí está el
manejo del 401 para toda la app:

1. Si la respuesta es `401`, la petición llevaba token y el código es uno de los cuatro
   primeros de la tabla, avisa a `AuthContext` con el token rechazado.
2. `AuthContext` cierra la sesión **solo si ese token es el actual** (una respuesta
   vieja no cierra una sesión nueva, y varias respuestas rechazadas cuentan como una) y
   borra el token guardado en el celular.
3. La navegación regresa a **Iniciar sesión**, limpia las pantallas anteriores y muestra
   "Tu sesión venció. Inicia sesión de nuevo para continuar." (`useSesionVencida`).

Lo que **no** cierra la sesión:

- Un `401` sin esos códigos. Por ejemplo, la contraseña incorrecta al eliminar la cuenta:
  la pantalla muestra el error y la sesión sigue.
- Un `403` (no tiene permiso para esa acción), un `500` o un `503` (el backend no pudo
  revisar la sesión en ese momento).
- No tener internet. Al abrir la app sin conexión se conserva la sesión guardada.

Al abrir la app con conexión, `GET /api/auth/check-session` revisa la sesión guardada;
si responde `401` o `403`, la app la borra y abre como visitante, sin aviso. En plena
sesión, la detecta el manejo del 401 de arriba.

### Por qué no hay *refresh token*

Un *refresh token* sirve para pedir tokens nuevos sin volver a escribir la contraseña.
No se usa porque:

- La sesión del cliente ya dura 7 días, suficiente para una tienda donde se compra de
  vez en cuando. Al vencer, se inicia sesión otra vez.
- Un *refresh token* es otra credencial de larga duración que habría que guardar,
  rotar y revocar. Lo que resuelve, cortar una sesión robada, ya lo hace
  `sesiones_activas`: el servidor puede cerrar cualquier sesión al instante.
- Menos piezas, menos errores: la app no tiene que reintentar peticiones mientras
  renueva el token.

Si el negocio pidiera sesiones más largas, la opción sería agregar un *refresh token*
rotativo guardado también en `expo-secure-store`.

### Pruebas

| Archivo (`tests/unit/`) | Qué comprueba | Pruebas |
| --- | --- | --- |
| `apiSesionInvalida.test.js` | Los cuatro códigos avisan; un 401 sin código, sin token, un 403 o un 500 no | 9 |
| `authContextSesionVencida.test.js` | Cierra la sesión y borra el token; un token viejo no cierra la sesión actual; varias respuestas cuentan como una | 6 |
| `useSesionVencida.test.js` | Lleva a Iniciar sesión una sola vez y limpia las pantallas anteriores | 4 |
| `componentes/LoginSesionVencida.test.js` | Explica por qué se pide iniciar sesión de nuevo | 2 |
| `authContextRol.test.js` | Cierra la sesión guardada de un artista o un administrador | 4 |

Ejecutadas en local el 24/11/2026: 25 de 25 aprobadas. En la colección de Newman, la
carpeta *06 · Rutas protegidas sin sesión* comprueba que las rutas protegidas responden
`401` sin token.

**Prueba manual:** con sesión en la app, desde otro celular o la web usar "¿Olvidaste tu
contraseña?" con la misma cuenta y poner una contraseña nueva. Al volver a la app y
abrir Mis pedidos, debe regresar a Iniciar sesión con el aviso de sesión vencida.

---

## 10. Almacenamiento seguro del token

El token y los datos de la sesión (nombre, correo y rol, entre otros) se guardan con
**`expo-secure-store`** (`src/models/AuthContext.js`), nunca en texto plano:

- Cifra cada valor con AES-GCM usando una llave que vive en el **Android Keystore**. La
  llave no sale del Keystore, así que copiar los archivos de la app no basta para leer
  el token.
- Lo cifrado queda en un archivo privado de la app que **no entra en los respaldos** de
  Android (Auto Backup ni copia a otro celular): el plugin de `expo-secure-store` agrega
  esas reglas al manifiesto.
- Al cerrar sesión, al vencer la sesión o al eliminar la cuenta se borran las dos
  entradas (`nub_token` y `nub_usuario`).

La app no usa `AsyncStorage` ni escribe en la consola (`console.log`), así que el token
no queda en otro lugar del celular ni en `logcat`.

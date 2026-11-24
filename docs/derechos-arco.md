# Derechos ARCO — Nub-studio-movil

Cómo la app permite a cada cliente ejercer sus derechos ARCO (**A**cceso,
**R**ectificación, **C**ancelación y **O**posición) sobre sus datos personales, como
pide la Ley Federal de Protección de Datos Personales en Posesión de los Particulares
(LFPDPPP), y cómo se comprobó.

Todo lo de este documento ya está en la versión **1.1.0** de Google Play: eliminar la
cuenta llegó en la 1.0.0 (#108) y editar los datos y la preferencia de marketing en la
1.1.0 (#127).

---

## 1. Resumen

| Derecho | Qué puede hacer el cliente | Dónde, en la app | Endpoint del backend |
| --- | --- | --- | --- |
| **Acceso** | Ver los datos que guardamos de él | Cuenta → Datos personales | `GET /api/auth/perfil` |
| **Rectificación** | Corregir su nombre y su teléfono | Cuenta → Datos personales → Guardar | `PUT /api/auth/perfil` |
| **Cancelación** | Eliminar su cuenta | Cuenta → Eliminar mi cuenta | `DELETE /api/auth/cuenta` |
| **Oposición** | Dejar de recibir promociones por correo | Cuenta → Datos personales → interruptor de promociones | `PUT /api/auth/perfil` (`acepta_marketing`) |

Las tres rutas exigen sesión iniciada (token JWT, ver
[seguridad.md](seguridad.md#9-sesión-con-jwt-y-manejo-del-error-401)) y solo trabajan
con los datos de la cuenta de esa sesión: el backend toma el usuario del token, no de
la petición. Lo que no se puede hacer desde la app (cambiar el correo, revocar el
consentimiento o pedir una copia completa) se pide por correo, con el procedimiento de
la sección 10 del Aviso de Privacidad.

Código:

| Capa | Archivo |
| --- | --- |
| Servicios (app) | `src/models/perfilService.js` (Acceso, Rectificación, Oposición) y `eliminarCuenta` en `src/models/authService.js` (Cancelación) |
| ViewModels | `src/viewmodels/usePersonalDataViewModel.js`, `src/viewmodels/useEliminarCuentaViewModel.js` |
| Pantallas | `src/views/screens/profile/PersonalDataScreen.js`, `EliminarCuentaScreen.js`, `AccountScreen.js` |
| Backend | `src/controllers/cuentaController.js` y `src/routes/authRoutes.js` (repositorio `Nub_studio_back`) |

---

## 2. Consentimiento antes de dar datos

- **Registro.** La pantalla de registro tiene la casilla "Acepto los Términos y
  Condiciones y la Política de privacidad", con enlaces a los dos documentos. Empieza
  **sin marcar**. Sin ella la app no envía el registro ("Debes aceptar los términos y
  condiciones") y, si alguien llama al backend directo, este también lo rechaza con
  `400` porque exige `aceptoTerminos: true`.
- **Pocos datos.** Para crear la cuenta solo se piden nombre, correo y contraseña. El
  teléfono es opcional y la dirección se pide hasta la compra. La app no usa cámara,
  ubicación, contactos ni archivos del celular (ver
  [seguridad.md](seguridad.md#8-permisos-de-android)).
- **Marketing aparte.** Recibir promociones es una autorización separada de los
  términos. En la base de datos empieza en `FALSE` (migración
  `2026-11-03_usuarios_acepta_marketing.sql` del backend) y solo cambia cuando el
  cliente mueve el interruptor.
- **Aviso de privacidad siempre a la mano.** Se abre desde el registro y desde Cuenta,
  con o sin sesión (CP-GP-04). Es el mismo texto de la web: la sección 9 explica los
  derechos ARCO, la 10 cómo ejercerlos por correo y sus plazos, y la 17 cómo eliminar
  la cuenta.

---

## 3. Cómo funciona cada derecho

### 3.1 Acceso

Cuenta → **Datos personales** muestra lo que el backend tiene guardado del cliente:
nombre, correo, teléfono y si acepta promociones. Los datos se piden al backend en ese
momento (`GET /api/auth/perfil`), no se toman de la copia de la sesión, así que siempre
son los actuales.

El backend solo regresa esas columnas y la fecha de registro. Nunca regresa la
contraseña cifrada, los códigos de verificación ni el secreto de doble factor (prueba
"no consulta ni devuelve datos sensibles").

Artistas y administradores no usan la app (#148); si una sesión vieja de esos roles
llega a esta pantalla, solo ve el nombre y el correo de su sesión, sin formulario.

### 3.2 Rectificación

En la misma pantalla el cliente corrige su **nombre** y su **teléfono** y presiona
Guardar. La app solo manda los campos que cambiaron, y el backend solo actualiza los
campos permitidos:

- El nombre acepta de 3 a 100 caracteres, solo letras y espacios.
- El teléfono debe tener 10 números. Si se deja vacío, se borra.
- El **correo no se cambia aquí**: cambiarlo exige verificar el nuevo, así que se pide
  por correo. El backend lo ignora aunque llegue en la petición (prueba "no cambia el
  correo aunque llegue junto a un campo válido").

Si el nombre cambia, también se actualiza el que se ve en Cuenta.

### 3.3 Cancelación

Cuenta → **Eliminar mi cuenta** explica primero qué se borra y qué se conserva. El
cliente escribe su contraseña y confirma.

El backend **anonimiza** la cuenta en una sola transacción (si algo falla, no cambia
nada):

| Se borra o se reemplaza | Se conserva |
| --- | --- |
| Nombre ("Usuario eliminado"), correo, teléfono y contraseña | Pedidos y ventas, sin datos personales, 5 años por obligación fiscal (SAT) |
| Favoritos, carrito y reacciones del blog | Comentarios del blog, como "Usuario eliminado" |
| Direcciones que no se usaron en compras (las usadas quedan marcadas como eliminadas) | |
| Códigos de verificación, secreto de doble factor y **todas las sesiones abiertas** | |
| Autorización de marketing | |

La fila del usuario no se borra porque la referencian los pedidos y las ventas; queda
marcada como eliminada y sin datos personales.

Casos que el backend rechaza:

| Respuesta | Cuándo | Lo que ve el cliente |
| --- | --- | --- |
| `401` | Contraseña incorrecta | "La contraseña no es correcta"; la cuenta sigue activa (CP-GP-02) |
| `409` | Tiene un pedido pagado, en proceso o enviado | Que podrá eliminarla cuando se entregue o se cancele |
| `403` | La cuenta es de artista o administrador | Que se da de baja desde soporte |

Al terminar, la app borra el token guardado en el celular y regresa a Login.

Google Play también pide poder eliminar la cuenta **sin la app**: la sección 17.2 del
Aviso de Privacidad explica cómo pedirlo por correo.

### 3.4 Oposición

En Datos personales está el interruptor **"Recibir promociones y novedades por
correo"**. Al apagarlo se guarda de inmediato (`acepta_marketing: false`). Si no se
puede guardar, el interruptor regresa a como estaba y la app avisa que no se guardó. Los correos de la cuenta y de los pedidos siguen llegando, porque son
necesarios para el servicio.

---

## 4. Pruebas automáticas

**App (Jest).** Corren en cada Pull Request, en la etapa *02 · Pruebas unitarias* de
`ci.yml`. Ejecutadas en local el 24/11/2026: **72 de 72 aprobadas** en 12 archivos.

| Archivo (`tests/unit/`) | Derecho | Qué comprueba | Pruebas |
| --- | --- | --- | --- |
| `perfilService.test.js` | A, R, O | Que consulte con el token, que mande solo lo que cambió y la preferencia con el nombre que espera el backend, y los mensajes de error | 6 |
| `viewmodels/usePersonalDataViewModel.test.js` | A, R, O | Carga real del backend, validación, guardado parcial, interruptor que regresa si falla, sesión vencida | 12 |
| `componentes/PersonalDataScreen.test.js` | A, R, O | Correo solo como texto, interruptor apagado al inicio, avisos de guardado y de error | 9 |
| `eliminarCuentaService.test.js` | C | Endpoint, token y contraseña; mensajes de 401, 403 y 409 | 5 |
| `viewmodels/useEliminarCuentaViewModel.test.js` | C | Pide la contraseña antes de llamar al backend y muestra el error del servidor | 3 |
| `componentes/EliminarCuentaScreen.test.js` | C | Explica qué se borra y qué se conserva, confirma y regresa a Login, pedido en camino | 4 |
| `componentes/RegisterScreen.test.js` | Consentimiento | Valida los términos; la casilla se marca y desmarca | 7 |
| `viewmodels/useRegisterViewModel.test.js` | Consentimiento | Con el formulario incompleto no llama al registro; la casilla empieza sin marcar | 7 |
| `legal.test.js` | Aviso | Mismos documentos y secciones que la web; explica cómo eliminar la cuenta | 4 |
| `componentes/LegalScreen.test.js` | Aviso | Muestra el Aviso con su índice, tablas y recuadros | 4 |
| `componentes/AccountScreen.test.js` | Aviso | Aviso y términos visibles con y sin sesión | 2 |
| `apiSesionInvalida.test.js` | Seguridad | Una contraseña incorrecta al eliminar la cuenta **no** cierra la sesión | 9 |

```bash
pnpm jest tests/unit/perfilService.test.js tests/unit/eliminarCuentaService.test.js \
  tests/unit/legal.test.js tests/unit/apiSesionInvalida.test.js \
  tests/unit/componentes/PersonalDataScreen.test.js tests/unit/componentes/EliminarCuentaScreen.test.js \
  tests/unit/componentes/RegisterScreen.test.js tests/unit/componentes/LegalScreen.test.js \
  tests/unit/componentes/AccountScreen.test.js \
  tests/unit/viewmodels/usePersonalDataViewModel.test.js \
  tests/unit/viewmodels/useEliminarCuentaViewModel.test.js \
  tests/unit/viewmodels/useRegisterViewModel.test.js
```

**API (Newman)**, colección `tests/api/nub-studio.postman_collection.json`. Corre en
la regresión de `release.yml`, contra un backend temporal:

- Carpeta *06 · Rutas protegidas sin sesión*: ver perfil, editar perfil y eliminar
  cuenta sin token responden `401`.
- Carpeta *08 · Sesión de cliente*: "Mi perfil" responde `200` con el nombre y el
  correo de la cuenta de prueba.

**Backend (repositorio `Nub_studio_back`):** `tests/unit/perfilCliente.test.js`
(12 pruebas: Acceso, Rectificación y Oposición) y `tests/unit/cuentaController.test.js`
(10 pruebas: Cancelación, incluida la transacción que se deshace si algo falla).

---

## 5. Evidencia manual (capturas para la entrega)

Se hace en la app de Google Play (1.1.0) con una **cuenta nueva propia**, nunca con la
cuenta de prueba del equipo, porque el último paso la elimina. En las capturas se tapa
el correo y el teléfono. Las imágenes van en `docs/pruebas/img/arco/`.

| # | Derecho | Pasos | Resultado esperado | Captura |
| --- | --- | --- | --- | --- |
| 1 | Consentimiento | En la pantalla de registro, llenar los datos y presionar Crear cuenta sin marcar la casilla | Aparece "Debes aceptar los términos y condiciones" | `01-registro-terminos.png` |
| 2 | Acceso | Iniciar sesión → Cuenta → Datos personales | Se ven nombre, correo y teléfono; el interruptor de promociones está apagado | `02-acceso.png` |
| 3 | Rectificación | Cambiar el teléfono y presionar Guardar | Aparece "Tus datos se guardaron."; al salir y volver sigue el teléfono nuevo | `03-rectificacion.png` |
| 4 | Oposición | Encender y luego apagar el interruptor de promociones; salir y volver | Se queda como se dejó | `04-oposicion.png` |
| 5 | Aviso | Cuenta → Aviso de privacidad → sección 9 | Se ven los derechos ARCO y, en la 10, cómo ejercerlos | `05-aviso-arco.png` |
| 6 | Cancelación | Cuenta → Eliminar mi cuenta | Se explica qué se borra y qué se conserva | `06-cancelacion-explicacion.png` |
| 7 | Cancelación | Escribir la contraseña y confirmar; luego intentar iniciar sesión con esa cuenta | Regresa a Login y ya no se puede entrar (CP-GP-01) | `07-cancelacion-resultado.png` |

| # | Resultado | Celular y Android | Fecha | Responsable |
| --- | --- | --- | --- | --- |
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |
| 6 | | | | |
| 7 | | | | |

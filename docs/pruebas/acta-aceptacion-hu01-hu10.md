# Acta de aceptación: historias HU-01 a HU-10 (#57)

Presentación de la app al cliente para que confirme los criterios de aceptación de
[backlog-historias-usuario.md](../backlog-historias-usuario.md). Los pasos de cada
demostración son los casos marcados con **(A)** en [PLAN_DE_PRUEBAS.md](../PLAN_DE_PRUEBAS.md).

| Dato | Valor |
| --- | --- |
| Cliente | Samuel Trejo |
| Fecha | 10 de noviembre de 2026 |
| Presentó | Todo el equipo: SoraidaMedina, MishelGvea y Gustavo5B |
| App | Versión 1.0.0, en un celular Android |
| Resultado | ✅ **El cliente acepta HU-01 a HU-10** |

## 1. Criterios de aceptación

| Historia | Criterio de aceptación | Casos | ¿Lo acepta? | Observaciones |
| --- | --- | --- | :-: | --- |
| HU-01 Inicio y catálogo | Se puede navegar sin iniciar sesión | CP-01-01 | ✅ Sí | |
| HU-01 Inicio y catálogo | La pantalla de inicio muestra obras destacadas y da acceso al catálogo completo | CP-01-02 | ✅ Sí | |
| HU-01 Inicio y catálogo | Los filtros se pueden combinar y limpiar; si no hay resultados se muestra un mensaje claro | CP-01-03 a CP-01-06 | ✅ Sí | |
| HU-02 Detalle de obra | Se pueden ver todas las imágenes de la obra | CP-02-01, CP-02-02 | ✅ Sí | |
| HU-02 Detalle de obra | Desde el detalle se puede ir al perfil del artista | CP-02-03 | ✅ Sí | |
| HU-02 Detalle de obra | Hay botones para agregar la obra al carrito y a favoritos | CP-02-04 | ✅ Sí | |
| HU-03 Perfil de artista | Se muestra la información pública del artista | CP-03-01 | ✅ Sí | |
| HU-03 Perfil de artista | Se listan sus obras, cada una con enlace a su detalle | CP-03-02 | ✅ Sí | |
| HU-04 Colecciones | Se listan las colecciones disponibles | CP-04-01 | ✅ Sí | |
| HU-04 Colecciones | Cada colección muestra su descripción y sus obras, con enlace al detalle | CP-04-02 | ✅ Sí | |
| HU-05 Blog | Las publicaciones se listan de la más reciente a la más antigua | CP-05-01 | ✅ Sí | |
| HU-05 Blog | Cada publicación se abre en su propia pantalla, con imágenes y texto | CP-05-02 | ✅ Sí | |
| HU-06 Registro, sesión y cuenta | Las credenciales se validan contra el backend y los errores se muestran de forma clara | CP-06-02, CP-06-04, CP-06-05 | ✅ Sí | |
| HU-06 Registro, sesión y cuenta | La sesión se conserva al cerrar y volver a abrir la app | CP-06-06 | ✅ Sí | |
| HU-06 Registro, sesión y cuenta | Desde Cuenta se pueden ver los datos, cambiar la contraseña y cerrar sesión, lo que elimina el token guardado | CP-06-07, CP-06-09, CP-06-10 | ✅ Sí | Ver el cambio de la sección 2 |
| HU-07 Favoritos | Desde el detalle de una obra se puede agregar o quitar de favoritos | CP-07-02 | ✅ Sí | |
| HU-07 Favoritos | Hay una pantalla con la lista de favoritos | CP-07-03 | ✅ Sí | |
| HU-07 Favoritos | Si se intenta guardar sin sesión, la app pide iniciar sesión | CP-07-01 | ✅ Sí | |
| HU-08 Carrito | Se muestra el total actualizado | CP-08-02, CP-08-03 | ✅ Sí | |
| HU-08 Carrito | Si se intenta agregar al carrito sin sesión, la app pide iniciar sesión | CP-08-01 | ✅ Sí | |
| HU-09 Finalizar compra | Al finalizar la compra se llega a la pantalla de pago | CP-09-01 | ✅ Sí | Ver el cambio de la sección 2 |
| HU-09 Finalizar compra | El carrito de la app es el mismo que ve el usuario en la web | CP-09-04 | ✅ Sí | |
| HU-10 Mis pedidos | Se listan los pedidos del cliente, incluidos los hechos en la web | CP-10-01 | ✅ Sí | |
| HU-10 Mis pedidos | Cada pedido muestra su estatus y su detalle | CP-10-02 | ✅ Sí | |

**24 de 24 criterios aceptados.**

También se presentaron los requisitos de Google Play marcados con (A), y el cliente los
aceptó:

| Caso | Qué se mostró | ¿Lo acepta? |
| --- | --- | :-: |
| CP-GP-01 | Eliminar mi cuenta desde la app | ✅ Sí |
| CP-GP-04 | Aviso de privacidad y términos y condiciones | ✅ Sí |

## 2. Cambios respecto al backlog

| Historia | Criterio original | Cómo quedó en la app | Decisión del cliente |
| --- | --- | --- | --- |
| HU-06 | Cambiar la contraseña pidiendo la actual | Se cambia con un código de 6 dígitos que llega al correo, porque el backend no tiene otra ruta para cambiar la contraseña (ver `src/models/authService.js`) | ✅ Aceptado |
| HU-09 | "Finalizar compra" abre la web en la sección de pago | La compra se termina en la app (dirección de envío y método de pago) y el pago se hace en Mercado Pago (desde el PR #104). En la demostración no se completó ningún pago | ✅ Aceptado |

## 3. Observaciones e issues

No hubo observaciones del cliente ni se abrieron issues. Todos los casos funcionaron
correctamente durante la presentación.

## 4. Conclusión

El cliente, **Samuel Trejo**, revisó la app en un celular y **aceptó las historias HU-01 a
HU-10**: los 24 criterios de aceptación se cumplen, incluidos los cambios en la forma de
cambiar la contraseña (HU-06) y de pagar (HU-09).

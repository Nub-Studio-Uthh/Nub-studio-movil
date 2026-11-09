# Plan de pruebas — Nub-studio-movil

Casos de prueba de la app móvil NUB Studio, derivados de los criterios de
aceptación de las historias HU-01 a HU-10
([backlog-historias-usuario.md](backlog-historias-usuario.md)) y de los
requisitos de Google Play que se agregaron para la versión 1.0.0.

Este documento es la base de:

- **Pruebas funcionales manuales** (#47): se ejecutan todos los casos.
- **Pruebas de regresión** (#58): se repiten los casos de prioridad **Alta**
  después de cada corrección importante.
- **Pruebas de aceptación con el cliente** (#50 y #57): se recorren los casos
  marcados con **(A)** junto con el cliente.
- **Reporte de resultados** (#51): se resume lo registrado en la sección 7.

Los recursos y herramientas de cada tipo de prueba están en
[pruebas/recursos-pruebas.md](pruebas/recursos-pruebas.md) y los pipelines
automáticos en [pruebas/pipelines.md](pruebas/pipelines.md).

---

## 1. Alcance

| Incluido | Fuera de este plan |
| --- | --- |
| Las 10 historias del MVP (HU-01 a HU-10) | Funciones solo de la web (portal de artista, panel de administración) |
| Eliminar cuenta, reportar comentarios y documentos legales (requisitos de Google Play) | iOS (la app se publica solo para Android) |
| Comportamiento sin sesión, con sesión de cliente y con el servidor dormido | Pagos reales: el flujo se prueba hasta la pantalla de Mercado Pago, sin pagar |

## 2. Entorno de prueba

| Elemento | Valor |
| --- | --- |
| App | Versión **1.0.0 (versionCode 3)**: instalada desde la prueba cerrada de Google Play o con el APK `NUB-Studio-v1.0.0.apk` del [release v1.0.0](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/releases/tag/v1.0.0) |
| Dispositivos | Al menos dos Android con versiones distintas (Android 7.0 o superior); ver #49 |
| Backend | El de producción (Render) que usa la app publicada |
| Cuenta de cliente | La cuenta de prueba del equipo. **La contraseña no se escribe en este documento** porque el repositorio es público; se pide al responsable del proyecto |
| Cuenta nueva | Un correo propio de quien prueba, para los casos de registro y de eliminar cuenta |

> Las pruebas automáticas (Jest, Newman, k6 y Maestro) **no** usan el
> backend de Render: levantan su propio entorno temporal en GitHub Actions.
> Las pruebas manuales de este plan sí usan la app publicada.

## 3. Cómo leer los casos

- **ID:** `CP-<historia>-<número>`. Los casos adicionales usan `CP-GP` (Google
  Play) y `CP-NF` (no funcionales).
- **Prioridad:** **Alta** = bloquea una historia o un requisito de Google
  Play; **Media** = afecta la experiencia; **Baja** = detalle visual.
- **(A):** se presenta al cliente en la prueba de aceptación.
- **Automatizado:** prueba que ya cubre el caso en CI. `E2E` = flujo de
  Maestro en `tests/e2e/`; `Unit` = prueba de Jest en `tests/unit/`.

Cuando un caso falla, se registra una issue con la etiqueta `bug`, su
prioridad y el ID del caso en el título (por ejemplo,
`bug(CP-08-02): el total no se actualiza al quitar una obra`).

---

## 4. Casos por historia

### HU-01: Inicio y catálogo

| ID | Caso | Precondición | Pasos | Resultado esperado | Prioridad | Automatizado |
| --- | --- | --- | --- | --- | --- | --- |
| CP-01-01 (A) | Entrar sin cuenta | App recién instalada | 1. Abrir la app. 2. Presionar "Explorar sin cuenta". | Se abre Inicio sin pedir sesión. | Alta | E2E 01 |
| CP-01-02 (A) | Contenido de Inicio | CP-01-01 | 1. Revisar Inicio. | Se ven colecciones, obras recién agregadas y la sección del blog, con acceso al catálogo ("Ver catálogo"). | Alta | Unit `useHomeViewModel` |
| CP-01-03 (A) | Filtrar por categoría | Estar en Catálogo | 1. Tocar una categoría (por ejemplo, Cerámica). | Solo se muestran obras de esa categoría y el contador de obras cambia. | Alta | E2E 04 |
| CP-01-04 | Combinar filtros | Estar en Catálogo | 1. Abrir Filtros. 2. Elegir categoría y rango de precio. 3. Aplicar. | Se muestran solo las obras que cumplen ambos filtros. | Alta | E2E 04, Unit `FiltersScreen` |
| CP-01-05 | Limpiar filtros | CP-01-04 | 1. Abrir Filtros. 2. Limpiar. | Vuelven a aparecer todas las obras. | Media | E2E 04 |
| CP-01-06 | Sin resultados | Estar en Catálogo | 1. Aplicar un filtro que no tenga obras. | Aparece "No hay obras con esos filtros" en lugar de una lista vacía. | Media | E2E 04 |
| CP-01-07 | Buscar | Estar en Catálogo | 1. Escribir parte del título de una obra o del nombre de un artista. | La lista muestra solo las coincidencias. | Media | Unit `CatalogScreen` |
| CP-01-08 | Ordenar | Estar en Catálogo | 1. Cambiar "Ordenar" (nombre, precio). | El orden de la lista cambia según la opción. | Baja | Unit `SortSelector` |

### HU-02: Detalle de obra

| ID | Caso | Precondición | Pasos | Resultado esperado | Prioridad | Automatizado |
| --- | --- | --- | --- | --- | --- | --- |
| CP-02-01 (A) | Abrir el detalle | Estar en Catálogo | 1. Tocar una obra. | Se ven imagen, título, precio en MXN, artista, descripción y existencias. | Alta | E2E 01 |
| CP-02-02 | Ver todas las imágenes | Obra con varias imágenes | 1. Deslizar las imágenes. | Se recorren todas las imágenes de la obra. | Media | Unit `useDetalleObraViewModel` |
| CP-02-03 (A) | Ir al perfil del artista | CP-02-01 | 1. Tocar "Ver perfil". | Se abre el perfil del artista de esa obra. | Alta | E2E 06 |
| CP-02-04 | Botones de compra y favorito | CP-02-01 | 1. Revisar la parte de abajo. | Se ven "Comprar ahora", "Agregar al carrito" y el corazón de favoritos. | Alta | Unit `DetalleObraCompra`, `DetalleObraFavorito` |
| CP-02-05 | Límite de existencias | Obra con pocas existencias | 1. Aumentar la cantidad con "+". | No permite pasar del número disponible. | Media | Unit `existencias` |

### HU-03: Perfil de artista

| ID | Caso | Precondición | Pasos | Resultado esperado | Prioridad | Automatizado |
| --- | --- | --- | --- | --- | --- | --- |
| CP-03-01 (A) | Información del artista | CP-02-03 | 1. Revisar el perfil. | Se ve la información pública del artista (nombre, foto, descripción). No se muestran correo ni teléfono. | Alta | E2E 06, Unit `artistas` |
| CP-03-02 (A) | Obras del artista | CP-03-01 | 1. Tocar una de sus obras. | Se abre el detalle de esa obra. | Alta | E2E 06 |

### HU-04: Colecciones

| ID | Caso | Precondición | Pasos | Resultado esperado | Prioridad | Automatizado |
| --- | --- | --- | --- | --- | --- | --- |
| CP-04-01 (A) | Lista de colecciones | Estar en Inicio | 1. Presionar "Ver todas" en Colecciones. | Se listan las colecciones publicadas. | Alta | E2E 07 |
| CP-04-02 (A) | Detalle de colección | CP-04-01 | 1. Abrir una colección. 2. Tocar una obra. | Se ven la descripción y las obras de la colección; cada obra abre su detalle. | Alta | E2E 07, Unit `ColeccionScreen` |

### HU-05: Blog

| ID | Caso | Precondición | Pasos | Resultado esperado | Prioridad | Automatizado |
| --- | --- | --- | --- | --- | --- | --- |
| CP-05-01 (A) | Lista del blog | Estar en Inicio | 1. Abrir el blog. | Las publicaciones aparecen de la más reciente a la más antigua. | Alta | E2E 05 |
| CP-05-02 (A) | Abrir publicación | CP-05-01 | 1. Tocar una publicación. | Se abre en su propia pantalla, con imágenes y texto. | Alta | E2E 05, Unit `PostScreen` |
| CP-05-03 | Comentar sin sesión | Sin sesión, CP-05-02 | 1. Bajar a Comentarios. | Se pueden leer los comentarios y se invita a iniciar sesión para comentar. | Media | Unit `PostScreen` |
| CP-05-04 | Comentar y responder | Con sesión de cliente | 1. Escribir un comentario y enviarlo. 2. Responder a otro comentario. | Aparece "Comentario publicado" y el comentario se ve en la lista. Si lleva enlaces, avisa que se revisará antes de publicarse. | Media | Unit `PostScreen`, `useComentariosViewModel` |
| CP-05-05 | Borrar comentario propio | CP-05-04 | 1. Tocar "Eliminar" en el comentario propio. 2. Confirmar. | El comentario desaparece y aparece "Comentario eliminado". | Baja | Unit `useComentariosViewModel` |

### HU-06: Registro, inicio de sesión y cuenta

| ID | Caso | Precondición | Pasos | Resultado esperado | Prioridad | Automatizado |
| --- | --- | --- | --- | --- | --- | --- |
| CP-06-01 | Validaciones de registro | Pantalla de registro | 1. Enviar el formulario vacío o con un correo inválido. | Se muestran los mensajes de validación de cada campo. | Media | E2E 02 |
| CP-06-02 (A) | Registro con verificación | Correo nuevo propio | 1. Registrarse. 2. Escribir el código de 6 dígitos que llega al correo. | La cuenta queda verificada y se puede iniciar sesión. | Alta | Unit `useVerifyEmailViewModel` |
| CP-06-03 | Correo ya registrado | Correo de una cuenta existente | 1. Intentar registrarse con ese correo. | Mensaje claro de que el correo ya está registrado. | Media | Unit `authValidators` |
| CP-06-04 (A) | Iniciar sesión | Cuenta de cliente | 1. Escribir correo y contraseña. 2. Iniciar sesión. | Se abre Inicio con la sesión iniciada. | Alta | Unit `useLoginViewModel` |
| CP-06-05 | Contraseña incorrecta | Cuenta de cliente | 1. Iniciar sesión con una contraseña equivocada. | Mensaje claro de error, sin cerrar la app. | Alta | Unit `useLoginViewModel` |
| CP-06-06 (A) | La sesión se conserva | CP-06-04 | 1. Cerrar la app por completo. 2. Abrirla de nuevo. | Abre directamente en Inicio con la sesión iniciada. | Alta | Unit `authContextUsuario` |
| CP-06-07 | Ver datos en Cuenta | Con sesión | 1. Abrir Cuenta. | Se ven el nombre y el correo de la cuenta. | Media | Unit `AccountScreen`, `useAccountViewModel` |
| CP-06-08 | Recuperar contraseña | Sin sesión | 1. En Login, "¿Olvidaste tu contraseña?". 2. Escribir el correo. 3. Escribir el código y la nueva contraseña. | Se puede iniciar sesión con la nueva contraseña. | Alta | Unit `RecuperarContrasenaScreen` |
| CP-06-09 | Cambiar contraseña | Con sesión | 1. Cuenta → Cambiar contraseña. 2. Seguir el código enviado al correo. | La contraseña cambia y la anterior deja de funcionar. | Media | Unit `RecuperarContrasenaScreen` |
| CP-06-10 (A) | Cerrar sesión | Con sesión | 1. Cuenta → Cerrar sesión. 2. Cerrar y abrir la app. | La app abre en Login: el token ya no está guardado. | Alta | Unit `useAccountViewModel` |

### HU-07: Favoritos

| ID | Caso | Precondición | Pasos | Resultado esperado | Prioridad | Automatizado |
| --- | --- | --- | --- | --- | --- | --- |
| CP-07-01 | Favorito sin sesión | Sin sesión | 1. En el detalle de una obra, tocar el corazón. | La app pide iniciar sesión. | Alta | E2E 08 |
| CP-07-02 (A) | Agregar y quitar | Con sesión de cliente | 1. Tocar el corazón en una obra. 2. Volver a tocarlo. | El corazón se llena al agregar y se vacía al quitar. | Alta | Unit `DetalleObraFavorito` |
| CP-07-03 (A) | Pantalla de favoritos | CP-07-02 con una obra guardada | 1. Abrir la pestaña Favoritos. | Aparece la obra guardada; si no hay ninguna, "Aún no tienes favoritos". | Alta | Unit `FavoritosScreen` |

### HU-08: Carrito de compras

| ID | Caso | Precondición | Pasos | Resultado esperado | Prioridad | Automatizado |
| --- | --- | --- | --- | --- | --- | --- |
| CP-08-01 | Carrito sin sesión | Sin sesión | 1. En el detalle de una obra, "Agregar al carrito". | La app pide iniciar sesión. | Alta | E2E 03 |
| CP-08-02 (A) | Agregar y ver el total | Con sesión de cliente | 1. Agregar dos obras al carrito. 2. Abrir Carrito. | Se ven las dos obras y el total es la suma de sus precios. | Alta | Unit `carrito` |
| CP-08-03 (A) | Quitar una obra | CP-08-02 | 1. Quitar una obra con el bote de basura. | La obra desaparece y el total se actualiza. | Alta | Unit `carrito` |
| CP-08-04 | Carrito vacío | Carrito sin obras | 1. Abrir Carrito. | Mensaje "Prepara tu compra" con indicación de cómo agregar obras. | Baja | Unit `carrito` |

### HU-09: Finalizar compra

> **Cambio respecto al backlog:** el criterio original pedía abrir la web
> para pagar. Desde el PR #104 la compra se termina en la app (dirección y
> método de pago) y el pago se hace en **Mercado Pago**.

| ID | Caso | Precondición | Pasos | Resultado esperado | Prioridad | Automatizado |
| --- | --- | --- | --- | --- | --- | --- |
| CP-09-01 (A) | Pagar desde el carrito | CP-08-02 | 1. Presionar "Pagar". 2. Elegir o capturar la dirección de envío. 3. Elegir el método de pago. 4. Continuar. | Se abre Mercado Pago con el total correcto. **No completar el pago.** | Alta | Unit `FinalizarCompraScreen`, `checkout` |
| CP-09-02 | Comprar ahora | Con sesión, detalle de una obra | 1. Presionar "Comprar ahora". | Se abre Finalizar compra solo con esa obra y la cantidad elegida. | Alta | Unit `DetalleObraCompra` |
| CP-09-03 | Dirección incompleta | CP-09-01 | 1. Dejar campos obligatorios de la dirección vacíos. 2. Continuar. | Se muestran los errores y no avanza al pago. | Media | Unit `direccion` |
| CP-09-04 | Mismo carrito en la web | Con sesión | 1. Agregar una obra en la app. 2. Iniciar sesión en la web con la misma cuenta. | La obra aparece en el carrito de la web. | Media | — |

### HU-10: Mis pedidos

| ID | Caso | Precondición | Pasos | Resultado esperado | Prioridad | Automatizado |
| --- | --- | --- | --- | --- | --- | --- |
| CP-10-01 (A) | Lista de pedidos | Cuenta con pedidos | 1. Cuenta → Mis pedidos. | Se listan los pedidos, incluidos los hechos en la web, cada uno con su estatus. | Alta | Unit `pedidos` |
| CP-10-02 (A) | Detalle de pedido | CP-10-01 | 1. Abrir un pedido. | Se ven sus obras, total, método de pago y estatus. | Alta | Unit `pedidos` |
| CP-10-03 | Sin pedidos | Cuenta sin pedidos | 1. Abrir Mis pedidos. | Mensaje "Aún no tienes pedidos". | Baja | Unit `pedidos` |

---

## 5. Casos de requisitos de Google Play

| ID | Caso | Precondición | Pasos | Resultado esperado | Prioridad | Automatizado |
| --- | --- | --- | --- | --- | --- | --- |
| CP-GP-01 (A) | Eliminar mi cuenta | Cuenta nueva propia (nunca la de prueba del equipo) | 1. Cuenta → Eliminar mi cuenta. 2. Escribir la contraseña. 3. Confirmar. | Aparece "Cuenta eliminada", la app vuelve a Login y ya no se puede iniciar sesión con esa cuenta. | Alta | Unit `EliminarCuentaScreen`, `eliminarCuentaService` |
| CP-GP-02 | Eliminar con contraseña incorrecta | Cuenta nueva propia | 1. Cuenta → Eliminar mi cuenta. 2. Contraseña equivocada. | Mensaje "La contraseña no es correcta" y la cuenta sigue activa. | Media | Unit `useEliminarCuentaViewModel` |
| CP-GP-03 | Reportar un comentario | Con sesión, comentario de otra persona | 1. Tocar "Reportar". 2. Confirmar. | Aparece "Gracias. Revisaremos el comentario" y el comentario deja de verse. En los comentarios propios no aparece "Reportar". | Alta | Unit `PostScreen` |
| CP-GP-04 (A) | Aviso de privacidad y términos | Con y sin sesión | 1. Abrir Cuenta. 2. Tocar "Aviso de privacidad" y luego "Términos y condiciones". | Se abren los dos documentos. El aviso incluye el correo de contacto y la sección 17 "Eliminar tu cuenta". | Alta | Unit `AccountScreen`, `legal` |
| CP-GP-05 | Permisos de la app | App instalada | 1. Ajustes de Android → Apps → NUB Studio → Permisos. | No pide permisos de cámara, ubicación, almacenamiento ni biometría. | Media | — |

## 6. Casos no funcionales

| ID | Caso | Precondición | Pasos | Resultado esperado | Prioridad | Automatizado |
| --- | --- | --- | --- | --- | --- | --- |
| CP-NF-01 | Servidor dormido | Backend sin uso por más de 15 minutos | 1. Abrir la app y entrar al catálogo. | Muestra un mensaje de espera y carga las obras en menos de 60 s, sin marcar error antes. | Alta | Unit `apiTiempoEspera` |
| CP-NF-02 | Sin internet | Modo avión | 1. Abrir Catálogo. 2. Presionar "Reintentar" ya con internet. | Mensaje de error con "Reintentar"; al reintentar carga normalmente. | Media | Unit `CatalogScreen` |
| CP-NF-03 | Fluidez del catálogo | Catálogo con todas las obras | 1. Desplazar la lista rápido. | La lista no se traba (ver #55 para las mediciones). | Media | — |
| CP-NF-04 | Pantallas chicas | Dispositivo o emulador de pantalla chica | 1. Recorrer Login, registro, detalle y carrito. | Ningún botón queda oculto o cortado. | Media | E2E 02 |

---

## 7. Registro de resultados

Cada integrante copia esta tabla en un comentario de la issue #47 (o de #58 en
regresión) con los casos que le tocaron. El reporte final (#51) se arma con
estos registros.

| ID | Resultado (Aprobado / Fallido / Bloqueado) | Dispositivo y versión de Android | Fecha | Responsable | Issue del bug (si falló) |
| --- | --- | --- | --- | --- | --- |
| CP-01-01 | | | | | |

## 8. Trazabilidad

| Historia | Casos | Flujos E2E (Maestro) |
| --- | --- | --- |
| HU-01 | CP-01-01 a CP-01-08 | 01, 04 |
| HU-02 | CP-02-01 a CP-02-05 | 01, 06 |
| HU-03 | CP-03-01 y CP-03-02 | 06 |
| HU-04 | CP-04-01 y CP-04-02 | 07 |
| HU-05 | CP-05-01 a CP-05-05 | 05 |
| HU-06 | CP-06-01 a CP-06-10 | 02 |
| HU-07 | CP-07-01 a CP-07-03 | 08 |
| HU-08 | CP-08-01 a CP-08-04 | 03 |
| HU-09 | CP-09-01 a CP-09-04 | — |
| HU-10 | CP-10-01 a CP-10-03 | — |
| Google Play | CP-GP-01 a CP-GP-05 | — |
| No funcionales | CP-NF-01 a CP-NF-04 | 02 |

**Total: 55 casos**, 33 de prioridad Alta y 24 para la aceptación con el
cliente (A).

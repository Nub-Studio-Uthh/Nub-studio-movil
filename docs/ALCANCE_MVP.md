
# Nub-studio-móvil — Documento de alcance y requerimientos del MVP

> Issue #6 · Sprint 1 (14–27 sep) · Documento de consulta para todo el equipo durante el desarrollo.
>
> **Actualización (28 sep 2026):** se alineó con `backlog-historias-usuario.md` y `arquitectura-tecnica.md`. Cada pantalla indica la Historia de Usuario (HU) que la respalda.

## 1. Objetivo

Definir con claridad qué entra en la primera versión entregable (MVP) de la app móvil y qué queda fuera por ahora, para evitar que el proyecto crezca sin control (scope creep).

**Alcance general:** app móvil **exclusiva para clientes y visitantes**. Cubre el flujo del cliente desde el primer acceso hasta la preparación de su compra. No incluye funciones de administrador ni de artista.

**Pago:** el pago **no se realiza dentro de la app**. Al finalizar la compra, la app redirige al usuario a la plataforma web de NU-B Studio, donde se completa el proceso con el mismo carrito.

**Restricción de tiempo:** el proyecto cuenta con **5 sprints** dentro del cuatrimestre actual.

## 2. ¿Qué funcionalidades son indispensables para el lanzamiento inicial? (MVP)

Las pantallas se agrupan en 4 módulos.

### 2.1 Autenticación

| Pantalla | Descripción                                                                                                                     | HU    |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- | ----- |
| Login    | Acceso con correo y contraseña, validado contra el backend existente. La sesión se conserva al cerrar y volver a abrir la app. | HU-06 |
| Registro | Alta de una cuenta nueva de cliente. Es la misma cuenta que se usa en la plataforma web.                                         | HU-06 |

### 2.2 Descubrimiento

| Pantalla                            | Descripción                                                                                                                 | HU    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----- |
| Home                                | Entrada con obras destacadas y acceso directo al catálogo. Accesible sin iniciar sesión.                                   | HU-01 |
| Catálogo                           | Listado de obras disponibles con filtros combinables por categoría y precio; mensaje claro si no hay resultados.            | HU-01 |
| Detalle de obra                     | Imágenes, descripción, precio y artista, con acceso al perfil del artista y botones para agregar al carrito y a favoritos. | HU-02 |
| Detalle de artista                  | Información pública del artista y listado de sus obras disponibles; da respaldo y confianza al cliente.                    | HU-03 |
| Colecciones / Detalle de colección | Listado de colecciones temáticas y, en cada una, su descripción y sus obras.                                               | HU-04 |
| Blog / Detalle de publicación      | Publicaciones del estudio ordenadas de la más reciente a la más antigua; cada una se abre en su propia pantalla.           | HU-05 |
| Mis favoritos                       | Obras guardadas por el cliente para revisar después. Requiere sesión iniciada.                                             | HU-07 |

### 2.3 Compra

| Pantalla          | Descripción                                                                                                                                    | HU    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| Carrito           | Revisar las obras agregadas, quitar piezas y ver el total actualizado. Requiere sesión iniciada.                                               | HU-08 |
| Finalizar compra  | Redirige a la plataforma web, en la sección de pago, con el mismo carrito del usuario. No se capturan dirección ni método de pago en la app. | HU-09 |
| Mis pedidos       | Historial de pedidos del cliente, incluidos los realizados en la web.                                                                           | HU-10 |
| Detalle de pedido | Estatus y detalle completo de un pedido específico (solo consulta).                                                                            | HU-10 |

### 2.4 Cuenta

| Pantalla  | Descripción                                                                                                                                 | HU    |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| Mi cuenta | Ver los datos del usuario, cambiar la contraseña (pidiendo la actual) y cerrar sesión, lo que elimina el token guardado en el dispositivo. | HU-06 |

**Criterio de inclusión:** todas las pantallas anteriores forman parte del flujo cliente → compra y tienen una Historia de Usuario asociada en el backlog.

## 3. ¿Qué funcionalidades se consideran "nice to have" y se dejan para después?

No forman parte del plan de trabajo actual. Quedan documentadas como posible siguiente etapa del producto.

| Funcionalidad                | Descripción                                                          | Prioridad      |
| ---------------------------- | --------------------------------------------------------------------- | -------------- |
| Recuperar contraseña        | Restablecer la contraseña vía correo cuando el cliente la olvida.   | Siguiente fase |
| Verificación de email       | Confirmar el correo tras el registro.                                 | Siguiente fase |
| Acerca de / Contacto         | Información institucional y medio de contacto.                       | Siguiente fase |
| Vinculación con Alexa       | Integración con el asistente de voz.                                 | Siguiente fase |
| Chat de soporte en vivo      | Mensajería en tiempo real para dudas antes o después de la compra.  | Futuro         |
| Programa de puntos / lealtad | Acumulación de puntos por compra, canjeables por descuentos u obras. | Futuro         |

## 4. Limitaciones conocidas de esta primera versión

- Solo para **clientes y visitantes**: sin panel de administrador ni funciones para artistas.
- **El pago no se procesa en la app**: se completa en la plataforma web.
- Los pedidos son **solo de consulta** desde la app (no se gestionan ni se cancelan).
- Sin recuperación de contraseña ni verificación de email dentro de la app.
- Sin soporte en tiempo real (no hay chat en vivo).
- Sin programa de puntos ni beneficios por lealtad.
- Tiempo acotado a **5 sprints**; cualquier funcionalidad nueva debe sustituir a una existente o esperar a la siguiente etapa.

## 5. Regla para cambios de alcance

Si durante el desarrollo aparece una funcionalidad nueva que no está en la sección 2:

1. Se registra como issue en el Backlog con la etiqueta correspondiente.
2. El equipo decide si entra al MVP (y qué sale a cambio) o se mueve a la sección 3.
3. Se actualiza este documento **y** `backlog-historias-usuario.md`, para que ambos reflejen siempre el alcance real.

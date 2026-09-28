# Nub-studio-móvil — Documento de alcance y requerimientos del MVP

> Issue #6 · Sprint 1 (14–27 sep) · Documento de consulta para todo el equipo durante el desarrollo.

## 1. Objetivo

Definir con claridad qué entra en la primera versión entregable (MVP) de la app móvil y qué queda fuera por ahora, para evitar que el proyecto crezca sin control (scope creep).

**Alcance general:** app móvil **exclusiva para clientes**. Cubre el flujo completo del cliente, desde el primer acceso hasta la compra. No incluye funciones de administrador ni de artista.

**Restricción de tiempo:** el proyecto cuenta con **5 sprints** dentro del cuatrimestre actual.

## 2. ¿Qué funcionalidades son indispensables para el lanzamiento inicial? (MVP)

Las pantallas se agrupan en 4 módulos.

### 2.1 Autenticación

| Pantalla              | Descripción                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------- |
| Login                 | Acceso con correo y contraseña.                                                             |
| Registro              | Alta de una cuenta nueva de cliente.                                                        |
| Recuperar contraseña  | Restablecer la contraseña vía correo cuando el cliente la olvida (antes de iniciar sesión). |
| Verificación de email | Confirmar el correo tras el registro.                                                       |

### 2.2 Descubrimiento

| Pantalla                      | Descripción                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------- |
| Home                          | Entrada con obras destacadas y acceso directo al catálogo.                    |
| Catálogo                      | Listado de obras disponibles, con filtros básicos (categoría, precio, etc.).  |
| Detalle de obra               | Imágenes, descripción, precio y opción de agregar al carrito.                 |
| Artistas / Detalle de artista | Listado y perfil público de los artistas; da respaldo y confianza al cliente. |
| Detalle de colección / acervo | Vista de colecciones temáticas de obras.                                      |
| Mis favoritos                 | Obras guardadas por el cliente para revisar después.                          |

### 2.3 Compra

| Pantalla          | Descripción                                          |
| ----------------- | ---------------------------------------------------- |
| Carrito           | Revisar y editar cantidades antes de pagar.          |
| Checkout          | Dirección, método de pago y confirmación del pedido. |
| Mis pedidos       | Historial de compras realizadas.                     |
| Detalle de pedido | Estatus y detalle completo de un pedido específico.  |

### 2.4 Cuenta

| Pantalla             | Descripción                                                         |
| -------------------- | ------------------------------------------------------------------- |
| Mi cuenta            | Datos del usuario y cierre de sesión.                               |
| Acerca de / Contacto | Información institucional y medio de contacto (contenido estático). |

**Criterio de inclusión:** todas las pantallas anteriores forman parte del flujo cliente → compra

## 3. ¿Qué funcionalidades se consideran "nice to have" y se dejan para después?

No forman parte del plan de trabajo actual. Quedan documentadas como posible siguiente etapa del producto.

| Funcionalidad                | Descripción                                                          | Prioridad |
| ---------------------------- | -------------------------------------------------------------------- | --------- |
| Chat de soporte en vivo      | Mensajería en tiempo real para dudas antes o después de la compra.   | Futuro    |
| Programa de puntos / lealtad | Acumulación de puntos por compra, canjeables por descuentos u obras. | Futuro    |

## 4. Limitaciones conocidas de esta primera versión

- Solo para **clientes**: sin panel de administrador ni funciones para artistas.
- Sin soporte en tiempo real (no hay chat en vivo).
- Sin programa de puntos ni beneficios por lealtad.
- Tiempo acotado a **5 sprints**; cualquier funcionalidad nueva debe sustituir a una existente o esperar a la siguiente etapa.
- El contenido de "Acerca de / Contacto" es estático (no se edita desde la app).

## 5. Regla para cambios de alcance

Si durante el desarrollo aparece una funcionalidad nueva que no está en la sección 2:

1. Se registra como issue en el Backlog con la etiqueta correspondiente.
2. El equipo decide si entra al MVP (y qué sale a cambio) o se mueve a la sección 3.
3. Se actualiza este documento para que siempre refleje el alcance real.

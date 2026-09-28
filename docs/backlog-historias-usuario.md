# Contexto, Backlog y Estimación — Nub-studio-movil

## 1. Objetivo

Documentar el contexto de la aplicación móvil de NU-B Studio, el backlog inicial del producto en formato de Historias de Usuario y su estimación mediante Planning Poker, como base para la planeación de los sprints del proyecto.

---

## 2. Contexto de la aplicación móvil

**Nub-studio-movil** es la aplicación móvil de NU-B Studio, la plataforma de e-commerce de arte huasteco regional. Su propósito es acercar el catálogo de obras, artistas y contenido del estudio al público desde el celular, para que cualquier persona descubra las obras, conozca a quienes las crean y prepare su compra.

La app cubre únicamente la **parte pública y del cliente**. No incluye funciones de administración ni de gestión para artistas. El **pago no se realiza dentro de la aplicación**: al finalizar la compra, la app redirige al usuario a la plataforma web, donde se completa el proceso.

### 2.1 Funcionalidades principales (MVP)

- Pantalla de inicio con obras destacadas y catálogo con filtros básicos
- Detalle de cada obra: imágenes, descripción, precio y artista
- Perfil de artista con su información y sus obras
- Colecciones temáticas de obras
- Blog con contenido editorial del estudio
- Registro, inicio de sesión y gestión básica de la cuenta
- Lista de favoritos
- Carrito de compras
- Redirección a la plataforma web para completar el pago
- Consulta del historial y estatus de pedidos

### 2.2 Fuera del alcance del MVP

Recuperación de contraseña por correo, verificación de email, vinculación con Alexa y la sección "Acerca de / Contacto". Se contemplan para una fase posterior.

### 2.3 Relación con la plataforma web

| Aspecto | Plataforma web | App móvil |
|---|---|---|
| Usuarios | Clientes, artistas y administradores | Solo clientes y visitantes |
| Catálogo, artistas, colecciones y blog | Sí | Sí |
| Favoritos y carrito | Sí | Sí |
| Pago | Sí, se procesa aquí | No, redirige a la web |
| Pedidos | Consulta y gestión | Solo consulta |
| Administración y gestión de obras | Sí | No |

Ambas plataformas comparten el mismo backend (Node.js en Render), la misma base de datos PostgreSQL y el mismo sistema de autenticación con JWT. Por eso un cliente usa la misma cuenta en las dos, y lo que hace en una (pedidos, favoritos) se refleja en la otra.

---

## 3. Backlog del producto (Historias de Usuario)

### HU-01: Inicio y catálogo

Como visitante, quiero ver obras destacadas al abrir la app y explorar el catálogo filtrando por categoría y precio, para encontrar piezas que se ajusten a mis gustos y presupuesto.

**Criterios de aceptación:**
- Se puede navegar sin haber iniciado sesión.
- La pantalla de inicio muestra obras destacadas y da acceso al catálogo completo.
- Los filtros se pueden combinar y limpiar, y si no hay resultados se muestra un mensaje claro.

### HU-02: Detalle de obra

Como visitante, quiero ver la información completa de una obra (imágenes, descripción, precio y artista), para decidir si me interesa comprarla.

**Criterios de aceptación:**
- Se pueden ver todas las imágenes de la obra.
- Desde el detalle se puede ir al perfil del artista.
- Hay botones para agregar la obra al carrito y a favoritos.

### HU-03: Perfil de artista

Como visitante, quiero conocer el perfil de un artista y ver sus obras, para conocer su trabajo y la cultura huasteca que representa.

**Criterios de aceptación:**
- Se muestra la información pública del artista.
- Se listan sus obras disponibles, cada una con enlace a su detalle.

### HU-04: Colecciones

Como visitante, quiero explorar las colecciones temáticas de obras, para descubrir piezas agrupadas por tema, técnica o región.

**Criterios de aceptación:**
- Se listan las colecciones disponibles.
- Cada colección muestra su descripción y sus obras, con enlace al detalle de cada una.

### HU-05: Blog

Como visitante, quiero leer las publicaciones del blog del estudio, para conocer más sobre el arte huasteco, sus artistas y sus tradiciones.

**Criterios de aceptación:**
- Se listan las publicaciones de la más reciente a la más antigua.
- Cada publicación se abre en su propia pantalla, con imágenes y texto.

### HU-06: Registro, inicio de sesión y cuenta

Como visitante, quiero crear una cuenta o iniciar sesión con mi correo y contraseña, y después gestionar mis datos, para usar la misma cuenta que en la plataforma web y mantenerla segura.

**Criterios de aceptación:**
- Las credenciales se validan contra el backend existente, y los errores (correo ya registrado, contraseña incorrecta) se muestran de forma clara.
- La sesión se conserva al cerrar y volver a abrir la app.
- Desde "Mi cuenta" se pueden ver los datos, cambiar la contraseña (pidiendo la actual) y cerrar sesión, lo que elimina el token guardado en el dispositivo.

### HU-07: Favoritos

Como cliente, quiero guardar obras en mis favoritos, para revisarlas después sin tener que buscarlas de nuevo.

**Criterios de aceptación:**
- Desde el detalle de una obra se puede agregar o quitar de favoritos.
- Hay una pantalla con la lista de favoritos.
- Si se intenta guardar sin sesión, la app pide iniciar sesión.

### HU-08: Carrito de compras

Como cliente, quiero agregar obras a mi carrito, revisarlo y quitar piezas, para preparar mi compra antes de pagar.

**Criterios de aceptación:**
- Se muestra el total actualizado.
- Si se intenta agregar al carrito sin sesión, la app pide iniciar sesión.

### HU-09: Finalizar compra en la web

Como cliente, quiero que al finalizar mi compra la app me lleve a la plataforma web con mi carrito listo, para completar el pago de forma segura sin volver a buscar las obras.

**Criterios de aceptación:**
- Al presionar "Finalizar compra" se abre la web en la sección de pago.
- El carrito de la app es el mismo que ve el usuario en la web.

### HU-10: Mis pedidos

Como cliente, quiero consultar mis pedidos y su estatus, para dar seguimiento a mis compras desde el celular.

**Criterios de aceptación:**
- Se listan los pedidos del cliente, incluidos los hechos en la web.
- Cada pedido muestra su estatus y su detalle.

---

## 4. Estimación con Planning Poker

Se utilizó la técnica de **Planning Poker** con la escala de Story Points **1, 2, 3, 5, 8, 13**. Los Story Points son una medida relativa de complejidad, esfuerzo e incertidumbre, no una equivalencia en horas.

Cada integrante votó de forma individual y los votos se revelaron al mismo tiempo. En las historias sin unanimidad, se discutieron las diferencias y se acordó el valor final.

| Historia | MishelGvea | Gustavo5B | SoraidaMedina | Final |
|---|---|---|---|---|
| HU-01 Inicio y catálogo | 5 | 5 | 3 | 5 |
| HU-02 Detalle de obra | 3 | 3 | 3 | 3 |
| HU-03 Perfil de artista | 3 | 2 | 3 | 3 |
| HU-04 Colecciones | 3 | 3 | 2 | 3 |
| HU-05 Blog | 2 | 2 | 1 | 2 |
| HU-06 Registro, inicio de sesión y cuenta | 8 | 8 | 5 | 8 |
| HU-07 Favoritos | 3 | 3 | 3 | 3 |
| HU-08 Carrito | 5 | 3 | 5 | 5 |
| HU-09 Finalizar compra en la web | 8 | 13 | 8 | 8 |
| HU-10 Mis pedidos | 3 | 2 | 3 | 3 |
| **Total** | | | | **43** |

### 4.1 Justificación de las estimaciones principales

- **HU-06 y HU-09 (8 puntos)** son las historias más complejas. La HU-06 reúne registro, inicio de sesión, sesión persistente con almacenamiento seguro del token y gestión de la cuenta. La HU-09 requiere que la plataforma web reconozca al usuario y su carrito al llegar desde la app, lo que puede implicar ajustes del lado web o del backend.
- **HU-01 y HU-08 (5 puntos)** combinan varias pantallas o requieren manejo de estado global con Context API.
- **HU-05 (2 puntos)** es la más simple, ya que solo consume un endpoint y muestra contenido.

> **Nota:** la estimación de la HU-09 asume que el carrito se guarda en el backend por usuario. Si se confirma que en la plataforma web el carrito vive solo en el navegador, esta historia deberá reestimarse.

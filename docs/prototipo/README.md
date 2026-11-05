# Prototipo navegable — NUB Studio (app móvil)

Prototipo interactivo en Figma para validar el flujo de la app con el cliente antes de programarla. Se construyó sobre el diseño en alta fidelidad (17 pantallas, 390 × 844 px) y tiene conectados los botones principales para simular el uso real de la aplicación.

## Enlace

[Abrir el prototipo en Figma](https://www.figma.com/proto/mYbOVr3TLsQBILyMKYtkyS/NUB-Studio-%E2%80%93-App-M%C3%B3vil.?node-id=1-423&starting-point-node-id=1%3A423&scaling=min-zoom&content-scaling=fixed&show-proto-sidebar=1&page-id=0%3A1)

- Punto de inicio: **Flujo principal** (empieza en el Splash).
- Se navega tocando los botones como en el teléfono. También se puede abrir desde la app móvil de Figma.

## Pantallas

Splash · Login · Registro · Inicio · Catálogo · Catálogo (ordenar) · Filtros · Detalle de obra · Perfil de artista · Colecciones · Blog · Publicación · Favoritos · Carrito · Finalizar compra · Mis pedidos · Mi cuenta.

![Pantallas del prototipo](pantallas_prototipo.png)

## Flujo de navegación

| Flujo | Recorrido |
| --- | --- |
| Primer ingreso | Splash → Login → Registro → Inicio |
| Exploración | Inicio → Catálogo → Ordenar / Filtros → Catálogo → Detalle de obra → Perfil de artista |
| Compra | Detalle de obra → Agregar al carrito → Carrito → Finalizar compra → **Pago en la plataforma web** → Mis pedidos |
| Contenido | Inicio → Blog → Publicación |
| Cuenta | Mi cuenta → Mis pedidos / Favoritos / Cerrar sesión → Login |

- **Rutas públicas** (sin iniciar sesión): Inicio, Catálogo, Filtros, Detalle de obra, Perfil de artista, Colecciones, Blog y Publicación.
- **Rutas con sesión:** Favoritos, Carrito, Finalizar compra, Mis pedidos y Mi cuenta.
- La barra inferior (Inicio, Catálogo, Favoritos, Carrito, Cuenta) y la flecha de regresar funcionan en todas las pantallas que las tienen.
- El pago **no se realiza dentro de la app** (HU-09 y [alcance del MVP](../ALCANCE_MVP.md)): en **Finalizar compra** el usuario confirma su pedido y el botón **CONTINUAR PAGO EN LA WEB** abre [nub-studio-front.vercel.app](https://nub-studio-front.vercel.app) con el mismo carrito. Por eso se eliminó la pantalla **Pago exitoso**: la confirmación del pago la muestra la web.

![Flujo de navegación](flujo_navegacion.png)

## Validación con el cliente

| Dato | Detalle |
| --- | --- |
| Fecha | Jueves 24 de septiembre de 2026, 8:00 p. m. aprox. |
| Modalidad | Llamada |
| Participantes | Samuel Trejo (cliente), Luis Gustavo Hernández, Mishel Govea y Soraida Medina (desarrolladores) |
| Resultado | El cliente aprobó el flujo y el diseño general, con dos ajustes menores |

### Observaciones del cliente

| # | Observación | Estado | Cómo se aplicó |
| --- | --- | --- | --- |
| 1 | Pulir los tipos de letra (aplicar las tipografías del UI Kit de forma consistente en todas las pantallas). | **Aplicado** | Los textos que usaban fuentes fuera del UI Kit (Nexa Extra Light en el título de Catálogo y en el cuerpo de la publicación del blog) se cambiaron a **Outfit**, y los tamaños fuera de escala (14.4, 25.2) se ajustaron a la escala del UI Kit. Los precios se mantienen en Outfit Bold en todas las pantallas. |
| 2 | Ajustar los menús desplegables. | **Aplicado** | Se diseñó el desplegable **Ordenar** del catálogo abierto (Recientes, Precio: menor a mayor, Precio: mayor a menor, Destacadas), con la opción elegida resaltada, y se conectó en el prototipo. |

### Ajustes de alcance

| Cambio | Motivo |
| --- | --- |
| **Finalizar compra** ya no captura datos de tarjeta: muestra el resumen del pedido, la dirección de envío, los métodos disponibles en la web y los pasos para completar el pago. | El pago se completa en la plataforma web (HU-09). |
| Se eliminó la pantalla **Pago exitoso** del flujo de la app. | La confirmación del pago ocurre en la web. |

Los ajustes se aplicaron en Figma antes de iniciar el desarrollo de las pantallas ([#29](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/29)).

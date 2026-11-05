# Notas de versión — NUB Studio (app móvil)

Este archivo resume qué trae cada versión publicada en Google Play.
El formato sigue el versionado semántico descrito en
[docs/branching-strategy.md](docs/branching-strategy.md).

## [1.0.0] — 2026-11-03

Primera versión publicada en Google Play (prueba cerrada, versionCode 3).

### Funciones para el cliente

- **Inicio y catálogo** (HU-01): obras recientes, colecciones y blog en Inicio;
  catálogo con búsqueda, filtros por categoría y precio, y orden.
- **Detalle de obra** (HU-02): imágenes, medidas, técnica, existencias y
  tarjeta del artista.
- **Perfil de artista** (HU-03) con todas sus obras.
- **Colecciones** (HU-04) y su detalle.
- **Blog** (HU-05): publicaciones, comentarios y respuestas; reportar
  comentarios de otras personas.
- **Cuenta** (HU-06): registro con verificación de correo, inicio de sesión,
  recuperar y cambiar la contraseña, datos personales.
- **Favoritos** (HU-07).
- **Carrito** (HU-08) con existencias y "Comprar ahora".
- **Finalizar compra** (HU-09) con dirección de envío y pago en Mercado Pago.
- **Mis pedidos** (HU-10) y su detalle.
- **Eliminar mi cuenta** desde Cuenta (derecho ARCO de Cancelación).
- Aviso de privacidad y Términos y condiciones dentro de la app, iguales a la web.

### Requisitos de Google Play

- Nombre "NUB Studio" e ícono de marca.
- Solo los permisos que la app usa (internet y estado de red).
- Espera de hasta 60 s cuando el servidor de Render está despertando.

### Calidad y entrega

- Arquitectura MVVM.
- Pipelines de CI y de release: análisis estático, seguridad, pruebas
  unitarias, integración, rendimiento y aceptación E2E con Maestro.
- Compilación con EAS Build: AAB para Play Store y APK de respaldo (perfil
  `preview`).

### Fuera de esta versión

Integradas en `develop` después de publicar la 1.0.0; saldrán en la siguiente
versión:

- Editar datos personales y preferencia de marketing (#127).
- Cierre de sesión automático cuando el token vence (#129).

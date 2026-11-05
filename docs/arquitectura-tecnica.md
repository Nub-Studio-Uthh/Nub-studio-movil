# Documento de Arquitectura Técnica — Nub-studio-movil

## 1. Objetivo

Registrar las decisiones técnicas tomadas para el proyecto de aplicación móvil de NU-B Studio, de forma que el equipo (MishelGvea, Gustavo5B, SoraidaMedina) tenga una referencia común y se eviten inconsistencias durante el desarrollo.

---

## 2. Stack Tecnológico

### Frontend (App móvil)

| Tecnología      | Elección                                    |
| ---------------- | -------------------------------------------- |
| Framework        | **React Native** con **Expo Go** |
| Navegación      | **React Navigation**                   |
| Manejo de estado | **Context API** (nativo de React)      |

**Justificación:** La plataforma web de NU-B Studio ya está desarrollada en React, por lo que se mantiene la misma línea tecnológica para aprovechar la experiencia ya adquirida por el equipo. Expo simplifica el desarrollo y las pruebas al no requerir configuración nativa compleja desde el inicio.

Se elige **Context API** para el manejo de estado por ser una solución incluida en React (sin dependencias adicionales) y adecuada para el tamaño y alcance del MVP. Si el estado de la aplicación crece en complejidad más adelante, se evaluará migrar a una librería como Zustand.

### Backend

| Aspecto        | Detalle                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------- |
| Backend        | **Reutilización del backend ya existente** de NU-B Studio (no se construye uno nuevo) |
| Tecnología    | Node.js                                                                                      |
| Despliegue     | Render                                                                                       |
| Tipo de API    | REST                                                                                         |
| Autenticación | JWT                                                                                          |

**Justificación:** El backend ya existe, está en producción y es el mismo que consume la plataforma web, lo que garantiza consistencia de datos entre ambas plataformas (web y móvil).

### Base de Datos

| Aspecto   | Detalle                                              |
| --------- | ---------------------------------------------------- |
| Motor     | PostgreSQL                                           |
| Instancia | La misma base de datos que utiliza la plataforma web |

**Justificación:** Al compartir la misma base de datos que la plataforma web, se evita duplicar información y se mantiene una única fuente de verdad para productos, usuarios y pedidos.

---

## 3. Estructura de Carpetas

El backend ya existe como proyecto independiente y desplegado; este repositorio (`Nub-studio-movil`) contiene únicamente el proyecto de la aplicación móvil (React Native + Expo).

```
Nub-studio-movil/
├── src/
│   ├── views/                    # View: lo que se ve en pantalla
│   │   ├── screens/              # Pantallas de la app, organizadas por dominio
│   │   │   ├── auth/
│   │   │   ├── catalog/
│   │   │   ├── cart/
│   │   │   └── profile/
│   │   └── components/           # Componentes reutilizables (botones, cards, inputs, skeletons)
│   │
│   ├── viewmodels/               # ViewModel: un hook por pantalla
│   │   ├── useLoginViewModel.js
│   │   ├── useCatalogViewModel.js
│   │   └── useCartViewModel.js
│   │
│   ├── models/                   # Model: datos y comunicación con la API
│   │   ├── api.js                # Configuración base y URL del backend
│   │   ├── authService.js
│   │   ├── obraService.js
│   │   ├── cartService.js
│   │   ├── AuthContext.js        # Estado global con Context API
│   │   └── CartContext.js
│   │
│   ├── hooks/                    # Hooks genéricos, sin lógica de una pantalla en particular
│   │   ├── useRemoteData.js
│   │   └── useDelayedLoading.js
│   │
│   ├── navigation/               # Configuración de React Navigation
│   │
│   ├── utils/                    # Funciones auxiliares (formateo, validaciones)
│   │
│   ├── constants/                 # Colores, tamaños, textos fijos del UI Kit
│   │
│   └── assets/                    # Imágenes, íconos, fuentes
│
├── App.js                        # Punto de entrada principal
├── app.json                      # Configuración de Expo
└── package.json
```

**Relación con el patrón MVVM:**

- **Model** → `models/` (servicios de la API y estado global con Context API)
- **View** → `views/screens/` + `views/components/`
- **ViewModel** → `viewmodels/` (un hook por pantalla que prepara los datos y las acciones para la vista)

`hooks/`, `utils/`, `constants/` y `navigation/` son apoyo y no pertenecen a una capa en particular.

Las pantallas se organizan **por dominio** (auth, catalog, cart, profile) para que cada módulo del negocio sea fácil de ubicar conforme crezca el proyecto.

---

## 4. Patrón de Arquitectura

Se utiliza el patrón **MVVM (Model-View-ViewModel)** adaptado al contexto de una aplicación React Native:

- **Model**: datos y comunicación con la API del backend (`models/`). No sabe nada de pantallas.
- **ViewModel**: un hook de React por pantalla (por ejemplo `useCatalogViewModel`). Pide los datos al Model y entrega a la vista el estado ya listo para mostrar (datos, `isLoading`, `error`) y las acciones (`reload`, `aplicar`, `limpiar`). No importa componentes ni recibe `navigation`, así que se puede probar sin dibujar la pantalla.
- **View**: pantallas y componentes visuales. Solo dibujan lo que les da su ViewModel, llaman a sus acciones cuando la persona usuaria toca algo y se encargan de la navegación y las alertas.

El enlace entre View y ViewModel lo hace React: cuando cambia el estado del ViewModel, la pantalla se vuelve a dibujar sola.

```
┌──────────────────────────┐
│ View                     │  views/screens/, views/components/
│ dibuja y navega          │
└──────┬────────────▲──────┘
       │ acciones   │ estado
       │ (reload,   │ (datos, isLoading,
       │  aplicar)  │  error)
┌──────▼────────────┴──────┐
│ ViewModel                │  viewmodels/useXxxViewModel.js
│ prepara datos y acciones │
└──────┬────────────▲──────┘
       │ llamadas   │ datos
┌──────▼────────────┴──────┐
│ Model                    │  models/ (servicios + contexto)
│ API y estado global      │
└──────┬───────────────────┘
       │ HTTP (REST) + JWT
       ▼
  API del backend
```

**Reglas:**

- Una pantalla solo importa de `viewmodels/` (además de `views/components/`, `constants/` y `utils/`). Nunca de `models/` ni de `hooks/`. ESLint lo revisa con la regla `no-restricted-imports` de `eslint.config.js`, así que `pnpm lint` falla si se rompe.
- Cada pantalla nueva lleva su propio ViewModel en `viewmodels/`, con el nombre `use<Pantalla>ViewModel`.
- La lógica que se repite entre varios ViewModels (por ejemplo, cargar datos con cancelación o retrasar el skeleton) vive en `hooks/`.

**Historial:** la app empezó con un MVC flexible (`screens/`, `components/`, `controllers/`, `services/`, `context/`). Se migró a MVVM en el issue #70 porque los hooks de React que exponen estado y acciones ya funcionaban como ViewModels, y separar un ViewModel por pantalla permite probar la lógica sin la interfaz.

### 4.1 Patrones de diseño aplicados

Además de MVVM, el código usa cuatro patrones de diseño. No se agregaron clases extra para "tener" el patrón: cada uno resuelve un problema concreto de la app.

| Patrón | Tipo | Dónde está | Qué problema resuelve |
| --- | --- | --- | --- |
| **Repository** | Estructural | `src/models/*Service.js` (`obraService`, `coleccionService`, `favoritoService`, `carritoService`, `pedidoService`, `authService`…) | Los ViewModels piden datos (`getObras`, `agregarFavorito`) sin saber la URL, el método HTTP ni la forma de la respuesta del backend. |
| **Singleton** | Creacional | `src/models/api.js` · `AuthProvider` en `src/models/AuthContext.js` | Hay **un solo** cliente HTTP con la URL base, el tiempo de espera, el token Bearer y los mensajes de error, y **una sola** sesión para toda la app. |
| **Factory** | Creacional | Funciones `normalizar*` de `src/utils/` (`normalizarObra`, `normalizarColeccion`, `normalizarPost`, `normalizarFavorito`…) · clase `ApiError` | Construyen los objetos del modelo que usa la app a partir de la respuesta cruda del backend, siempre con la misma forma y valores por defecto. |
| **Observer** | De comportamiento | `AuthContext` y `CatalogFiltersContext` (Context API) · `navigation.addListener('focus')` · `AppState.addEventListener` | Las pantallas se suscriben a un estado o a un evento y se actualizan solas cuando cambia, sin que nadie las llame directamente. |

**Repository.** Cada archivo `*Service.js` es el repositorio de un dominio. Por ejemplo, `getObras(filtros)` en `obraService.js` arma los parámetros, llama a `GET /api/obras` y regresa `{ items, total, page, totalPages }` ya normalizado. Si el backend cambia una ruta o un campo, solo se toca el servicio; los ViewModels y las pantallas no cambian. En las pruebas unitarias se reemplaza el servicio con `jest.mock` (por ejemplo en `tests/unit/viewmodels/`) para probar la lógica sin red.

**Singleton.** `api.js` es un módulo de JavaScript: se evalúa una sola vez y todas las importaciones comparten la misma instancia de `request`, `apiGet`, `apiPost`, `apiPut` y `apiDelete`. Ahí vive en un solo lugar la configuración del cliente HTTP (`EXPO_PUBLIC_API_URL`, 15 s de tiempo de espera, cabecera `Authorization: Bearer`). De la misma forma, `AuthProvider` se monta una sola vez en `App.js` y guarda la única sesión de la app (token y usuario en `expo-secure-store`); cualquier parte la obtiene con `useAuth()`.

**Factory.** Las funciones `normalizar*` reciben un registro del backend (con nombres como `id_obra`, `precio_base`, `artista_alias`) y fabrican el objeto que usa la app (`id`, `precio`, `artista`), con conversiones y valores por defecto. Por ejemplo, `normalizarObra` toma `precio_minimo` (o `precio_base` si no hay) y solo marca una oferta cuando `precio_oferta` es menor que ese precio. Los servicios nunca pasan datos crudos a los ViewModels. Los errores también se crean en un solo lugar: `request()` en `api.js` fabrica un `ApiError` con un mensaje listo para mostrarse y el código HTTP.

**Observer.** Con Context API, `AuthProvider` y `CatalogFiltersProvider` son los sujetos y cada pantalla o ViewModel que llama a `useAuth()` o `useCatalogFilters()` es un observador: cuando la persona inicia o cierra sesión, o aplica filtros, React vuelve a dibujar solo a quienes están suscritos. También se usa para eventos: Carrito, Favoritos y Pedidos se suscriben a `navigation.addListener('focus')` para recargar al volver a la pestaña, y Finalizar compra escucha `AppState` para saber cuándo la persona regresa del navegador. En todos los casos la suscripción se cancela al salir de la pantalla (`unsubscribe` / `sub.remove()`).

---

## 5. Diagrama de Arquitectura General

```
┌─────────────────────┐
│   App Móvil          │
│   (React Native +    │
│    Expo Go)           │
└──────────┬───────────┘
           │  Peticiones HTTP (REST)
           │  Autenticación JWT
           ▼
┌─────────────────────┐
│   Backend             │
│   (Node.js)            │
│   Desplegado en Render │
└──────────┬───────────┘
           │
           ▼
┌─────────────────────┐
│   Base de Datos        │
│   (PostgreSQL)          │
│   Compartida con la     │
│   plataforma web        │
└─────────────────────┘
```

La app móvil consume la misma API REST que utiliza la plataforma web de NU-B Studio, garantizando que ambas plataformas trabajen sobre la misma información en todo momento.

> **Importante:** la aplicación móvil **no se conecta directamente a la base de datos** en ningún momento. Toda comunicación con PostgreSQL ocurre exclusivamente del lado del backend (Node.js en Render). La app móvil únicamente realiza peticiones HTTP a los endpoints ya expuestos por ese backend (mediante la carpeta `models/`), sin manejar cadenas de conexión, credenciales de base de datos, ni lógica de acceso a datos dentro del proyecto móvil.

---

## 6. Consideraciones adicionales

- Al ser un MVP desarrollado por un equipo de 3 personas, se prioriza mantener el código organizado sin sobre-diseñar la arquitectura.
- Cualquier cambio relevante en el stack o la arquitectura aquí definida deberá documentarse actualizando este archivo, para mantenerlo como referencia vigente del proyecto.

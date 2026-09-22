
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
│   ├── screens/                # Pantallas de la app (Views), organizadas por dominio
│   │   ├── auth/
│   │   ├── catalog/
│   │   ├── cart/
│   │   └── profile/
│   │
│   ├── components/             # Componentes reutilizables (botones, cards, inputs)
│   │
│   ├── navigation/              # Configuración de React Navigation
│   │
│   ├── services/                # Comunicación con la API (Model)
│   │   ├── api.js               # Configuración base y URL del backend
│   │   ├── authService.js
│   │   ├── productService.js
│   │   └── cartService.js
│   │
│   ├── context/                 # Estado global con Context API
│   │   ├── AuthContext.js
│   │   └── CartContext.js
│   │
│   ├── controllers/              # Lógica intermedia (Controller) - hooks personalizados
│   │   ├── useAuth.js
│   │   ├── useProducts.js
│   │   └── useCart.js
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

**Relación con el patrón MVC:**

- **Model** → `services/` (comunicación con la API) + `context/` (estado)
- **View** → `screens/` + `components/`
- **Controller** → `controllers/` (hooks que conectan vistas con servicios/contexto)

Las pantallas se organizan **por dominio** (auth, catalog, cart, profile) para que cada módulo del negocio sea fácil de ubicar conforme crezca el proyecto.

---

## 4. Patrón de Arquitectura

Se utiliza el patrón **MVC (Model-View-Controller)** adaptado al contexto de una aplicación React Native:

- **Model**: lógica de datos y comunicación con la API del backend
- **View**: pantallas y componentes visuales (UI)
- **Controller**: lógica intermedia que conecta las vistas con los modelos/datos (hooks, funciones de manejo de eventos)

La separación de capas se mantendrá de forma **flexible y no estricta**, priorizando la simplicidad y velocidad de desarrollo propias de un MVP, sin dejar de mantener una organización clara del código.

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

> **Importante:** la aplicación móvil **no se conecta directamente a la base de datos** en ningún momento. Toda comunicación con PostgreSQL ocurre exclusivamente del lado del backend (Node.js en Render). La app móvil únicamente realiza peticiones HTTP a los endpoints ya expuestos por ese backend (mediante la carpeta `services/`), sin manejar cadenas de conexión, credenciales de base de datos, ni lógica de acceso a datos dentro del proyecto móvil.

---

## 6. Consideraciones adicionales

- Al ser un MVP desarrollado por un equipo de 3 personas, se prioriza mantener el código organizado sin sobre-diseñar la arquitectura.
- Cualquier cambio relevante en el stack o la arquitectura aquí definida deberá documentarse actualizando este archivo, para mantenerlo como referencia vigente del proyecto.

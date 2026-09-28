
# Nub-studio-movil

Aplicación móvil de **NU-B Studio**, la plataforma de e-commerce de arte huasteco regional. La app acerca al público el catálogo de obras, los perfiles de artistas, las colecciones y el blog del estudio, y permite preparar una compra desde el celular.

La app cubre solo la parte **pública y del cliente**. No incluye funciones de administración ni de gestión para artistas. El **pago no se procesa en la app**: al finalizar la compra, el usuario es redirigido a la plataforma web.

> Este repositorio contiene **únicamente la app móvil**. El backend ya existe, es el mismo que usa la plataforma web y vive en su propio repositorio.

---

## Stack tecnológico

| Área               | Tecnología                                                                         |
| ------------------- | ----------------------------------------------------------------------------------- |
| Lenguaje            | JavaScript                                                                          |
| Framework           | React Native con Expo                                                               |
| Navegación         | React Navigation                                                                    |
| Estado global       | Context API                                                                         |
| Arquitectura        | MVC flexible (ver[Estructura de carpetas](#estructura-de-carpetas))                  |
| Backend (consumido) | API REST en Node.js, desplegada en Render                                           |
| Autenticación      | JWT                                                                                 |
| Base de datos       | PostgreSQL (compartida con la web;**la app nunca se conecta directo a ella**) |

---

## Requisitos previos

- **Node.js** en versión LTS (20 o superior). Verifica con `node -v`.
- **pnpm** como gestor de paquetes. La forma más sencilla de instalarlo es con Corepack, que ya viene con Node:

  ```bash
  corepack enable
  pnpm -v
  ```

  > El proyecto usa **solo pnpm**. No uses `npm install` ni `yarn`, porque generan otro archivo de bloqueo y las dependencias pueden quedar distintas entre integrantes. El archivo que se versiona es `pnpm-lock.yaml`.
  >
- **Git**.
- **Expo Go** instalado en tu celular Android ([Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)).
- Acceso al repositorio privado dentro de la organización **Nub-Studio-Uthh**, con **2FA activado** en tu cuenta de GitHub.
- *(Opcional)* **Android Studio** con el Android SDK y un emulador. Solo se necesita si quieres probar en emulador en lugar de tu celular; para trabajar con Expo Go no hace falta.

---

## Cómo correr el proyecto en local

1. **Clona el repositorio y cámbiate a `develop`**

   ```bash
   git clone https://github.com/Nub-Studio-Uthh/Nub-studio-movil.git
   cd Nub-studio-movil
   git checkout develop
   ```

   > Todo el trabajo nace de `develop`, nunca de `main`.
   >
2. **Instala las dependencias**

   ```bash
   pnpm install
   ```
3. **Configura las variables de entorno**

   Copia el archivo de ejemplo y completa los valores:

   ```bash
   cp .env.example .env
   ```

   | Variable                | Descripción                                      |
   | ----------------------- | ------------------------------------------------- |
   | `EXPO_PUBLIC_API_URL` | URL base del backend de NU-B Studio               |
   | `EXPO_PUBLIC_WEB_URL` | URL de la plataforma web (para redirigir al pago) |


   > El archivo `.env` **no se sube al repositorio**. Pide los valores al equipo.
   >
4. **Inicia el servidor de desarrollo**

   ```bash
   pnpm expo start
   ```
5. **Abre la app**

   - **En tu celular:** escanea el código QR con Expo Go. El celular y la computadora deben estar en la **misma red Wi-Fi**.
   - **En emulador:** con el emulador abierto, presiona `a` en la terminal.

### Problemas comunes

| Problema                                       | Solución                                                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| El QR no conecta o se queda cargando           | Usa`pnpm expo start --tunnel` (útil en redes escolares o con restricciones)                     |
| Errores raros después de cambiar de rama      | Limpia la caché con`pnpm expo start -c`                                                         |
| Faltan dependencias después de un`git pull` | Vuelve a correr`pnpm install`                                                                    |
| Aparece un`package-lock.json` en tus cambios | Alguien corrió`npm install` por error. Bórralo, no lo subas y vuelve a correr `pnpm install` |
| Necesitas agregar una librería de Expo        | Usa`pnpm expo install nombre-libreria`, que elige la versión compatible con el SDK              |

---

## Estructura de carpetas

> **Nota:** la siguiente estructura es un **ejemplo de referencia** basado en la arquitectura definida para el proyecto. Los archivos y subcarpetas que se muestran (por ejemplo, `useCart.js` o `CartContext`) son ilustrativos y pueden variar conforme avance el desarrollo. Lo que sí se mantiene es la separación por capas: vistas en `screens/` y `components/`, lógica en `controllers/`, y datos y estado en `services/` y `context/`.

```
Nub-studio-movil/
├── src/
│   ├── screens/        # View: pantallas organizadas por dominio
│   │   ├── auth/
│   │   ├── catalog/
│   │   ├── cart/
│   │   └── profile/
│   ├── components/     # View: componentes reutilizables (botones, cards, inputs)
│   ├── navigation/     # Configuración de React Navigation
│   ├── controllers/    # Controller: hooks personalizados (useAuth, useProducts, useCart)
│   ├── context/        # Model: estado global (AuthContext, CartContext)
│   ├── services/       # Model: comunicación con la API (api.js y un servicio por recurso)
│   ├── utils/          # Funciones auxiliares (formateo, validaciones)
│   ├── constants/      # Colores, tamaños y textos del UI Kit
│   └── assets/         # Imágenes, íconos y fuentes
├── App.js              # Punto de entrada
├── app.json            # Configuración de Expo
└── package.json
```

---

## Cómo contribuir

Antes de hacer tu primer cambio, lee la **[Guía de contribución](./CONTRIBUTING.md)**. En resumen:

- **Ramas:** `prefijo/numero-issue-descripcion`, por ejemplo `feature/15-carrito-compras`. Se crean desde el issue con *Create a branch*.
- **Commits:** Conventional Commits con descripción en español y número de issue, por ejemplo `feat: agregar login de usuario (#15)`.
- **Pull requests:** siempre hacia `develop`, con `Closes #numero` y al menos 1 aprobación.

Documentación adicional:

- [Estrategia de branching y versionado](./docs/branching-strategy.md)
- [Arquitectura técnica](./docs/arquitectura-tecnica.md)
- [Backlog e historias de usuario](./docs/backlog-historias-usuario.md)

---

## Tablero del proyecto

Las tareas se gestionan con Scrumban en GitHub Projects:

**[Nub-studio-movil — Scrumban](https://github.com/orgs/Nub-Studio-Uthh/projects/NUMERO)**

---

## Equipo

| Integrante                         | GitHub                                            |
| ---------------------------------- | ------------------------------------------------- |
| Guadalupe Mishel Hernández Govea  | [@MishelGvea](https://github.com/MishelGvea)       |
| Luis Gustavo Hernández Hernández | [@Gustavo5B](https://github.com/Gustavo5B)         |
| Soraida Medina Bautista            | [@SoraidaMedina](https://github.com/SoraidaMedina) |

Proyecto desarrollado para la asignatura **Desarrollo Móvil Integral** (UTHH, 10° "A").

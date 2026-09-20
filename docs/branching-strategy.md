# Estrategia de Branching y Versionado — Nub-studio-movil

## 1. Objetivo

Este documento establece cómo el equipo organiza las ramas de trabajo y nombra las versiones de la aplicación, con el fin de mantener consistencia conforme crezca el desarrollo del proyecto.

---

## 2. Estrategia de branching: Git Flow

Se utiliza **Git Flow** como estrategia de trabajo, ya que el proyecto tendrá releases controlados hacia Google Play Store y se necesita un espacio de integración antes de publicar cambios en producción.

### 2.1 Ramas principales

| Rama | Propósito |
|---|---|
| `main` | Código en producción. Solo contiene versiones estables ya publicadas o listas para publicarse en Play Store. Nunca se trabaja directo aquí. |
| `develop` | Rama de integración. Aquí se juntan todas las funcionalidades terminadas antes de pasar a producción. Es la "base" desde la que se crean las features. |

### 2.2 Ramas de apoyo

| Rama | Se crea desde | Se mergea a | Cuándo se usa |
|---|---|---|---|
| `feature/nombre-funcionalidad` | `develop` | `develop` | Para desarrollar una nueva funcionalidad o tarea (incluye código, diseño implementado, documentación) |
| `fix/nombre-del-bug` | `develop` | `develop` | Para corregir errores detectados durante el desarrollo (no en producción) |
| `release/x.x.x` | `develop` | `main` y `develop` | Cuando `develop` ya tiene todo lo necesario para una nueva versión y se va a preparar el release |
| `hotfix/nombre-del-problema` | `main` | `main` y `develop` | Para corregir un error urgente ya detectado en producción, sin esperar al siguiente release |
| `docs/nombre-del-documento` | `develop` | `develop` | Para tareas de documentación (igual que feature, pero identifica claramente que no es código funcional) |

### 2.3 Convención de nombres

- Usar minúsculas y guiones medios (`-`), sin espacios ni acentos
- El nombre debe describir brevemente el contenido de la rama

**Ejemplos:**
```
feature/carrito-de-compras
feature/login-usuario
fix/boton-agregar-carrito
docs/guia-contribucion
release/1.1.0
hotfix/crash-al-abrir-app
```

### 2.4 Flujo de trabajo básico

1. Crear la rama correspondiente desde `develop` (o desde `main` en caso de `hotfix`)
2. Trabajar y hacer commits siguiendo la convención de mensajes (ver Guía de Contribución)
3. Abrir un Pull Request hacia `develop`
4. Esperar al menos 1 aprobación de revisión
5. Mergear y eliminar la rama una vez integrada
6. Cuando `develop` esté listo para publicarse, se crea una rama `release/x.x.x`, se prueba, y se mergea tanto a `main` como de vuelta a `develop`

---

## 3. Esquema de versionado: Versionado Semántico (SemVer)

Se utiliza el formato **`MAJOR.MINOR.PATCH`** (ejemplo: `1.4.2`) para nombrar cada versión publicada de la app.

### 3.1 Cuándo subir cada número

| Nivel | Cuándo se incrementa | Ejemplos |
|---|---|---|
| **MAJOR** | Cambios que rompen compatibilidad o representan un cambio estructural/rediseño importante | Rediseño completo de la app, cambio de arquitectura, cambio de sistema de autenticación |
| **MINOR** | Se agrega una funcionalidad nueva, sin romper lo que ya existía | Nueva pantalla, sistema de notificaciones, nuevo método de pago |
| **PATCH** | Corrección de bugs o ajustes menores, sin agregar funcionalidad nueva | Arreglo de un botón que no respondía, corrección de texto, ajuste visual menor |

### 3.2 Regla práctica de decisión

Al preparar un release, preguntarse en orden:
1. ¿Rompe algo existente o es un cambio estructural grande? → **MAJOR**
2. ¿Agrega algo nuevo que el usuario no tenía? → **MINOR**
3. ¿Solo corrige o ajusta algo que ya existía? → **PATCH**

### 3.3 Punto de partida

La aplicación inicia en la versión **`1.0.0`** al momento de su primera publicación en Google Play Store.

### 3.4 Ejemplo de progresión

| Versión | Descripción del cambio |
|---|---|
| `1.0.0` | Primera publicación en Play Store (MVP) |
| `1.1.0` | Se agrega sistema de notificaciones |
| `1.1.1` | Se corrige bug de notificaciones duplicadas |
| `1.2.0` | Se agrega método de pago adicional |
| `2.0.0` | Rediseño completo de la app |

---

## 4. Relación con GitHub Projects

- Cada rama `feature/`, `fix/` o `docs/` debe crearse vinculada a su issue correspondiente en el tablero **Nub-studio-movil — Scrumban**, usando la opción "Create a branch" desde el issue
- Al abrir el Pull Request, este debe referenciar el issue que resuelve (ej. `Closes #9`) para que se cierre automáticamente al mergear

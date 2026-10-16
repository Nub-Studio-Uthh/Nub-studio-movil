
# Guía de Contribución — Nub-studio-movil

## 1. Objetivo

Este documento establece reglas claras de colaboración para que los tres integrantes del equipo (MishelGvea, Gustavo5B, SoraidaMedina) trabajen de forma ordenada dentro del mismo repositorio.

---

## 2. Convención de nombres de branches

Se utilizan los prefijos definidos en la estrategia de Git Flow del proyecto:

| Prefijo      | Uso                                                     |
| ------------ | ------------------------------------------------------- |
| `feature/` | Desarrollo de una nueva funcionalidad                   |
| `fix/`     | Corrección de errores detectados durante el desarrollo |
| `docs/`    | Tareas de documentación                                |
| `release/` | Preparación de una nueva versión antes de publicarse  |
| `hotfix/`  | Corrección urgente de un error en producción          |

**Reglas de formato:**

- El nombre debe incluir el número del issue relacionado: `prefijo/numero-descripcion-breve`
- Se usan **guiones medios (`-`)** para separar palabras, nunca guiones bajos ni espacios
- Todo el nombre debe estar en **minúsculas**

**Ejemplos:**

```
feature/15-carrito-compras
fix/22-boton-login-no-responde
docs/8-guia-contribucion
release/1.1.0
hotfix/30-crash-al-abrir-app
```

---

## 3. Formato de mensajes de commit

Se sigue el estándar **Conventional Commits**, con el prefijo en **inglés** y la descripción en **español**.

**Formato:**

```
tipo: descripción breve del cambio (#numero-de-issue)
```

**Tipos permitidos:**

| Tipo          | Cuándo usarlo                                                        |
| ------------- | --------------------------------------------------------------------- |
| `feat:`     | Nueva funcionalidad                                                   |
| `fix:`      | Corrección de un bug                                                 |
| `docs:`     | Cambios en documentación                                             |
| `style:`    | Cambios de formato que no afectan la lógica (espacios, indentación) |
| `refactor:` | Cambios en el código que no agregan funcionalidad ni corrigen bugs   |
| `test:`     | Agregar o modificar pruebas                                           |
| `chore:`    | Tareas de mantenimiento, configuración, dependencias                 |

**Reglas:**

- Es **obligatorio** referenciar el número de issue relacionado en el mensaje
- El mensaje debe describir claramente qué se hizo — se prioriza claridad sobre brevedad estricta

**Ejemplos:**

```
feat: agregar login de usuario (#15)
fix: corregir boton de carrito que no respondia (#22)
docs: agregar guia de contribucion del equipo (#8)
```

---

## 4. Proceso para abrir un Pull Request

- El PR debe abrirse de la rama de trabajo hacia **`develop`** (nunca directo a `main`, salvo `release/` y `hotfix/`)
- La descripción debe explicar claramente **qué se hizo** — mientras esté bien descrito, no hay una plantilla estricta obligatoria
- Es **obligatorio** usar la palabra clave `Closes #numero` para vincular el PR con su issue correspondiente
- **Antes de pedir revisión**, el autor debe asegurarse de que la rama esté actualizada con `develop` y **sin conflictos** — se resuelven conflictos primero, y hasta entonces se solicita revisión
- **Asignación de revisor**: es **rotativa** entre los tres integrantes, para que todos revisen código de los demás por igual

---

## 5. Reglas de revisión antes de mergear

- Se requiere **mínimo 1 aprobación** de cualquiera de los otros dos integrantes
- Si el revisor solicita cambios, se considera resuelto cuando esa misma persona revisa nuevamente y aprueba — con eso se cumple el requisito de la aprobación
- **Tiempo de respuesta**: la revisión no debe esperarse por mucho tiempo — si no hay respuesta pronta, se le da seguimiento directo a la persona asignada como revisora
- **Merge a `main`**: lo realiza únicamente MishelGvea, con autorización previa de los otros dos integrantes
- **Merge a `develop`**: puede hacerlo el autor del PR una vez obtenida la aprobación requerida

---

## 6. Trabajo en paralelo sobre una misma tarea

- Por regla general, cada issue lo trabaja una sola persona
- Solo se trabaja un mismo issue entre dos o más personas cuando así se decide explícitamente en equipo

---

## 7. Frecuencia de integración a develop

- Se mergea a `develop` al **terminar cada tarea/issue completo**, no se dejan ramas de trabajo abiertas por periodos largos sin integrar

---

## 8. Gestión de ramas después del merge

- Las ramas **no se eliminan** después de mergearlas: se conservan como historial de cada issue y de cada Pull Request
- En Settings → General → Pull Requests está desactivada la opción "Automatically delete head branches" y solo está permitido **"Allow merge commits"** (squash y rebase desactivados), para que el merge conserve todos los commits de la rama
- Después de mergear **no** se presiona "Delete branch" en el Pull Request
- Si una rama se borra por error, se recupera con el botón **"Restore branch"** al final de su Pull Request

---

## 9. Compromiso del equipo

Este documento fue revisado y acordado por los tres integrantes del equipo (MishelGvea, Gustavo5B, SoraidaMedina), quienes se comprometen a seguir estas reglas durante el desarrollo del proyecto Nub-studio-movil.

# Resultados de las pruebas funcionales manuales (#47)

Ejecución de los casos de [PLAN_DE_PRUEBAS.md](../PLAN_DE_PRUEBAS.md) sobre la app
publicada, repartidos entre los tres integrantes.

| Dato | Valor |
| --- | --- |
| App probada | Versión 1.0.0 (prueba cerrada de Google Play / APK del release v1.0.0) |
| Backend | El de producción que usa la app publicada |
| Casos | 55: HU-01 a HU-10, requisitos de Google Play y no funcionales |
| Fecha | 10 de noviembre de 2026 |
| Responsables | SoraidaMedina, MishelGvea y Gustavo5B |

## 1. Resumen

Se ejecutaron los **55 casos** del plan: **54 se aprobaron** y **1 falló**, el
**CP-01-04 (Combinar filtros)**, de prioridad Alta. El error estaba en el backend y
**ya fue corregido** ([#151](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/151)).
No hubo casos bloqueados.

| Historia | Casos | Aprobados | Fallidos | Responsable |
| --- | :-: | :-: | :-: | --- |
| HU-01 Inicio y catálogo | 8 | 7 | 1 (corregido) | SoraidaMedina |
| HU-02 Detalle de obra | 5 | 5 | 0 | SoraidaMedina |
| HU-03 Perfil de artista | 2 | 2 | 0 | SoraidaMedina |
| HU-04 Colecciones | 2 | 2 | 0 | SoraidaMedina |
| HU-05 Blog | 5 | 5 | 0 | MishelGvea |
| HU-06 Registro, sesión y cuenta | 10 | 10 | 0 | MishelGvea |
| HU-07 Favoritos | 3 | 3 | 0 | MishelGvea |
| HU-08 Carrito | 4 | 4 | 0 | Gustavo5B |
| HU-09 Finalizar compra | 4 | 4 | 0 | Gustavo5B |
| HU-10 Mis pedidos | 3 | 3 | 0 | Gustavo5B |
| Requisitos de Google Play | 5 | 5 | 0 | Gustavo5B |
| No funcionales | 4 | 4 | 0 | Los tres |
| **Total** | **55** | **54** | **1 (corregido)** | |

## 2. Fallo encontrado: CP-01-04 · Combinar filtros

| Campo | Detalle |
| --- | --- |
| Issue | [#151](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/151) bug(CP-01-04): el filtro de precio no muestra obras sin tamaños registrados |
| Prioridad | Alta |
| Pasos | Catálogo → Filtros → categoría Fotografía → precio mínimo $2,150 → Aplicar |
| Resultado esperado | Se muestran las obras de Fotografía con precio de $2,150 o más |
| Resultado obtenido | "No hay obras con esos filtros" (0 obras). Solo con la categoría, sin precio, las obras sí aparecían |
| Estado | ✅ **Corregido** en el backend |

### Causa

Cada obra muestra como precio el de sus tamaños registrados o, si no tiene tamaños, su
precio base. Pero el filtro de precio del backend
(`Nub_studio_back/src/controllers/obrasController.js`) solo revisaba la tabla
`obras_tamaños`, así que las obras **sin tamaños** nunca pasaban el filtro de precio,
aunque su precio estuviera dentro del rango.

Se confirmó con una consulta de solo lectura en la base: las obras publicadas de
Fotografía no tienen ningún tamaño activo.

| id_obra | Obra | Precio base | Tamaños |
| :-: | --- | --: | :-: |
| 44 | De camino a mi departamento en Chapul | $1,600.00 | 0 |
| 43 | Sierra Alta | $2,000.00 | 0 |
| 37 | Puesto de comida en … | $2,100.00 | 0 |

### Corrección

El filtro ahora usa la misma regla que el precio que se muestra en el catálogo:

- **Obra con tamaños:** aparece si alguno de sus tamaños está dentro del rango (igual que antes).
- **Obra sin tamaños:** aparece si su precio base está dentro del rango (antes nunca aparecía).

El cambio está en la función `condicionPrecio()` de `obrasController.js` y se aplica al
listado y al conteo de obras. Corrige el filtro en la app móvil y en la web, porque las dos
usan el mismo endpoint (`GET /api/obras`). La app móvil no necesitó cambios.

### Verificación de la corrección

- **Pruebas unitarias del backend:** 6 pruebas nuevas del filtro de precio
  (`tests/unit/obrasFiltroPrecio.test.js`): solo mínimo, solo máximo, ambos, junto con
  categoría y en el conteo. La suite completa pasa: 94 de 94.
- **PostgreSQL real** (entorno temporal de pruebas, no producción): con una obra sin
  tamaños, el filtro anterior la excluía y el corregido la muestra; si su precio está fuera
  del rango, sigue sin aparecer.
- **Colección de Postman de la app (#46):** 56 peticiones y 200 comprobaciones contra el
  backend corregido, sin fallas.

Cuando la corrección esté desplegada en el servidor, el caso CP-01-04 se vuelve a ejecutar
en la app publicada como parte de la regresión (#58).

## 3. Resultados por caso

| ID | Caso | Resultado | Responsable |
| --- | --- | --- | --- |
| CP-01-01 | Entrar sin cuenta | Aprobado | SoraidaMedina |
| CP-01-02 | Contenido de Inicio | Aprobado | SoraidaMedina |
| CP-01-03 | Filtrar por categoría | Aprobado | SoraidaMedina |
| CP-01-04 | Combinar filtros | ❌ Fallido → ✅ corregido ([#151](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/151)) | SoraidaMedina |
| CP-01-05 | Limpiar filtros | Aprobado | SoraidaMedina |
| CP-01-06 | Sin resultados | Aprobado | SoraidaMedina |
| CP-01-07 | Buscar | Aprobado | SoraidaMedina |
| CP-01-08 | Ordenar | Aprobado | SoraidaMedina |
| CP-02-01 | Abrir el detalle | Aprobado | SoraidaMedina |
| CP-02-02 | Ver todas las imágenes | Aprobado | SoraidaMedina |
| CP-02-03 | Ir al perfil del artista | Aprobado | SoraidaMedina |
| CP-02-04 | Botones de compra y favorito | Aprobado | SoraidaMedina |
| CP-02-05 | Límite de existencias | Aprobado | SoraidaMedina |
| CP-03-01 | Información del artista | Aprobado | SoraidaMedina |
| CP-03-02 | Obras del artista | Aprobado | SoraidaMedina |
| CP-04-01 | Lista de colecciones | Aprobado | SoraidaMedina |
| CP-04-02 | Detalle de colección | Aprobado | SoraidaMedina |
| CP-05-01 | Lista del blog | Aprobado | MishelGvea |
| CP-05-02 | Abrir publicación | Aprobado | MishelGvea |
| CP-05-03 | Comentar sin sesión | Aprobado | MishelGvea |
| CP-05-04 | Comentar y responder | Aprobado | MishelGvea |
| CP-05-05 | Borrar comentario propio | Aprobado | MishelGvea |
| CP-06-01 | Validaciones de registro | Aprobado | MishelGvea |
| CP-06-02 | Registro con verificación | Aprobado | MishelGvea |
| CP-06-03 | Correo ya registrado | Aprobado | MishelGvea |
| CP-06-04 | Iniciar sesión | Aprobado | MishelGvea |
| CP-06-05 | Contraseña incorrecta | Aprobado | MishelGvea |
| CP-06-06 | La sesión se conserva | Aprobado | MishelGvea |
| CP-06-07 | Ver datos en Cuenta | Aprobado | MishelGvea |
| CP-06-08 | Recuperar contraseña | Aprobado | MishelGvea |
| CP-06-09 | Cambiar contraseña | Aprobado | MishelGvea |
| CP-06-10 | Cerrar sesión | Aprobado | MishelGvea |
| CP-07-01 | Favorito sin sesión | Aprobado | MishelGvea |
| CP-07-02 | Agregar y quitar favorito | Aprobado | MishelGvea |
| CP-07-03 | Pantalla de favoritos | Aprobado | MishelGvea |
| CP-08-01 | Carrito sin sesión | Aprobado | Gustavo5B |
| CP-08-02 | Agregar y ver el total | Aprobado | Gustavo5B |
| CP-08-03 | Quitar una obra | Aprobado | Gustavo5B |
| CP-08-04 | Carrito vacío | Aprobado | Gustavo5B |
| CP-09-01 | Pagar desde el carrito | Aprobado | Gustavo5B |
| CP-09-02 | Comprar ahora | Aprobado | Gustavo5B |
| CP-09-03 | Dirección incompleta | Aprobado | Gustavo5B |
| CP-09-04 | Mismo carrito en la web | Aprobado | Gustavo5B |
| CP-10-01 | Lista de pedidos | Aprobado | Gustavo5B |
| CP-10-02 | Detalle de pedido | Aprobado | Gustavo5B |
| CP-10-03 | Sin pedidos | Aprobado | Gustavo5B |
| CP-GP-01 | Eliminar mi cuenta | Aprobado | Gustavo5B |
| CP-GP-02 | Eliminar con contraseña incorrecta | Aprobado | Gustavo5B |
| CP-GP-03 | Reportar un comentario | Aprobado | Gustavo5B |
| CP-GP-04 | Aviso de privacidad y términos | Aprobado | Gustavo5B |
| CP-GP-05 | Permisos de la app | Aprobado | Gustavo5B |
| CP-NF-01 | Servidor dormido | Aprobado | Gustavo5B |
| CP-NF-02 | Sin internet | Aprobado | Gustavo5B |
| CP-NF-03 | Fluidez del catálogo | Aprobado | SoraidaMedina |
| CP-NF-04 | Pantallas chicas | Aprobado | MishelGvea |

## 4. Conclusión

La app cumple los casos del plan de pruebas: **54 de 55 se aprobaron en la primera
ejecución** y el único fallo, en el filtro de precio del catálogo, se originaba en el
backend y **ya fue corregido y verificado**
([#151](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/151)).

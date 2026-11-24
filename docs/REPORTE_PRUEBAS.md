# Reporte de resultados de pruebas — Nub-studio-movil (#51)

Reporte final de las pruebas de la app móvil NUB Studio: qué se probó, cuántos casos se
aprobaron y cuántos fallaron, qué errores se encontraron y corrigieron, y qué queda abierto.
Reúne los resultados de Jest, Postman, Maestro y las pruebas manuales. El detalle de cada
tipo de prueba está en su propio documento (columna "Detalle" de la sección 1).

| Dato | Valor |
| --- | --- |
| Fecha del reporte | 20 de noviembre de 2026 (actualizado el 24 de noviembre con la regresión y la CPU en reposo) |
| Versión probada | **1.0.0** (pruebas manuales y aceptación) y **1.1.0** (compatibilidad, rendimiento y regresión). Las pruebas automáticas se corrieron sobre `develop`, que es la 1.1.0 más el Certificate Pinning (#159) |
| Plan de pruebas | [PLAN_DE_PRUEBAS.md](PLAN_DE_PRUEBAS.md): 55 casos, de HU-01 a HU-10, requisitos de Google Play y no funcionales |
| Equipo | SoraidaMedina, MishelGvea y Gustavo5B |
| Cliente | Samuel Trejo |

---

## 1. Resumen

**Resultado general: la app cumple el plan de pruebas.** Todos los errores que se
encontraron ya se corrigieron. Lo que queda abierto son mejoras de rendimiento y pruebas que
todavía no se ejecutan (sección 6), no errores de funcionamiento.

| Tipo de prueba | Herramienta | Ejecutadas | Aprobadas | Fallidas | Estado | Detalle |
| --- | --- | :-: | :-: | :-: | :-: | --- |
| Unitarias y de componentes (#43, #44) | Jest + React Native Testing Library | 575 | 575 | 0 | ✅ | Sección 2.1 |
| Integración (#45): backend simulado y API real | Jest | 50 | 50 | 0 | ✅ | Sección 2.1 |
| Integración de API (#46) | Postman + Newman | 56 peticiones, 200 comprobaciones | 200 | 0 | ✅ | Sección 2.2 |
| Aceptación automática (E2E) (#90) | Maestro en emulador | 8 flujos | 8 | 0 | ✅ | Sección 2.3 |
| Compatibilidad (#49) | Maestro en 6 emuladores + 2 celulares reales | 48 flujos + 2 recorridos | 48 + 2 | 0 | ✅ | [resultados-compatibilidad.md](pruebas/resultados-compatibilidad.md) |
| Análisis estático y seguridad (#54, #60) | ESLint, Prettier, pnpm audit, TruffleHog, gitleaks, Semgrep | En cada PR | — | 0 | ✅ | Sección 2.4 |
| Funcionales manuales (#47) | Celulares Android, app de Google Play | 55 casos | 54 | 1 (corregido) | ✅ | [resultados-pruebas-funcionales.md](pruebas/resultados-pruebas-funcionales.md) |
| Aceptación con el cliente (#57) | Celular Android | 24 criterios | 24 | 0 | ✅ | [acta-aceptacion-hu01-hu10.md](pruebas/acta-aceptacion-hu01-hu10.md) |
| Rendimiento (#55, #157) | adb, k6 | 4 mediciones de la app y del API | 4 | 0 | ✅ | [REPORTE_RENDIMIENTO.md](pruebas/REPORTE_RENDIMIENTO.md) |
| Esfuerzo con 50 usuarios (#56) | k6 | 1 prueba, 2 fases | 1 fase | 1 fase (mejorada) | ⚠️ | [resultados-esfuerzo.md](pruebas/resultados-esfuerzo.md) |
| Regresión (#58) | Suite automática + app 1.1.0 de Google Play | 33 casos Alta + 3 errores corregidos | 33 + 3 | 0 | ✅ | [resultados-regresion.md](pruebas/resultados-regresion.md) |
| Aceptación final con el cliente (#50) | Celular Android | — | — | — | ⏳ Pendiente | Sección 6 |

**Errores encontrados:** 9 errores registrados en total, **9 corregidos** y **0 abiertos**
(sección 5).

---

## 2. Pruebas automáticas

### 2.1 Jest: unitarias, de componentes e integración

Ejecución local sobre `develop`, el 20 de noviembre de 2026: toda la suite con cobertura
(`pnpm test:ci`) y después la integración contra el entorno temporal de pruebas
(`pnpm test:integration`).

| Entorno temporal | Valor |
| --- | --- |
| Base de datos | PostgreSQL 18 en Docker, con los datos de prueba de `scripts/entorno/sql` (11 obras publicadas) |
| Backend | `Nub_studio_back` rama `main`, commit `8ac6e0a` (incluye el límite de intentos de login, #166) |
| Cuenta | Cliente de prueba del entorno temporal |

El entorno se levanta con `scripts/entorno/levantar-entorno.sh`, el mismo que usa el pipeline
de Release. No usa el backend de Render ni datos de producción.

| Grupo | Carpeta | Archivos | Pruebas | Resultado |
| --- | --- | :-: | :-: | --- |
| Funciones de cada historia (services, utils, contexto de sesión) | `tests/unit/` | 43 | 575 entre los tres grupos | ✅ Aprobadas |
| Pantallas | `tests/unit/componentes/` | 28 | | ✅ Aprobadas |
| ViewModels | `tests/unit/viewmodels/` | 20 | | ✅ Aprobadas |
| Integración con backend simulado: autenticación, descubrimiento y compra | `tests/integration/flujos/` | 3 | 26 | ✅ Aprobadas |
| Integración contra la API real: rutas públicas, login, rutas protegidas y favoritos con sesión | `tests/integration/api.test.js` | 1 | 24 | ✅ Aprobadas |
| **Total** | | **95** | **625** | **625 aprobadas, 0 fallidas** |

> `api.test.js` solo corre si existe la variable `API_URL`, porque necesita un backend
> encendido. Por eso se corrió aparte, contra el entorno temporal: las 4 suites de
> integración pasaron (50 de 50).

> **Un fallo por tiempo, no de la app:** en la ejecución completa, la prueba "recorre los 3
> pasos y regresa al inicio de sesión con el correo" de `RecuperarContrasenaScreen.test.js`
> pasó el límite de 20 s y se marcó como fallida. Al repetir ese archivo solo, sus 6 pruebas
> pasaron en 12 s. La computadora corría los 95 archivos a la vez y ese archivo tardó 44 s, así que
> fue por lentitud de la máquina. Se deja como observación en la sección 6.

**Cobertura de `src/utils`** (mínimo del pipeline: 80 % de líneas, funciones y sentencias, y
70 % de ramas):

| Sentencias | Ramas | Funciones | Líneas |
| :-: | :-: | :-: | :-: |
| 98.51 % ✅ | 95.55 % ✅ | 100 % ✅ | 99.46 % ✅ |

### 2.2 Postman y Newman: integración de API (#46)

La colección `tests/api/nub-studio.postman_collection.json` tiene un endpoint por cada ruta
que usa la app. Revisa el código de respuesta, la estructura de datos que lee la app y que
cada respuesta llegue en menos de 3 s.

| Carpeta | Peticiones |
| --- | :-: |
| 01 · Catálogo y obras (HU-01, HU-02) | 11 |
| 02 · Artistas (HU-03) | 4 |
| 03 · Colecciones (HU-04) | 3 |
| 04 · Blog y comentarios (HU-05) | 4 |
| 05 · Dirección de envío (HU-09) | 2 |
| 06 · Rutas protegidas sin sesión | 16 |
| 07 · Autenticación (HU-06) | 7 |
| 08 · Sesión de cliente (HU-06 a HU-10) | 9 |
| **Total** | **56** |

**Resultado del 20 de noviembre de 2026**, contra el mismo entorno temporal de la sección 2.1
(backend `main`, commit `8ac6e0a`):

| | Ejecutadas | Fallidas |
| --- | :-: | :-: |
| Peticiones | 56 | 0 |
| Comprobaciones | 200 | 0 |

Tiempo de respuesta promedio: 52 ms (mínimo 7 ms, máximo 812 ms), todo dentro del límite de
3 s. El mismo resultado (56 peticiones y 200 comprobaciones sin fallas) se obtuvo el 10 de
noviembre al verificar la corrección de #151
([resultados-pruebas-funcionales.md](pruebas/resultados-pruebas-funcionales.md), sección 2).

Comando usado (es el mismo de la etapa 03 del pipeline de Release):

```bash
pnpm test:api --env-var "baseUrl=http://localhost:4000" \
  --env-var "email=<cuenta de prueba>" --env-var "password=<contraseña>"
```

### 2.3 Maestro: aceptación automática (E2E)

Los 8 flujos de `tests/e2e/` revisan los criterios de aceptación como visitante, en un
emulador con el APK de prueba y el backend temporal (etapa 07 de
[pipelines.md](pruebas/pipelines.md)).

| Flujo | Historia | Resultado |
| --- | --- | :-: |
| 01 Visitante explora el catálogo | HU-01, HU-02 | ✅ |
| 02 Validaciones del registro | HU-06 | ✅ |
| 03 Carrito pide sesión | HU-08 | ✅ |
| 04 Filtros del catálogo | HU-01 | ✅ |
| 05 Visitante lee el blog | HU-05 | ✅ |
| 06 Perfil del artista | HU-03 | ✅ |
| 07 Colecciones | HU-04 | ✅ |
| 08 Favoritos pide sesión | HU-07 | ✅ |

En la prueba de compatibilidad (#49, ejecución del 20 de noviembre) los mismos 8 flujos se
corrieron en 6 emuladores, de Android 8.0 a 16 y uno de gama baja con 2 GB: **48 de 48
aprobados, 0 cierres inesperados y 0 ANR**.

### 2.4 Análisis estático y seguridad

Corren en cada Pull Request (etapas 01 y 08 de `ci.yml`). Un PR no se puede integrar si
alguna falla.

| Revisión | Resultado |
| --- | --- |
| ESLint y Prettier (`pnpm test:estatico`) | ✅ Sin errores ni advertencias en los PR integrados a `develop` |
| Dependencias (`pnpm audit --prod --audit-level high`) | ✅ 0 avisos altos o críticos (al 20 de noviembre quedan 1 bajo y 4 moderados, que el pipeline no bloquea) |
| Secretos (TruffleHog y gitleaks) | ✅ Sin secretos en el código |
| Código inseguro (Semgrep) | ✅ Sin hallazgos que bloqueen |
| Compatibilidad con Expo (`expo-doctor`) | ✅ |

Las demás medidas de seguridad (R8 y Certificate Pinning) están en
[seguridad.md](seguridad.md).

---

## 3. Pruebas manuales

### 3.1 Funcionales (#47)

Se ejecutaron los **55 casos** del plan sobre la app 1.0.0 de Google Play, repartidos entre
los tres integrantes, el 10 de noviembre de 2026.

| Grupo | Casos | Aprobados | Fallidos |
| --- | :-: | :-: | :-: |
| HU-01 a HU-10 | 46 | 45 | 1 (corregido) |
| Requisitos de Google Play | 5 | 5 | 0 |
| No funcionales | 4 | 4 | 0 |
| **Total** | **55** | **54** | **1 (corregido)** |

El único caso fallido fue el **CP-01-04 (Combinar filtros)**: el filtro de precio no mostraba
las obras sin tamaños registrados. El error estaba en el backend y se corrigió en #151 (ver la
sección 5). No hubo casos bloqueados.

### 3.2 Aceptación con el cliente (#57)

El cliente, **Samuel Trejo**, revisó la app en un celular el 10 de noviembre de 2026 y
**aceptó las historias HU-01 a HU-10**: **24 de 24 criterios** aceptados, además de "Eliminar
mi cuenta" y el aviso de privacidad (requisitos de Google Play). También aceptó los dos cambios
respecto al backlog: cambiar la contraseña con un código por correo (HU-06) y pagar en Mercado
Pago dentro de la app (HU-09). No hizo observaciones.

### 3.3 Compatibilidad en celulares reales (#49)

| Celular | Android | Versión de la app | Resultado |
| --- | :-: | :-: | --- |
| Motorola moto g42 (SoraidaMedina) | 13 | 1.1.0 | ✅ Recorrido completo, sin diferencias de diseño |
| POCO M6 Pro (Gustavo5B) | 16 | 1.1.0 | ✅ Recorrido completo, sin diferencias de diseño |
| Realme 7 (MishelGvea, en #157) | 10 | 1.1.0 | ✅ Sin cierres al recorrer el catálogo y abrir obras |

### 3.4 Regresión (#58)

Se repitieron los **33 casos de prioridad Alta** en la app **1.1.0 de Google Play** (moto g42,
Android 13, 21 de noviembre de 2026), además de toda la parte automática del pipeline de
regresión. **No hubo regresiones:** 33 de 33 casos aprobados.

- **CP-01-04 ya funciona en la app publicada:** los filtros de categoría y precio combinados
  muestran las obras correctas (corrección de #151).
- **Los errores de los testers siguen corregidos:** el registro acepta contraseñas con `#`
  (#146), no aparece "Tu sesión no es válida" con la sesión activa (#147) y una cuenta de
  administrador no puede entrar a la app (#148).

El detalle está en [resultados-regresion.md](pruebas/resultados-regresion.md).

---

## 4. Rendimiento y esfuerzo

### 4.1 Rendimiento (#55 y #157)

| Medición | Resultado | Meta | Estado |
| --- | --- | --- | :-: |
| Arranque en frío | 579 ms (1.0.0, POCO M6 Pro) y 281 ms (1.1.0, Realme 7) | Menos de 5 s | ✅ |
| Fluidez del catálogo | p95 de 15 ms por cuadro; 0.06 % de cuadros con tirón | 16 ms o menos | ✅ |
| Carga del catálogo que ve el usuario | ~1 s | Menos de 2 s | ✅ |
| Respuesta del API con 20 usuarios (k6) | p95 de 4.3 ms, 0 % de errores | p95 < 1.5 s y errores < 1 % | ✅ |
| Memoria al volver a Inicio después de ver obras | 145 MB en reposo → 288 MB (+98 %) | Máximo 20 % arriba del reposo | ❌ Abierto (#167) |
| CPU con la app quieta en Inicio | 3.9 % en la primera medición; 1.7–2.0 % al revisarlo en el moto g42 | Menos de 1 % | ⚠️ Explicado (#168) |

La 1.1.0 es más ligera que la 1.0.0: con R8 el APK bajó 14.8 % (de 37.5 a 32.0 MB) y la memoria
en reposo 8.2 %. El Certificate Pinning no cambió el arranque.

**CPU en reposo (#168):** el consumo no sale del código de la app. Lo genera React Native: su
nueva arquitectura revisa en cada cuadro de pantalla si hay algo que dibujar, aunque la app
esté quieta (0 cuadros dibujados en la medición). El código JavaScript de la app casi no usa
CPU. Como no se puede quitar desde la app, la meta de menos de 1 % se deja explicada en vez de
corregida. El detalle está en
[REPORTE_RENDIMIENTO.md, sección 6.8](pruebas/REPORTE_RENDIMIENTO.md).

### 4.2 Esfuerzo con 50 usuarios (#56)

La primera prueba (8 de noviembre) encontró que **el inicio de sesión es el primer punto de
quiebre**: con 50 usuarios su p95 llegó a 4.7 s (meta: 4 s) y hubo **48 errores 500** (0.6 %)
porque se agotaban las conexiones a la base. Al bajar la carga, la API se recuperó sin errores.

Se aplicaron dos mejoras en el backend (plan de mejora, #158):

| Fase de estrés, 50 usuarios | Antes | Con el límite de bcrypt (acción 1) | Con el límite de intentos de login (acción 2, #166) |
| --- | :-: | :-: | :-: |
| Errores | 0.6 % | 0 % | 0 % |
| Login, p95 | 4.7 s | 3.1 s ✅ | 2.5 s ✅ |
| Mis pedidos, máximo | 10.4 s | 17 ms | 26 ms |

Con las dos mejoras la prueba ya cumple las metas. Queda pendiente la acción 1b (sección 6) para
bajar el login a 2 s o menos.

---

## 5. Errores encontrados y corregidos

| Issue | Error | Cómo se encontró | Dónde se corrigió | Prioridad | Estado |
| --- | --- | --- | --- | :-: | :-: |
| [#151](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/151) | El filtro de precio no muestra las obras sin tamaños registrados (CP-01-04) | Prueba funcional manual (#47) | Backend | Alta | ✅ Corregido |
| [#146](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/146) | El registro rechaza contraseñas con `#` y otros símbolos (y la contraseña quedaba escrita en los logs) | Testers de la prueba cerrada en Google Play (1.0.0) | Backend | Alta | ✅ Corregido |
| [#147](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/147) | Aparece "Tu sesión no es válida" aunque la sesión sigue activa | Testers de la prueba cerrada en Google Play (1.0.0) | Backend y app (#129) | Alta | ✅ Corregido |
| [#148](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/148) | La app deja iniciar sesión a artistas y administradores | Testers de la prueba cerrada en Google Play (1.0.0) | App | Alta | ✅ Corregido |
| [#115](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/115) | La app marca error mientras el servidor de Render despierta | Revisión para publicar en Google Play | App | Alta | ✅ Corregido |
| [#124](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/124) | Faltaban el aviso de privacidad visible y la opción de reportar comentarios (requisito de Google Play) | Revisión para publicar en Google Play | App | Alta | ✅ Corregido |
| [#122](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/122) | El AAB pedía permisos de Android que la app no usa | Revisión para publicar en Google Play | App | Media | ✅ Corregido |
| [#111](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/111) | `pnpm audit` encontró 7 avisos altos en `node-forge` | Etapa 08 · Seguridad del pipeline | App (dependencias) | Alta | ✅ Corregido |
| [#93](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/93) | La app a veces se queda en el splash en el emulador de CI | Etapa 07 · Aceptación del pipeline | Flujos de Maestro | Media | ✅ Corregido |

Las tres correcciones reportadas por los testers (#146, #147 y #148) salieron en la versión
1.1.0 ([CHANGELOG.md](../CHANGELOG.md)). La regresión (#58) confirmó que las cuatro, incluida
la de #151, funcionan en la app publicada (sección 3.4).

Además, la prueba de esfuerzo encontró que el login se volvía lento y daba errores con 50
usuarios. No se registró como bug sino como hallazgo del plan de mejora, y ya se corrigió
(sección 4.2).

---

## 6. Lo que queda abierto

No queda ningún error de funcionamiento abierto. Lo pendiente son mejoras de rendimiento y
pruebas por ejecutar:

| Pendiente | Issue | Responsable | Fecha | Qué falta |
| --- | --- | --- | --- | --- |
| Liberar la memoria de las imágenes al salir del detalle de la obra | [#167](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/167) | MishelGvea | 26 nov | Que la memoria regrese a máximo 20 % arriba del reposo (≤ 174 MB) |
| Ajustar `UV_THREADPOOL_SIZE` en el servidor (acción 1b) | [#158](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/158) | Gustavo5B | 24 nov | Login p95 con 50 usuarios de 2 s o menos |
| Mantener despierto el servidor de Render (acción 5) | [#158](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/158) | Gustavo5B | 28 nov | El monitor ya corre; falta medir la primera carga |
| Fluidez en un celular de gama baja real (acción 6) | [#49](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/49) | Equipo | 28 nov | No se puede medir en emulador; falta un celular de 2–3 GB |
| Primera medición de los acuerdos de servicio (SLA) | [#144](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/144) | Equipo | 24 nov | Llenar disponibilidad, respuesta del API y estabilidad |
| Aceptación final con el cliente | [#50](https://github.com/Nub-Studio-Uthh/Nub-studio-movil/issues/50) | Equipo | — | Presentar la versión candidata a Samuel Trejo |

Ya no aparecen como pendientes la **regresión (#58)**, que se aprobó con 33 de 33 casos
(sección 3.4), ni la **CPU en reposo (#168)**, que quedó explicada (sección 4.1).

**Observación:** la prueba "recorre los 3 pasos…" de `RecuperarContrasenaScreen.test.js`
se pasó del tiempo una vez en una computadora lenta (sección 2.1). Si vuelve a pasar en CI,
conviene darle más tiempo a esa prueba o dividirla.

---

## 7. Conclusión

- **Las pruebas automáticas pasan:** 625 pruebas de Jest (incluidas las de integración contra
  el backend), 200 comprobaciones de Postman y los 8
  flujos de Maestro, estos últimos en 6 versiones de Android (48 de 48). La cobertura de
  `src/utils` es de 98.5 %.
- **Las pruebas manuales pasan:** 54 de 55 casos se aprobaron a la primera, y el único fallo
  ya se corrigió en el backend.
- **El cliente aceptó HU-01 a HU-10** (24 de 24 criterios).
- **Se encontraron 9 errores y los 9 están corregidos.** Tres los reportaron los testers de
  Google Play y salieron en la 1.1.0.
- **La regresión pasó:** 33 de 33 casos Alta en la app 1.1.0 de Google Play, sin errores
  nuevos.
- **La CPU en reposo quedó explicada:** el 1.7–2.0 % lo genera React Native, no el código de
  la app.
- **Quedan abiertas una mejora de rendimiento de la app** (memoria, #167) y las del backend,
  todas con responsable y fecha, además de la aceptación final con el cliente.

---

## 8. Cómo repetir las pruebas

| Comando | Qué ejecuta |
| --- | --- |
| `pnpm test:ci` | Toda la suite de Jest con cobertura |
| `pnpm test:estatico` | ESLint y Prettier |
| `pnpm test:seguridad` | Dependencias con avisos altos o críticos |
| `pnpm test:integration` | Integración con Jest (necesita `API_URL` y el entorno temporal encendido) |
| `pnpm test:api` | Colección de Postman con Newman (necesita el backend en `http://localhost:4000`) |
| `pnpm test:e2e` | Flujos de Maestro (necesita un emulador o celular) |

El detalle de cada comando y de los pipelines está en
[pruebas/pipelines.md](pruebas/pipelines.md) y en
[pruebas/recursos-pruebas.md](pruebas/recursos-pruebas.md).

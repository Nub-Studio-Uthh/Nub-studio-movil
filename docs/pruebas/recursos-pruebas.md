# Recursos para las pruebas — Nub-studio-movil

Este documento identifica los recursos (herramientas, software, servicios y hardware) que el equipo usará para cada tipo de prueba definido en la planeación, y justifica por qué se eligió cada uno.

**Criterios de selección** que se usaron para elegir:

1. **Compatibilidad con el stack:** React Native + Expo SDK 57, JavaScript, pnpm y el backend REST en Node.js ya existente.
2. **Costo cero:** todas las herramientas son gratuitas o de código abierto, o tienen un plan gratuito suficiente para un proyecto escolar.
3. **Automatizable en GitHub Actions:** todas se pueden ejecutar desde la línea de comandos dentro de un pipeline.
4. **Curva de aprendizaje baja:** se escriben en JavaScript o YAML, lenguajes que el equipo ya domina.

---

## 1. Recursos por tipo de prueba

Los tipos de prueba y su calendarización están registrados como issues con la etiqueta `testing` en el tablero **Nub-studio-movil — Scrumban** (punto 1 de la planeación). Cada fila indica el issue al que corresponde.

| Tipo de prueba | Issue(s) | Herramienta / recurso | Tipo de recurso | Justificación |
| --- | --- | --- | --- | --- |
| **Unitarias** | #43 | **Jest** + preset **jest-expo** | Software (framework de pruebas) | Es el framework que Expo recomienda y soporta oficialmente. `jest-expo` ya simula los módulos nativos de Expo, así que no hay que configurar *mocks* a mano. Incluye reporte de cobertura sin instalar nada extra. |
| | #44 | **React Native Testing Library** | Software (librería de pruebas de componentes) | Prueba las pantallas como las usa una persona (escribir en un campo, tocar un botón, ver un mensaje) en lugar de revisar detalles internos del código. Funciona encima de Jest, sin otra herramienta. |
| **Análisis de código estático** | #54 | **ESLint** (`eslint-config-expo`) + **Prettier** | Software (linter y formateador) | Ya estaban configurados en el repositorio desde el inicio del proyecto. ESLint detecta errores y malas prácticas sin ejecutar el código; Prettier asegura un formato uniforme entre los tres integrantes. |
| | #54 | **pnpm audit** | Software (incluido en pnpm) | Revisa las dependencias contra la base de vulnerabilidades de npm. Viene incluido en el gestor de paquetes que ya usamos, sin costo ni configuración. |
| | #54 | **TruffleHog** | Software de código abierto (GitHub Action) | Busca contraseñas, tokens o llaves subidos por error al repositorio. Es importante porque la app maneja tokens JWT y credenciales del backend. |
| **Integración** | #45 | **Jest** (con `jest.mock` y contra la API real) | Software | Con `jest.mock` se simula la API para probar que los *services*, *controllers* y pantallas trabajan juntos sin depender del servidor. Una segunda suite hace peticiones reales para confirmar las rutas, códigos de respuesta y el formato `{ data: [...] }`. |
| | #46 | **Postman** + **Newman** | Software (cliente de API y su versión de línea de comandos) | El equipo ya usa Postman para probar el backend web. Newman ejecuta la misma colección dentro del pipeline, así que no hay que reescribir las pruebas. |
| **Regresión** | #58 | **Expo Go** (recorrido manual del flujo completo) | Software (app de Expo) + hardware (teléfonos) | Permite recorrer toda la app en un celular real en segundos, sin compilar, después de cada integración importante. |
| | #58 | **GitHub Actions** (ejecución programada de la suite completa) | Servicio (CI/CD) | Complementa la revisión manual: cada noche vuelve a correr ESLint, Jest, Newman y el build, para detectar si algo que ya funcionaba se rompió. No requiere una herramienta nueva. |
| **Rendimiento** | #55 | **Perf Monitor** de React Native | Software (incluido en React Native) | Se activa desde el menú de desarrollo y muestra en pantalla los FPS y el uso de memoria. Sirve para medir la fluidez de las listas del catálogo sin instalar nada. |
| | #55 | **Android Studio Profiler** | Software (incluido en Android Studio) | Mide el arranque en frío, el consumo de CPU y memoria de la app en un dispositivo real o emulador. Es gratuito y el equipo ya tiene Android Studio instalado. |
| | #55 | **Postman** | Software | Mide el tiempo de respuesta de cada endpoint del API de forma individual. |
| | #55 | **k6** (Grafana) | Software de código abierto | Mide el API con **20 usuarios virtuales** simultáneos (la carga normal esperada) y hace fallar el pipeline si no se cumplen los umbrales (95 % de respuestas en menos de 1.5 s). Los scripts se escriben en JavaScript y corren en GitHub Actions. Es más ligero que JMeter. |
| **Esfuerzo (estrés)** | #56 | **k6** (Grafana) | Software de código abierto | Con la misma herramienta de rendimiento se sube la carga por etapas hasta **50 usuarios virtuales** durante 2 minutos sobre catálogo, inicio de sesión y pedidos, para ver el límite del backend y cómo se degrada. Usar una sola herramienta para rendimiento y esfuerzo reduce lo que el equipo tiene que aprender. Como el backend lo comparte la web, se ejecuta solo de forma manual y en horario tranquilo. |
| **Aceptación** | #57, #50 | **Expo Go** + criterios de aceptación de las historias | Software + hardware (celular) | El cliente (Samuel Trejo) revisa las funciones en un celular y confirma los criterios uno por uno. Es la prueba de aceptación de usuario (UAT) principal. |
| | #57 | **Maestro** | Software de código abierto (pruebas E2E móviles) | Automatiza los mismos flujos que revisa el cliente para comprobarlos antes de cada presentación. Los flujos se escriben en YAML simple (`tapOn`, `assertVisible`), funciona con apps de React Native y Expo sin modificar el código, y es más fácil de configurar que Detox o Appium. |
| | #57 | **Emulador Android** (`android-emulator-runner`) | Software / hardware virtual | Permite ejecutar los flujos de Maestro dentro del pipeline sin un teléfono físico conectado. |
| | #50, #49 | **Expo EAS Build** (perfil `preview`) | Servicio en la nube (plan gratuito) | Genera un APK instalable que se comparte con el cliente por un enlace, y que también se usa en las pruebas de compatibilidad. |
| **Compatibilidad** (complementaria) | #49 | **Dos o más dispositivos o emuladores Android** con versiones distintas | Hardware / software | Verifica que la app funcione igual en distintas versiones de Android y tamaños de pantalla. |

## 2. Recursos de infraestructura y hardware

| Recurso | Tipo | Uso en las pruebas | Justificación |
| --- | --- | --- | --- |
| **GitHub Actions** (runners `ubuntu-latest`) | Servicio en la nube | Ejecuta todos los pipelines de prueba. | Está integrado con el repositorio y con el tablero Scrumban del proyecto. Es gratuito para la organización y los resultados aparecen directamente en cada Pull Request. |
| **GitHub Secrets** | Servicio | Guarda la URL del backend, el usuario de prueba y el token de Expo. | Evita escribir credenciales en el código, lo cual también revisa TruffleHog. |
| **Backend en Render** | Servicio en la nube | Destino de las pruebas de integración, rendimiento y esfuerzo. | Es el mismo backend que usa la web. Como no hay un entorno de Staging separado, las pruebas de carga usan pocos usuarios virtuales (20 y 50), solo se lanzan a mano y en horario tranquilo, avisando al equipo. |
| **Teléfonos Android físicos** del equipo | Hardware | Pruebas manuales (#47), regresión en Expo Go (#58), aceptación con el cliente (#57) y compatibilidad (#49). | El emulador no muestra todo: rendimiento real, tamaños de pantalla y teclado. Cada integrante tiene al menos un dispositivo Android. |
| **Computadoras del equipo** (Windows, Node.js 22, pnpm 11) | Hardware / software | Correr las pruebas localmente antes de abrir un PR (`pnpm test`, `pnpm lint`). | Detectar errores antes del pipeline ahorra tiempo de revisión. |
| **Visual Studio Code** + extensiones de ESLint y Prettier | Software | Ver los errores de análisis estático mientras se escribe el código. | Es el editor que usa todo el equipo; las extensiones leen la misma configuración del repositorio. |

---

## 3. Alternativas evaluadas y descartadas

| Alternativa | Descartada porque… |
| --- | --- |
| **Detox** (E2E) | Requiere modificar la configuración nativa y compilar con configuraciones especiales. Maestro funciona con el APK tal como se genera. |
| **Appium** (E2E) | Necesita un servidor, drivers y más configuración; resulta demasiado pesado para el tamaño del MVP. |
| **Apache JMeter** (rendimiento) | Su interfaz gráfica y los planes en XML son difíciles de versionar y revisar en un PR; k6 usa JavaScript. |
| **SonarCloud** (análisis estático) | Es útil, pero requiere configurar un servicio externo y un token. Se deja como mejora futura; ESLint y `pnpm audit` cubren lo necesario para el MVP. |
| **Firebase Test Lab** (dispositivos reales en la nube) | El plan gratuito es limitado y requiere una cuenta de Google Cloud. Para el MVP bastan el emulador y los teléfonos del equipo. |

---

## 4. Resumen de comandos

| Comando | Qué ejecuta |
| --- | --- |
| `pnpm lint` | ESLint (análisis estático) |
| `pnpm format:check` | Revisión de formato con Prettier |
| `pnpm test:unit` | Pruebas unitarias con Jest |
| `pnpm test:integration` | Pruebas de integración (requiere la variable `API_URL`) |
| `pnpm test:ci` | Todas las pruebas de Jest con reporte de cobertura |
| `k6 run tests/performance/carga.js` | Prueba de rendimiento (requiere `API_URL`) |
| `k6 run tests/performance/estres.js` | Prueba de esfuerzo, 50 usuarios virtuales (requiere `API_URL`) |
| `maestro test tests/e2e` | Flujos de aceptación en un emulador o teléfono |

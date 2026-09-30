# Recursos para las pruebas — Nub-studio-movil

Este documento identifica los recursos (herramientas, software, servicios y hardware) que el equipo usará para cada tipo de prueba definido en la planeación, y justifica por qué se eligió cada uno.

**Criterios de selección** que se usaron para elegir:

1. **Compatibilidad con el stack:** React Native + Expo SDK 57, JavaScript, pnpm y el backend REST en Node.js ya existente.
2. **Costo cero:** todas las herramientas son gratuitas o de código abierto, o tienen un plan gratuito suficiente para un proyecto escolar.
3. **Automatizable en GitHub Actions:** todas se pueden ejecutar desde la línea de comandos dentro de un pipeline.
4. **Curva de aprendizaje baja:** se escriben en JavaScript o YAML, lenguajes que el equipo ya domina.

---

## 1. Recursos por tipo de prueba

| Tipo de prueba | Herramienta / recurso | Tipo de recurso | Justificación |
| --- | --- | --- | --- |
| **Unitarias** | **Jest** + preset **jest-expo** | Software (framework de pruebas) | Jest es el framework que Expo recomienda y soporta oficialmente; `jest-expo` ya simula los módulos nativos de Expo, así que no hay que configurar *mocks* a mano. Incluye reporte de cobertura sin instalar nada extra. |
| **Análisis de código estático** | **ESLint** (`eslint-config-expo`) + **Prettier** | Software (linter y formateador) | Ya estaban configurados en el repositorio desde el inicio del proyecto. ESLint detecta errores y malas prácticas sin ejecutar el código; Prettier asegura un formato uniforme entre los tres integrantes. |
| | **pnpm audit** | Software (incluido en pnpm) | Revisa las dependencias contra la base de vulnerabilidades de npm. Viene incluido en el gestor de paquetes que ya usamos, sin costo ni configuración. |
| | **TruffleHog** | Software de código abierto (GitHub Action) | Busca contraseñas, tokens o llaves subidos por error al repositorio. Es importante porque la app maneja tokens JWT y credenciales del backend. |
| **Integración** | **Jest** (entorno Node, `fetch`) | Software | Reutiliza la misma herramienta de las unitarias para probar que la app y la API del backend se comunican correctamente (códigos de respuesta, formato `{ data: [...] }`, rutas protegidas). |
| | **Postman** + **Newman** | Software (cliente de API y su versión de línea de comandos) | El equipo ya usa Postman para probar el backend web. Newman ejecuta la misma colección dentro del pipeline, así que no hay que reescribir las pruebas. |
| **Regresión** | **GitHub Actions** (ejecución programada) + suite completa (ESLint, Jest, Newman) | Servicio (CI/CD) | No se necesita una herramienta nueva: la regresión consiste en volver a correr **todas** las pruebas existentes. GitHub Actions permite programarlas cada noche y al preparar una versión, sin costo para repositorios de la organización. |
| **Rendimiento** | **k6** (Grafana) | Software de código abierto | Los scripts se escriben en JavaScript, se ejecutan desde la terminal o en GitHub Actions y permiten definir umbrales (por ejemplo, 95 % de respuestas en menos de 1.5 s) que hacen fallar el pipeline si no se cumplen. Es más ligero que JMeter y no requiere interfaz gráfica. |
| **Esfuerzo (estrés)** | **k6** (Grafana) | Software de código abierto | Con la misma herramienta se aumenta la carga por etapas (25 %, 50 % y 100 % de los usuarios máximos) hasta encontrar el punto en que la API se degrada. Usar una sola herramienta para rendimiento y esfuerzo reduce lo que el equipo tiene que aprender. |
| **Aceptación** | **Maestro** | Software de código abierto (pruebas E2E móviles) | Los flujos se escriben en YAML simple (`tapOn`, `assertVisible`), funciona con apps de React Native y Expo sin modificar el código, y es más fácil de configurar que Detox o Appium. |
| | **Emulador Android** (Android Emulator + `android-emulator-runner`) | Software / hardware virtual | Permite ejecutar los flujos E2E dentro del pipeline sin necesitar un teléfono físico conectado. |
| | **Expo EAS Build** (perfil `preview`) | Servicio en la nube (plan gratuito) | Genera un APK de prueba que se comparte con el cliente por un enlace para la **prueba de aceptación de usuario (UAT)**, antes de liberar la versión. |

---

## 2. Recursos de infraestructura y hardware

| Recurso | Tipo | Uso en las pruebas | Justificación |
| --- | --- | --- | --- |
| **GitHub Actions** (runners `ubuntu-latest`) | Servicio en la nube | Ejecuta todos los pipelines de prueba. | Está integrado con el repositorio y con el tablero Scrumban del proyecto. Es gratuito para la organización y los resultados aparecen directamente en cada Pull Request. |
| **GitHub Secrets** | Servicio | Guarda la URL de Staging, el usuario de prueba y el token de Expo. | Evita escribir credenciales en el código, lo cual también revisa TruffleHog. |
| **Backend en Render** (entorno de Staging) | Servicio en la nube | Destino de las pruebas de integración, rendimiento y esfuerzo. | Es el mismo backend que usa la web. Las pruebas de carga y estrés se hacen contra Staging y **nunca contra producción**, para no afectar a los usuarios reales. |
| **Teléfonos Android físicos** del equipo | Hardware | Pruebas manuales exploratorias y de aceptación con Expo Go o el APK de prueba. | El emulador no muestra todo: rendimiento real, tamaños de pantalla y teclado. Cada integrante tiene al menos un dispositivo Android. |
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
| `k6 run tests/performance/estres.js` | Prueba de esfuerzo (requiere `API_URL`) |
| `maestro test tests/e2e` | Flujos de aceptación en un emulador o teléfono |

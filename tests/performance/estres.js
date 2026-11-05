// PRUEBA DE ESFUERZO (estrés) con k6 — issues #56 y #87
// Cubre catálogo (HU-01), inicio de sesión (HU-06) y pedidos (HU-10) en dos fases:
//
//   1. Estrés (4 min): sube por etapas hasta USUARIOS_MAX usuarios virtuales (50 por
//      defecto), los mantiene 2 minutos y baja. Busca el punto en que la API se degrada.
//   2. Recuperación (1 min): empieza cuando termina el estrés, con 5 usuarios. La API
//      debe volver a responder como en una carga normal; si no, la prueba falla.
//
// En CI corre contra el entorno temporal de scripts/entorno; nunca contra el backend de Render,
// que comparte la base de datos con la web en producción.
import http from 'k6/http';
import { check, sleep } from 'k6';

const API = __ENV.API_URL;
const MAX = Number(__ENV.USUARIOS_MAX || 50);
// Para login y pedidos un 401/403 es la respuesta correcta; solo cuenta como fallo un error 5xx
const aceptaRechazo = { responseCallback: http.expectedStatuses({ min: 200, max: 499 }) };

export const options = {
  scenarios: {
    estres: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: Math.round(MAX * 0.25) },
        { duration: '30s', target: Math.round(MAX * 0.5) },
        { duration: '30s', target: MAX }, // llega al pico de estrés
        { duration: '2m', target: MAX }, // se mantiene 2 minutos
        { duration: '30s', target: 0 }, // baja la carga
      ],
      gracefulRampDown: '10s',
    },
    recuperacion: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      startTime: '4m10s', // después del estrés y de su gracefulRampDown
    },
  },
  thresholds: {
    // Estrés: umbrales amplios, aquí se busca el límite y no la meta normal
    'http_req_duration{scenario:estres}': ['p(95)<4000'],
    'http_req_failed{scenario:estres}': ['rate<0.10'],
    // Recuperación: con poca carga, la API debe volver a la meta de una carga normal
    'http_req_duration{scenario:recuperacion}': ['p(95)<1500'],
    'http_req_failed{scenario:recuperacion}': ['rate<0.01'],
    'checks{scenario:recuperacion}': ['rate>0.99'],
  },
};

export default function () {
  // HU-01: catálogo
  const catalogo = http.get(`${API}/api/obras?limit=8`);
  check(catalogo, { 'catálogo 200': (r) => r.status === 200 });

  // HU-06: inicio de sesión (con credenciales inválidas para no bloquear cuentas reales)
  const login = http.post(
    `${API}/api/auth/login`,
    JSON.stringify({ correo: 'k6-estres@nubstudio.test', contrasena: 'NoExiste123' }),
    { ...aceptaRechazo, headers: { 'Content-Type': 'application/json' } }
  );
  check(login, { 'login responde sin error del servidor': (r) => r.status < 500 });

  // HU-10: pedidos (sin sesión debe rechazar, pero sin caerse)
  const pedidos = http.get(`${API}/api/ventas/mis-pedidos`, aceptaRechazo);
  check(pedidos, { 'pedidos responde sin error del servidor': (r) => r.status < 500 });

  sleep(0.5);
}

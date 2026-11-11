// PRUEBA DE ESFUERZO (estrés) con k6 — issues #56 y #87
// Cubre catálogo (HU-01), inicio de sesión (HU-06) y pedidos (HU-10) en dos fases:
//
//   1. Estrés (4 min): sube por etapas hasta USUARIOS_MAX usuarios virtuales (50 por
//      defecto), los mantiene 2 minutos y baja. Busca el punto en que la API se degrada.
//   2. Recuperación (1 min): empieza cuando termina el estrés, con 5 usuarios. La API
//      debe volver a responder como en una carga normal; si no, la prueba falla.
//
// Con TEST_USER_EMAIL y TEST_USER_PASSWORD (cuenta de cliente de prueba) se estresa el camino
// real: login con la contraseña correcta (bcrypt + sesión nueva) y Mis pedidos con token (consulta
// a la base). Sin ellos, login usa un correo inexistente y pedidos se pide sin sesión, que el
// backend rechaza casi sin trabajar.
// Nunca con una contraseña incorrecta de una cuenta real: el backend la bloquearía.
//
// En CI corre contra el entorno temporal de scripts/entorno; nunca contra el backend de Render,
// que comparte la base de datos con la web en producción.
import http from 'k6/http';
import { check, sleep } from 'k6';

const API = __ENV.API_URL;
const MAX = Number(__ENV.USUARIOS_MAX || 50);
const CORREO = __ENV.TEST_USER_EMAIL;
const CONTRASENA = __ENV.TEST_USER_PASSWORD;
const CON_CUENTA = Boolean(CORREO && CONTRASENA);

const JSON_HEADERS = { 'Content-Type': 'application/json' };
// Sin cuenta, para login y pedidos un 401/403 es la respuesta correcta; solo cuenta como
// fallo un error 5xx.
const aceptaRechazo = { responseCallback: http.expectedStatuses({ min: 200, max: 499 }) };
// Etiqueta cada petición con su endpoint para ver cuál se degrada primero.
const etiqueta = (endpoint) => ({ tags: { endpoint } });

// Submétricas por endpoint en la fase de estrés. El umbral "max>=0" siempre se cumple: solo
// sirve para que k6 las incluya en el resumen (--summary-export) y el reporte las muestre.
const porEndpoint = Object.fromEntries(
  ['catalogo', 'login', 'pedidos'].map((e) => [
    `http_req_duration{scenario:estres,endpoint:${e}}`,
    ['max>=0'],
  ])
);

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
    ...porEndpoint,
  },
};

// Con cuenta, inicia sesión una vez para que Mis pedidos se pida con un token válido.
export function setup() {
  if (!CON_CUENTA) {
    console.warn(
      'Sin TEST_USER_EMAIL/TEST_USER_PASSWORD: login y pedidos solo prueban el rechazo.'
    );
    return { token: null };
  }
  const r = http.post(
    `${API}/api/auth/login`,
    JSON.stringify({ correo: CORREO, contrasena: CONTRASENA }),
    { headers: JSON_HEADERS }
  );
  const token = r.status === 200 ? r.json('access_token') : null;
  if (!token)
    throw new Error(`No se pudo iniciar sesión con la cuenta de prueba (HTTP ${r.status})`);
  return { token };
}

export default function recorrido({ token }) {
  // HU-01: catálogo
  const catalogo = http.get(`${API}/api/obras?limit=8`, etiqueta('catalogo'));
  check(catalogo, { 'catálogo 200': (r) => r.status === 200 });

  // HU-06: inicio de sesión
  if (CON_CUENTA) {
    const login = http.post(
      `${API}/api/auth/login`,
      JSON.stringify({ correo: CORREO, contrasena: CONTRASENA }),
      { headers: JSON_HEADERS, ...etiqueta('login') }
    );
    check(login, { 'login 200 con token': (r) => r.status === 200 && !!r.json('access_token') });
  } else {
    // Correo inexistente: no bloquea ninguna cuenta real.
    const login = http.post(
      `${API}/api/auth/login`,
      JSON.stringify({ correo: 'k6-estres@nubstudio.test', contrasena: 'NoExiste123' }),
      { headers: JSON_HEADERS, ...aceptaRechazo, ...etiqueta('login') }
    );
    check(login, { 'login responde sin error del servidor': (r) => r.status < 500 });
  }

  // HU-10: Mis pedidos
  if (token) {
    const pedidos = http.get(`${API}/api/ventas/mis-pedidos`, {
      headers: { Authorization: `Bearer ${token}` },
      ...etiqueta('pedidos'),
    });
    check(pedidos, {
      'pedidos 200 con su lista': (r) => r.status === 200 && Array.isArray(r.json('data')),
    });
  } else {
    const pedidos = http.get(`${API}/api/ventas/mis-pedidos`, {
      ...aceptaRechazo,
      ...etiqueta('pedidos'),
    });
    check(pedidos, { 'pedidos responde sin error del servidor': (r) => r.status < 500 });
  }

  sleep(0.5);
}

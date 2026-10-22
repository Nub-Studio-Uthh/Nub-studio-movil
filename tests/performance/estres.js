// PRUEBA DE ESFUERZO (estrés) con k6 — issue #56
// Sube la carga por etapas hasta USUARIOS_MAX usuarios virtuales (50 por defecto)
// y la mantiene 2 minutos, para encontrar el punto en que la API empieza a fallar
// o a responder lento. Cubre catálogo (HU-01), inicio de sesión (HU-06) y pedidos (HU-10).
// En CI corre contra el entorno temporal de scripts/entorno; nunca contra el backend de Render,
// que comparte la base de datos con la web en producción.
import http from 'k6/http';
import { check, sleep } from 'k6';

const API = __ENV.API_URL;
const MAX = Number(__ENV.USUARIOS_MAX || 50);
// Para login y pedidos un 401/403 es la respuesta correcta; solo cuenta como fallo un error 5xx
const aceptaRechazo = { responseCallback: http.expectedStatuses({ min: 200, max: 499 }) };

export const options = {
  stages: [
    { duration: '30s', target: Math.round(MAX * 0.25) },
    { duration: '30s', target: Math.round(MAX * 0.5) },
    { duration: '30s', target: MAX }, // llega al pico de estrés
    { duration: '2m', target: MAX }, // se mantiene 2 minutos
    { duration: '30s', target: 0 }, // recuperación
  ],
  thresholds: {
    // Umbrales más amplios: aquí se busca el límite, no la meta normal
    http_req_duration: ['p(95)<4000'],
    http_req_failed: ['rate<0.10'],
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

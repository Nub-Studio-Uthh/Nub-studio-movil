// PRUEBA DE ESFUERZO (estrés) con k6
// Aumenta los usuarios por encima de lo normal hasta USUARIOS_MAX para
// encontrar el punto en el que la API empieza a fallar o a responder lento.
import http from 'k6/http';
import { check, sleep } from 'k6';

const API = __ENV.API_URL;
const MAX = Number(__ENV.USUARIOS_MAX || 100);

export const options = {
  stages: [
    { duration: '1m', target: Math.round(MAX * 0.25) },
    { duration: '1m', target: Math.round(MAX * 0.5) },
    { duration: '1m', target: MAX }, // pico de estrés
    { duration: '1m', target: MAX },
    { duration: '1m', target: 0 }, // recuperación
  ],
  thresholds: {
    // Umbrales más amplios: aquí se busca el límite, no la meta normal
    http_req_duration: ['p(95)<4000'],
    http_req_failed: ['rate<0.10'],
  },
};

export default function () {
  const res = http.get(`${API}/api/obras?limit=8`);
  check(res, { 'catálogo 200': (r) => r.status === 200 });
  sleep(0.5);
}

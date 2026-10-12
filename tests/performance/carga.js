// PRUEBA DE RENDIMIENTO (carga normal) con k6
// Simula 20 usuarios navegando el catálogo al mismo tiempo durante 2 minutos.
import http from 'k6/http';
import { check, sleep } from 'k6';

const API = __ENV.API_URL;

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // subida gradual
    { duration: '1m', target: 20 }, // carga sostenida
    { duration: '30s', target: 0 }, // bajada
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'], // 95 % de las respuestas en menos de 1.5 s
    http_req_failed: ['rate<0.01'], // menos de 1 % de errores
  },
};

export default function () {
  const obras = http.get(`${API}/api/obras?limit=8`);
  check(obras, { 'catálogo 200': (r) => r.status === 200 });

  const categorias = http.get(`${API}/api/categorias`);
  check(categorias, { 'categorías 200': (r) => r.status === 200 });

  sleep(1);
}

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

// Recorrido de HU-01: abrir Inicio, entrar al catálogo, filtrar y buscar.
export default function () {
  const destacadas = http.get(`${API}/api/obras?destacadas=true&limit=6`);
  check(destacadas, { 'destacadas 200': (r) => r.status === 200 });

  const obras = http.get(`${API}/api/obras?limit=12`);
  check(obras, { 'catálogo 200': (r) => r.status === 200 });

  const categorias = http.get(`${API}/api/categorias`);
  check(categorias, { 'categorías 200': (r) => r.status === 200 });

  const filtradas = http.get(
    `${API}/api/obras?categoria=1&precio_min=500&precio_max=3000&ordenar=precio_asc&limit=12`
  );
  check(filtradas, { 'filtros combinados 200': (r) => r.status === 200 });

  const busqueda = http.get(`${API}/api/obras?buscar=huasteco&limit=12`);
  check(busqueda, { 'búsqueda 200': (r) => r.status === 200 });

  sleep(1);
}

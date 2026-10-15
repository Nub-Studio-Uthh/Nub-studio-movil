import { apiGet } from './api';

// Las categorías casi no cambian: se guardan 5 minutos en memoria para no pedirlas
// cada vez que se abre el catálogo o los filtros.
const TTL_MS = 5 * 60 * 1000;
let cache = { data: null, at: 0 };

/** Categorías activas (GET /api/categorias, público). */
export async function getCategorias({ signal, force = false } = {}) {
  if (!force && cache.data && Date.now() - cache.at < TTL_MS) return cache.data;
  const body = await apiGet('/api/categorias', { signal });
  const data = Array.isArray(body?.data)
    ? body.data.map((c) => ({
        id: c.id_categoria,
        nombre: c.nombre ?? '',
        slug: c.slug ?? '',
        total: Number(c.total_obras) || 0,
      }))
    : [];
  cache = { data, at: Date.now() };
  return data;
}

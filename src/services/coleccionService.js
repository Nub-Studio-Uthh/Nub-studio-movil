import { apiGet } from './api';

/** Colecciones publicadas para los chips de Inicio (GET /api/colecciones, público). */
export async function getColecciones({ limit = 6, signal } = {}) {
  const body = await apiGet('/api/colecciones', { params: { limit }, signal });
  return Array.isArray(body?.data)
    ? body.data.map((c) => ({ id: c.id_coleccion, nombre: c.nombre ?? '', slug: c.slug ?? '' }))
    : [];
}

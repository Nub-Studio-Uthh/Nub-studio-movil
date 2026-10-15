import { apiGet } from './api';

/** Colecciones publicadas para los chips de Inicio (GET /api/colecciones, público). */
export async function getColecciones({ limit = 6, signal } = {}) {
  const body = await apiGet('/api/colecciones', { params: { limit }, signal });
  return Array.isArray(body?.data)
    ? body.data.map((c) => ({ id: c.id_coleccion, nombre: c.nombre ?? '', slug: c.slug ?? '' }))
    : [];
}

/**
 * Cuántas colecciones publicadas tiene un artista (HU-03). Se pide 1 sola colección
 * y se usa el total de la paginación (GET /api/colecciones?id_artista=…, público).
 * @param {number|string} idArtista
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getTotalColecciones(idArtista, { signal } = {}) {
  const body = await apiGet('/api/colecciones', {
    params: { id_artista: idArtista, limit: 1 },
    signal,
  });
  return Number(body?.pagination?.total) || 0;
}

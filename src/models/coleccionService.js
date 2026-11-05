import { ApiError, apiGet } from './api';
import { normalizarColeccion } from '../utils/colecciones';

/**
 * Colecciones publicadas para la pantalla Colecciones (HU-04). GET /api/colecciones, público:
 * el backend solo regresa las publicadas, primero las destacadas y luego las más recientes.
 * @param {{ limit?: number, signal?: AbortSignal }} [options]
 */
export async function getColeccionesPublicas({ limit = 50, signal } = {}) {
  const body = await apiGet('/api/colecciones', { params: { page: 1, limit }, signal });
  return Array.isArray(body?.data) ? body.data.map(normalizarColeccion) : [];
}

/**
 * Una colección con su historia y sus obras publicadas (HU-04).
 * GET /api/colecciones/slug/:slug, público. Responde 404 si no existe o no está publicada.
 * @param {string} slug
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getColeccion(slug, { signal } = {}) {
  if (typeof slug !== 'string' || !slug.trim()) {
    throw new ApiError('No encontramos lo que buscabas.', 404);
  }
  const body = await apiGet(`/api/colecciones/slug/${encodeURIComponent(slug)}`, { signal });
  return normalizarColeccion(body?.data);
}

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

import { ApiError, apiGet } from './api';
import { normalizarObra, parametrosObras } from '../utils/obras';
import { normalizarObraDetalle } from '../utils/obraDetalle';

/**
 * Lista de obras publicadas con filtros y paginación (GET /api/obras, público).
 * @param {object} filtros ver FILTROS_INICIALES en utils/obras
 * @param {{ page?: number, limit?: number, signal?: AbortSignal }} [options]
 */
export async function getObras(filtros, { page = 1, limit = 12, signal } = {}) {
  const body = await apiGet('/api/obras', {
    params: parametrosObras(filtros, { page, limit }),
    signal,
  });
  const items = Array.isArray(body?.data) ? body.data.map(normalizarObra) : [];
  const total = Number(body?.pagination?.total) || 0;
  const totalPages = Number(body?.pagination?.totalPages) || 0;
  return { items, total, page, totalPages };
}

/**
 * Obras destacadas para el carrusel de Inicio.
 * Se usa GET /api/obras?destacadas=true: el endpoint /api/obras/destacadas del backend
 * intenta modificar req.query, que en Express 5 es de solo lectura, y devuelve todas las obras.
 */
export async function getDestacadas({ limit = 6, signal } = {}) {
  const body = await apiGet('/api/obras', { params: { destacadas: 'true', limit }, signal });
  return Array.isArray(body?.data) ? body.data.map(normalizarObra) : [];
}

/**
 * Detalle de una obra (GET /api/obras/:id, público).
 * @param {number|string} id id_obra
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getObra(id, { signal } = {}) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new ApiError('No encontramos lo que buscabas.', 404);
  const body = await apiGet(`/api/obras/${n}`, { signal });
  if (!body?.data) throw new ApiError('No encontramos lo que buscabas.', 404);
  return normalizarObraDetalle(body.data);
}

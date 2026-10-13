import { apiGet } from './api';
import { normalizarObra, parametrosObras } from '../utils/obras';

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

/** Obras destacadas para el carrusel de Inicio (GET /api/obras/destacadas). */
export async function getDestacadas({ limit = 6, signal } = {}) {
  const body = await apiGet('/api/obras/destacadas', { params: { limit }, signal });
  return Array.isArray(body?.data) ? body.data.map(normalizarObra) : [];
}

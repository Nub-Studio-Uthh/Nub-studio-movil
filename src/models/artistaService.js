import { ApiError, apiGet } from './api';
import { normalizarArtista } from '../utils/artistas';

/**
 * Perfil público de un artista con sus obras (GET /api/artistas/:id, público).
 * @param {number|string} id id_artista
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getArtista(id, { signal } = {}) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new ApiError('No encontramos lo que buscabas.', 404);
  const body = await apiGet(`/api/artistas/${n}`, { signal });
  if (!body?.data) throw new ApiError('No encontramos lo que buscabas.', 404);
  return normalizarArtista(body.data);
}

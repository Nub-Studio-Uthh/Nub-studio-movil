import { ApiError, apiDelete, apiGet, apiPost } from './api';
import { normalizarFavorito } from '../utils/favoritos';

// Favoritos (HU-07). Todas las rutas piden sesión de cliente (token JWT).

const idValido = (idObra) => {
  const id = Number(idObra);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError('La obra no es válida.', 400);
  return id;
};

/**
 * Obras guardadas, de la más reciente a la más antigua (GET /api/favoritos).
 * @param {string} token
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getFavoritos(token, { signal } = {}) {
  const body = await apiGet('/api/favoritos', { token, signal });
  return Array.isArray(body?.data) ? body.data.map(normalizarFavorito) : [];
}

/**
 * true si la obra está en los favoritos (GET /api/favoritos/check/:id_obra).
 * @param {string} token
 * @param {number|string} idObra
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function esFavorito(token, idObra, { signal } = {}) {
  const body = await apiGet(`/api/favoritos/check/${idValido(idObra)}`, { token, signal });
  return body?.esFavorito === true;
}

/**
 * Agrega la obra (POST /api/favoritos/:id_obra). El backend alterna: si ya estaba, la quita,
 * así que se regresa cómo quedó según la respuesta.
 * @returns {Promise<boolean>} true si quedó en favoritos
 */
export async function agregarFavorito(token, idObra) {
  const body = await apiPost(`/api/favoritos/${idValido(idObra)}`, {}, { token });
  return body?.accion !== 'eliminado';
}

/**
 * Quita la obra (DELETE /api/favoritos/:id_obra). Si ya no estaba (404) también cuenta
 * como quitada.
 */
export async function quitarFavorito(token, idObra) {
  try {
    await apiDelete(`/api/favoritos/${idValido(idObra)}`, { token });
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) throw error;
  }
}

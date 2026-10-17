import { ApiError, apiDelete, apiGet, apiPost } from './api';
import { normalizarItemCarrito } from '../utils/carrito';

// Carrito (HU-08). Todas las rutas piden sesión de cliente (token JWT).
// El carrito vive en el backend, así que es el mismo que ve la persona en la web.

const idValido = (id, mensaje) => {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new ApiError(mensaje, 400);
  return n;
};

/**
 * Líneas del carrito, de la más reciente a la más antigua (GET /api/carrito).
 * @param {string} token
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getCarrito(token, { signal } = {}) {
  const body = await apiGet('/api/carrito', { token, signal });
  return Array.isArray(body?.data) ? body.data.map(normalizarItemCarrito) : [];
}

/**
 * Agrega una obra (POST /api/carrito). Si ya estaba, el backend deja la cantidad indicada.
 * Los mensajes del backend para 400/404 ("Esta obra está agotada", "Obra no disponible")
 * ya vienen listos para mostrarse, así que se conservan.
 * @param {string} token
 * @param {number|string} idObra
 * @param {number} [cantidad]
 * @returns {Promise<number|null>} id de la línea del carrito
 */
export async function agregarAlCarrito(token, idObra, cantidad = 1) {
  const id_obra = idValido(idObra, 'La obra no es válida.');
  try {
    const body = await apiPost('/api/carrito', { id_obra, cantidad }, { token });
    return body?.id_carrito ?? null;
  } catch (error) {
    const mensaje = error instanceof ApiError ? error.data?.message : null;
    if (typeof mensaje === 'string' && (error.status === 400 || error.status === 404)) {
      throw new ApiError(mensaje, error.status, error.data);
    }
    throw error;
  }
}

/**
 * Quita una línea del carrito (DELETE /api/carrito/:id_carrito). Ojo: es el id de la línea,
 * no el de la obra. Si ya no estaba (404) también cuenta como quitada.
 */
export async function quitarDelCarrito(token, idCarrito) {
  try {
    await apiDelete(`/api/carrito/${idValido(idCarrito, 'El artículo no es válido.')}`, { token });
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) throw error;
  }
}

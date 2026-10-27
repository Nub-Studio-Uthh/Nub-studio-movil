import { ApiError, apiDelete, apiGet, apiPost } from './api';
import { normalizarComentario } from '../utils/comentarios';

const idValido = (id) => {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new ApiError('No encontramos lo que buscabas.', 404);
  return n;
};

// En estos casos el backend explica por qué rechazó el comentario (palabras no permitidas,
// demasiado largo, demasiados seguidos); ese mensaje es más útil que el genérico.
const conMensajeDelBackend = (error) => {
  if (error instanceof ApiError && [400, 422, 429].includes(error.status)) {
    const mensaje = error.data?.message;
    if (typeof mensaje === 'string' && mensaje.trim()) {
      return new ApiError(mensaje, error.status, error.data);
    }
  }
  return error;
};

/**
 * Comentarios aprobados de una publicación, en árbol (GET, público).
 * @param {number} idPost
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getComentarios(idPost, { signal } = {}) {
  const body = await apiGet(`/api/blog/posts/${idValido(idPost)}/comentarios`, { signal });
  return Array.isArray(body?.data) ? body.data.map(normalizarComentario) : [];
}

/**
 * Publica un comentario o una respuesta (cliente o artista).
 * Los comentarios con enlaces quedan pendientes de revisión.
 * @returns {Promise<{ id: number|null, pendiente: boolean }>}
 */
export async function crearComentario(token, idPost, contenido, padreId = null) {
  const body = padreId ? { contenido, padre_id: padreId } : { contenido };
  try {
    const r = await apiPost(`/api/blog/posts/${idValido(idPost)}/comentarios`, body, { token });
    return { id: r?.data?.id_comentario ?? null, pendiente: r?.data?.estado === 'pendiente' };
  } catch (error) {
    throw conMensajeDelBackend(error);
  }
}

/** Borra un comentario propio (el backend solo deja borrar los de la misma cuenta). */
export async function eliminarComentario(token, idComentario) {
  try {
    await apiDelete(`/api/blog/comentarios/${idValido(idComentario)}`, { token });
  } catch (error) {
    throw conMensajeDelBackend(error);
  }
}

// Funciones puras de los comentarios del blog (HU-05): convertir datos de la API,
// contarlos y validar lo que escribe la persona usuaria.

/** Largo máximo que acepta el backend. */
export const MAX_COMENTARIO = 2000;

/** El backend permite 3 niveles (0, 1 y 2): a un comentario de nivel 2 ya no se le responde. */
export const MAX_NIVEL = 2;

/**
 * Convierte un comentario de GET /api/blog/posts/:id/comentarios, con sus respuestas.
 * @param {Record<string, any>} raw
 */
export function normalizarComentario(raw) {
  return {
    id: raw?.id_comentario ?? null,
    idUsuario: raw?.id_usuario ?? null,
    padreId: raw?.padre_id ?? null,
    nivel: Number(raw?.nivel) || 0,
    contenido: typeof raw?.contenido === 'string' ? raw.contenido : '',
    autor: raw?.autor_nombre || 'Usuario de NU-B Studio',
    esArtista: raw?.usuario_rol === 'artista',
    fecha: raw?.fecha_creacion ?? null,
    respuestas: Array.isArray(raw?.respuestas) ? raw.respuestas.map(normalizarComentario) : [],
  };
}

/** Total de comentarios, contando las respuestas. */
export function contarComentarios(lista) {
  if (!Array.isArray(lista)) return 0;
  return lista.reduce((n, c) => n + 1 + contarComentarios(c?.respuestas), 0);
}

/** "1 comentario", "4 comentarios". */
export function textoComentarios(total) {
  if (!Number.isInteger(total) || total <= 0) return 'Sin comentarios';
  return total === 1 ? '1 comentario' : `${total} comentarios`;
}

/**
 * Valida el texto antes de enviarlo.
 * @returns {string|null} mensaje de error, o null si se puede enviar
 */
export function validarComentario(texto) {
  const limpio = String(texto ?? '').trim();
  if (!limpio) return 'Escribe tu comentario.';
  if (limpio.length > MAX_COMENTARIO) {
    return `Tu comentario no puede pasar de ${MAX_COMENTARIO} caracteres.`;
  }
  return null;
}

/** Comentan clientes y artistas; el backend responde 403 a las demás cuentas. */
export function puedeComentar(usuario) {
  return !usuario?.rol || usuario.rol === 'cliente' || usuario.rol === 'artista';
}

/** Un comentario acepta respuestas si no está en el último nivel. */
export function aceptaRespuestas(comentario) {
  return (Number(comentario?.nivel) || 0) < MAX_NIVEL;
}

/**
 * id_usuario guardado dentro del token JWT de la sesión (para saber qué comentarios son
 * propios y se pueden borrar). Solo se lee: la validez del token la revisa el backend.
 * @param {string|null|undefined} token
 * @returns {number|null}
 */
export function idUsuarioDeToken(token) {
  try {
    const parte = String(token ?? '').split('.')[1];
    if (!parte) return null;
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/');
    const relleno = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const datos = JSON.parse(globalThis.atob(relleno));
    const id = Number(datos?.id_usuario ?? datos?.id);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

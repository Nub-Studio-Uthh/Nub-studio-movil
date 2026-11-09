import { ApiError, apiGet, apiPut } from './api';
import { normalizarPerfil } from '../utils/perfil';

const RUTA = '/api/auth/perfil';

/** Usa el mensaje del servidor para los datos rechazados o la cuenta que ya no existe. */
function conMensajeDelServidor(error) {
  if (!(error instanceof ApiError) || ![400, 404].includes(error.status)) return error;
  const mensaje = error.data?.errors?.[0]?.mensaje ?? error.data?.message;
  return mensaje ? new ApiError(mensaje, error.status, error.data) : error;
}

/**
 * Datos del cliente (derecho ARCO de Acceso). GET /api/auth/perfil, solo clientes.
 * @param {string} token
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getPerfil(token, { signal } = {}) {
  const body = await apiGet(RUTA, { token, signal });
  return normalizarPerfil(body?.data);
}

/**
 * Corrige datos o cambia la preferencia de marketing (ARCO: Rectificación y Oposición).
 * PUT /api/auth/perfil. El backend solo cambia los campos enviados.
 * @param {string} token
 * @param {{ nombre?: string, telefono?: string, aceptaMarketing?: boolean }} cambios
 */
export async function actualizarPerfil(token, { aceptaMarketing, ...datos }) {
  const cuerpo =
    aceptaMarketing === undefined ? datos : { ...datos, acepta_marketing: aceptaMarketing };
  try {
    const body = await apiPut(RUTA, cuerpo, { token });
    return normalizarPerfil(body?.data);
  } catch (error) {
    throw conMensajeDelServidor(error);
  }
}

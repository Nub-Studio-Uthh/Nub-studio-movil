import { buildQueryString, joinUrl } from '../utils/query';

// URL del backend. EXPO_PUBLIC_* queda dentro de la app: aquí nunca van secretos.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const TIMEOUT_MS = 15000;

// Mensajes para la persona usuaria. No se muestran los mensajes del servidor tal cual,
// para no exponer detalles internos.
const MENSAJES = {
  400: 'La búsqueda tiene datos que no son válidos.',
  404: 'No encontramos lo que buscabas.',
  429: 'Hiciste muchas solicitudes seguidas. Espera un momento e inténtalo de nuevo.',
  500: 'El servidor tuvo un problema. Inténtalo más tarde.',
};
const SIN_CONEXION = 'No pudimos conectar con el servidor. Revisa tu conexión a internet.';
const TIEMPO_AGOTADO = 'La conexión tardó demasiado. Inténtalo de nuevo.';

export class ApiError extends Error {
  /**
   * @param {string} message mensaje listo para mostrarse
   * @param {number} status código HTTP (0 si no hubo respuesta)
   */
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** true si el error viene de cancelar la petición (no se muestra a la persona usuaria). */
export const isAbortError = (error) => error?.name === 'AbortError';

/**
 * GET a la API pública. Devuelve el JSON de la respuesta.
 * @param {string} path ruta, p. ej. "/api/obras"
 * @param {{ params?: Record<string, unknown>, signal?: AbortSignal }} [options]
 */
export async function apiGet(path, { params, signal } = {}) {
  if (!BASE_URL) {
    throw new ApiError('Falta configurar EXPO_PUBLIC_API_URL en el archivo .env.', 0);
  }

  const query = buildQueryString(params);
  const url = joinUrl(BASE_URL, path) + (query ? `?${query}` : '');

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort);

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) throw new ApiError(TIEMPO_AGOTADO, 0);
    if (isAbortError(error)) throw error;
    throw new ApiError(SIN_CONEXION, 0);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onExternalAbort);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      MENSAJES[response.status] ??
      (response.status >= 500 ? MENSAJES[500] : 'No pudimos completar la solicitud.');
    throw new ApiError(message, response.status);
  }
  return body;
}

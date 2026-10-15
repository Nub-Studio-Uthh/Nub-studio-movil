import { buildQueryString, joinUrl } from '../utils/query';

// URL del backend. EXPO_PUBLIC_* queda dentro de la app: aquí nunca van secretos.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const TIMEOUT_MS = 15000;

// Mensajes genéricos para la persona usuaria. Cada servicio puede traducir los suyos.
const MENSAJES = {
  400: 'La solicitud tiene datos que no son válidos.',
  401: 'Tu sesión no es válida. Inicia sesión de nuevo.',
  403: 'No tienes permiso para hacer esto.',
  404: 'No encontramos lo que buscabas.',
  409: 'Esta información ya existe.',
  429: 'Hiciste muchas solicitudes seguidas. Espera un momento e inténtalo de nuevo.',
  500: 'El servidor tuvo un problema. Inténtalo más tarde.',
};
const SIN_CONEXION = 'No pudimos conectar con el servidor. Revisa tu conexión a internet.';
const TIEMPO_AGOTADO = 'La conexión tardó demasiado. Inténtalo de nuevo.';

export class ApiError extends Error {
  /**
   * @param {string} message mensaje listo para mostrarse
   * @param {number} status código HTTP (0 si no hubo respuesta)
   * @param {unknown} [data] cuerpo de la respuesta de error, si hubo
   */
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/** true si el error viene de cancelar la petición (no se muestra a la persona usuaria). */
export const isAbortError = (error) => error?.name === 'AbortError';

async function request(method, path, { params, body, token, signal } = {}) {
  if (!BASE_URL) {
    throw new ApiError('Falta configurar EXPO_PUBLIC_API_URL en el archivo .env.', 0);
  }

  const query = buildQueryString(params);
  const url = joinUrl(BASE_URL, path) + (query ? `?${query}` : '');

  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

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
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
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

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      MENSAJES[response.status] ??
      (response.status >= 500 ? MENSAJES[500] : 'No pudimos completar la solicitud.');
    throw new ApiError(message, response.status, data);
  }
  return data;
}

/** GET. @param {{ params?: Record<string, unknown>, token?: string, signal?: AbortSignal }} [options] */
export const apiGet = (path, options) => request('GET', path, options);

/** POST con body JSON. */
export const apiPost = (path, body, options) => request('POST', path, { ...options, body });

/** PUT con body JSON. */
export const apiPut = (path, body, options) => request('PUT', path, { ...options, body });

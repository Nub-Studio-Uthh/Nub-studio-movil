/**
 * Convierte un objeto en query string, codificando cada valor y omitiendo los vacíos.
 * Ej: { categoria: 3, buscar: 'rojo vivo', page: undefined } -> "categoria=3&buscar=rojo%20vivo"
 * @param {Record<string, unknown>} [params]
 * @returns {string}
 */
export function buildQueryString(params) {
  if (!params || typeof params !== 'object') return '';
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

/**
 * Une la URL base con la ruta sin duplicar ni perder diagonales.
 * @param {string} base
 * @param {string} path
 */
export function joinUrl(base, path) {
  return `${String(base).replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}`;
}

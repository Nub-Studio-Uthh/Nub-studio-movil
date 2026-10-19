// Funciones puras de Finalizar compra (HU-09).

/**
 * URL de la sección de pago de la plataforma web (ruta /checkout de la web).
 * Acepta http solo para desarrollo en red local; devuelve null si la base no es una URL válida.
 * @param {string|undefined} base valor de EXPO_PUBLIC_WEB_URL
 * @returns {string|null}
 */
export function urlPagoWeb(base) {
  if (typeof base !== 'string') return null;
  const limpia = base.trim().replace(/\/+$/, '');
  if (!/^https?:\/\/[^\s/]+/i.test(limpia)) return null;
  return `${limpia}/checkout`;
}

/**
 * Resumen corto del pedido: "Tejido de la Sierra y 1 obra más".
 * @param {{ titulo: string }[]} items
 */
export function resumenObras(items) {
  if (!Array.isArray(items) || items.length === 0) return '';
  const [primera, ...resto] = items;
  if (resto.length === 0) return primera.titulo;
  return `${primera.titulo} y ${resto.length} ${resto.length === 1 ? 'obra' : 'obras'} más`;
}

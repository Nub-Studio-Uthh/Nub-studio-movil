// Funciones puras de Finalizar compra (HU-09).

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

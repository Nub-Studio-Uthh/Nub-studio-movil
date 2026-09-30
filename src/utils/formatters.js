/**
 * Formatea un monto en pesos mexicanos. Ej: 5250 -> "$5,250 MXN"
 * @param {number} monto
 * @returns {string}
 */
export function formatearPrecio(monto) {
  if (typeof monto !== 'number' || Number.isNaN(monto) || monto < 0) {
    return '$0 MXN';
  }
  const texto = monto.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return `$${texto} MXN`;
}

/**
 * Suma el total del carrito (HU-08).
 * @param {{ precio: number, cantidad?: number }[]} items
 * @returns {number}
 */
export function calcularTotalCarrito(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((total, item) => {
    const precio = Number(item?.precio) || 0;
    const cantidad = Number(item?.cantidad ?? 1) || 0;
    return total + precio * cantidad;
  }, 0);
}

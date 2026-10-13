/**
 * Formatea un monto en pesos mexicanos. Ej: 5250 -> "$5,250 MXN"
 * Con { moneda: false } omite " MXN" (tarjetas del catálogo): 5250 -> "$5,250"
 * @param {number} monto
 * @param {{ moneda?: boolean }} [opciones]
 * @returns {string}
 */
export function formatearPrecio(monto, { moneda = true } = {}) {
  const sufijo = moneda ? ' MXN' : '';
  if (typeof monto !== 'number' || Number.isNaN(monto) || monto < 0) {
    return `$0${sufijo}`;
  }
  const texto = monto.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return `$${texto}${sufijo}`;
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

// Funciones puras del carrito (HU-08): convertir datos de la API al formato de la app.

const toNumber = (value) => {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * Convierte una línea de GET /api/carrito.
 * - precio: lo que se cobra por pieza (con descuento vigente si lo hay). Es el que usa
 *   calcularTotalCarrito.
 * - precioLista / precioOferta: para mostrar el precio tachado en PriceTag.
 * - idCarrito: id de la línea (el que usan PUT y DELETE); id: id de la obra.
 * @param {Record<string, any>} raw
 */
export function normalizarItemCarrito(raw) {
  const lista = toNumber(raw?.precio_base) ?? 0;
  const efectivo = toNumber(raw?.precio_efectivo) ?? lista;
  const enOferta = raw?.tiene_descuento === true && efectivo < lista;
  return {
    idCarrito: raw?.id_carrito,
    id: raw?.id_obra,
    slug: raw?.slug ?? '',
    titulo: raw?.titulo ?? '',
    imagen: raw?.imagen_principal ?? null,
    artista: raw?.artista_alias ?? '',
    cantidad: Math.max(1, Number.parseInt(raw?.cantidad, 10) || 1),
    precio: efectivo,
    precioLista: lista,
    precioOferta: enOferta ? efectivo : null,
  };
}

/** Piezas en el carrito (suma de cantidades). */
export function contarPiezas(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((total, item) => total + (Number(item?.cantidad) || 0), 0);
}

/** "1 obra", "2 obras". */
export function textoObras(total) {
  const n = Number.isInteger(total) && total > 0 ? total : 0;
  return n === 1 ? '1 obra' : `${n} obras`;
}

/** Texto del botón de pago: "Pagar 1 obra", "Pagar 2 obras". */
export function textoPagar(total) {
  return `Pagar ${textoObras(total)}`;
}

/** El carrito solo existe para cuentas de cliente (el backend responde 403 a las demás). */
export function puedeTenerCarrito(usuario) {
  return !usuario?.rol || usuario.rol === 'cliente';
}

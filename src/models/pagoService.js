import { ApiError, apiPost } from './api';
import { urlDePago } from '../utils/direccion';

/**
 * Crea el pedido con las obras del carrito y el pago en Mercado Pago
 * (POST /api/ventas/checkout). El backend vacía esas obras del carrito y reserva el stock.
 * @param {string} token
 * @param {number} idDireccion
 * @param {number[]} [idsCarrito] solo estas líneas del carrito ("Comprar ahora"); sin ellas, todo
 * @returns {Promise<{ idPedido: number, url: string }>}
 */
export async function crearPago(token, idDireccion, idsCarrito) {
  const datos = { id_direccion_envio: idDireccion };
  if (Array.isArray(idsCarrito) && idsCarrito.length) datos.ids_carrito = idsCarrito;
  let body;
  try {
    body = await apiPost('/api/ventas/checkout', datos, { token });
  } catch (error) {
    // 400: carrito vacío o sin stock; el backend explica cuál.
    const mensaje = error?.data?.message;
    if (error instanceof ApiError && error.status === 400 && typeof mensaje === 'string') {
      throw new ApiError(mensaje, 400, error.data);
    }
    throw error;
  }
  const url = urlDePago(body);
  if (!url) throw new ApiError('No pudimos abrir Mercado Pago. Inténtalo de nuevo.', 500);
  return { idPedido: Number(body?.id_pedido) || null, url };
}

import { apiGet } from './api';
import { normalizarPedidos } from '../utils/pedidos';

// Mis pedidos (HU-10). Pide sesión de cliente (token JWT). Solo consulta.
// Incluye los pedidos hechos en la web: es la misma cuenta y la misma base de datos.

/**
 * Pedidos del cliente, del más reciente al más antiguo (GET /api/ventas/mis-pedidos).
 * El backend no tiene un endpoint de detalle: el detalle sale de esta misma lista.
 * @param {string} token
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getPedidos(token, { signal } = {}) {
  const body = await apiGet('/api/ventas/mis-pedidos', { token, signal });
  return normalizarPedidos(body?.data);
}

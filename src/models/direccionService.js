import { ApiError, apiGet, apiPost } from './api';
import { cuerpoDireccion, normalizarLugar } from '../utils/direccion';

/** Estados de México activos (GET /api/estados, público). */
export async function getEstados({ signal } = {}) {
  const body = await apiGet('/api/estados', { signal });
  return Array.isArray(body?.data) ? body.data.map((e) => normalizarLugar(e, 'id_estado')) : [];
}

/** Municipios activos de un estado (GET /api/municipios/:id_estado, público). */
export async function getMunicipios(idEstado, { signal } = {}) {
  const id = Number(idEstado);
  if (!Number.isInteger(id) || id <= 0) return [];
  const body = await apiGet(`/api/municipios/${id}`, { signal });
  return Array.isArray(body?.data) ? body.data.map((m) => normalizarLugar(m, 'id_municipio')) : [];
}

/**
 * Guarda la dirección de envío del cliente (POST /api/direcciones).
 * @returns {Promise<number>} id_direccion
 */
export async function crearDireccion(token, direccion) {
  const body = await apiPost('/api/direcciones', cuerpoDireccion(direccion), { token });
  const id = Number(body?.id_direccion);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError('No pudimos guardar tu dirección. Inténtalo de nuevo.', 500);
  }
  return id;
}

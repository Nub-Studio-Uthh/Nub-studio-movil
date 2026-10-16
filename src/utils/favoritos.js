// Funciones puras de favoritos (HU-07): convertir datos de la API al formato de la app.
import { normalizarObra } from './obras';

/**
 * Convierte un favorito de GET /api/favoritos en una obra para la lista.
 * disponible = false si la obra ya no está publicada (se puede quitar, pero no comprar).
 * @param {Record<string, any>} raw
 */
export function normalizarFavorito(raw) {
  return {
    ...normalizarObra(raw),
    disponible: raw?.estado === undefined || raw?.estado === 'publicada',
  };
}

/** "1 obra guardada", "3 obras guardadas". Cadena vacía si no hay ninguna. */
export function textoGuardadas(total) {
  if (!Number.isInteger(total) || total <= 0) return '';
  return total === 1 ? '1 obra guardada' : `${total} obras guardadas`;
}

/** Los favoritos solo existen para cuentas de cliente (el backend responde 403 a las demás). */
export function puedeTenerFavoritos(usuario) {
  return !usuario?.rol || usuario.rol === 'cliente';
}

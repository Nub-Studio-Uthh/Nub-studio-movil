// Funciones puras de colecciones (HU-04): convertir datos de la API al formato de la app.
import { normalizarObra } from './obras';

const aEntero = (valor) => {
  const n = typeof valor === 'number' ? valor : parseInt(valor, 10);
  return Number.isInteger(n) && n >= 0 ? n : null;
};

const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '');

/**
 * Convierte una colección de /api/colecciones (lista) o /api/colecciones/slug/:slug
 * (detalle) al formato que usa la app. Solo conserva datos públicos.
 * @param {Record<string, any>} raw
 */
export function normalizarColeccion(raw) {
  const artista = texto(raw?.artista_alias) || texto(raw?.artista_nombre);
  const obras = Array.isArray(raw?.obras)
    ? raw.obras.map((o) => normalizarObra({ ...o, artista_alias: artista }))
    : [];
  return {
    id: raw?.id_coleccion ?? null,
    slug: texto(raw?.slug),
    nombre: texto(raw?.nombre),
    historia: texto(raw?.historia),
    portada: raw?.imagen_portada ?? null,
    destacada: raw?.destacada === true,
    artista,
    artistaId: raw?.id_artista ?? null,
    artistaFoto: raw?.artista_foto ?? null,
    // La lista trae el conteo; el detalle trae las obras.
    totalObras: aEntero(raw?.total_obras) ?? (Array.isArray(raw?.obras) ? obras.length : null),
    obras,
  };
}

/** "1 obra", "3 obras". Cadena vacía si no hay número válido o es 0. */
export function textoObras(total) {
  if (!Number.isInteger(total) || total <= 0) return '';
  return total === 1 ? '1 obra' : `${total} obras`;
}

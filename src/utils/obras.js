// Funciones puras del catálogo (HU-01): convertir datos de la API y armar filtros.

const toNumber = (value) => {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * Solo se aceptan imágenes por https (OWASP MASVS-NETWORK). Si la imagen está en
 * Cloudinary, se pide una versión del ancho necesario en lugar de la foto original.
 * @param {string|null|undefined} url
 * @param {number} [width] ancho en píxeles físicos
 * @returns {string|null}
 */
export function imagenSegura(url, width) {
  if (typeof url !== 'string' || !url.startsWith('https://')) return null;
  const marca = '/image/upload/';
  if (!width || !url.includes('res.cloudinary.com') || !url.includes(marca)) return url;
  const [antes, despues] = url.split(marca);
  // Si ya trae una transformación (p. ej. "w_800,..."), se respeta.
  if (/^[a-z]{1,3}_[^/]+\//.test(despues)) return url;
  const w = Math.ceil(width / 100) * 100;
  return `${antes}${marca}w_${w},c_limit,f_auto,q_auto/${despues}`;
}

/**
 * Convierte una obra de /api/obras al formato que usa la app.
 * @param {Record<string, any>} raw
 */
export function normalizarObra(raw) {
  const precio = toNumber(raw?.precio_minimo) ?? toNumber(raw?.precio_base) ?? 0;
  const oferta = toNumber(raw?.precio_oferta);
  return {
    id: raw?.id_obra,
    slug: raw?.slug ?? '',
    titulo: raw?.titulo ?? '',
    imagen: raw?.imagen_principal ?? null,
    artista: raw?.artista_alias || raw?.artista_nombre || '',
    categoria: raw?.categoria_nombre ?? '',
    precio,
    precioOferta: oferta !== null && oferta < precio ? oferta : null,
    destacada: raw?.destacada === true,
  };
}

export const ORDENES = [
  { value: 'recientes', label: 'Recientes' },
  { value: 'precio_asc', label: 'Precio: menor a mayor' },
  { value: 'precio_desc', label: 'Precio: mayor a menor' },
  { value: 'nombre', label: 'Nombre (A-Z)' },
];

export const FILTROS_INICIALES = {
  categoria: null, // { id, nombre } o null = todas
  precioMin: null,
  precioMax: null,
  ordenar: 'recientes',
  buscar: '',
};

// El backend acepta búsquedas de 2 a 100 caracteres (letras, números, espacios y guiones).
const BUSQUEDA_VALIDA = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s-]+$/;

/** Texto de búsqueda listo para enviar, o '' si no es válido. */
export function limpiarBusqueda(texto) {
  const t = typeof texto === 'string' ? texto.trim().replace(/\s+/g, ' ') : '';
  if (t.length < 2 || t.length > 100 || !BUSQUEDA_VALIDA.test(t)) return '';
  return t;
}

/**
 * Parámetros para GET /api/obras a partir de los filtros de la pantalla.
 * @param {typeof FILTROS_INICIALES} filtros
 * @param {{ page?: number, limit?: number }} [paginacion]
 */
export function parametrosObras(filtros, { page = 1, limit = 12 } = {}) {
  const f = { ...FILTROS_INICIALES, ...filtros };
  return {
    page,
    limit,
    ordenar: ORDENES.some((o) => o.value === f.ordenar) ? f.ordenar : 'recientes',
    categoria: f.categoria?.id ?? undefined,
    precio_min: f.precioMin ?? undefined,
    precio_max: f.precioMax ?? undefined,
    buscar: limpiarBusqueda(f.buscar) || undefined,
  };
}

/**
 * Valida el rango de precio antes de enviarlo (el backend rechaza máximo < mínimo).
 * @returns {string|null} mensaje de error o null si es válido
 */
export function validarRangoPrecio(min, max) {
  const vacio = (v) => v === null || v === undefined || v === '';
  if (!vacio(min) && (!Number.isFinite(min) || min < 0)) return 'El precio mínimo no es válido.';
  if (!vacio(max) && (!Number.isFinite(max) || max < 0)) return 'El precio máximo no es válido.';
  if (!vacio(min) && !vacio(max) && max < min) {
    return 'El precio máximo debe ser mayor o igual al mínimo.';
  }
  return null;
}

/** Cuántos filtros de la hoja de filtros están activos (categoría y precio). */
export function contarFiltros(filtros) {
  const f = { ...FILTROS_INICIALES, ...filtros };
  return (f.categoria ? 1 : 0) + (f.precioMin !== null || f.precioMax !== null ? 1 : 0);
}

/** true si hay algo que limpiar: filtros o búsqueda. */
export function hayFiltrosActivos(filtros) {
  return contarFiltros(filtros) > 0 || limpiarBusqueda(filtros?.buscar) !== '';
}

/** Convierte el texto de un campo de precio en número entero, o null si está vacío. */
export function leerPrecio(texto) {
  const limpio = String(texto ?? '').replace(/[^\d]/g, '');
  if (limpio === '') return null;
  return Math.min(parseInt(limpio, 10), 9999999);
}

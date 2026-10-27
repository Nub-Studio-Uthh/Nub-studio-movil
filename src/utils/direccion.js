// Funciones puras de la dirección de envío y del pago (HU-09).
// Los límites son los de la tabla direcciones del backend.

export const DIRECCION_VACIA = {
  calle: '',
  numeroExterior: '',
  numeroInterior: '',
  colonia: '',
  estado: null, // { id, nombre }
  municipio: null, // { id, nombre }
  codigoPostal: '',
  referencias: '',
};

const LIMITES = {
  calle: 255,
  numeroExterior: 20,
  numeroInterior: 20,
  colonia: 150,
  referencias: 500,
};

/**
 * Valida la dirección antes de enviarla.
 * @returns {Record<string, string>} mensaje por campo; vacío si todo está bien
 */
export function validarDireccion(d) {
  const e = {};
  const texto = (v) => String(v ?? '').trim();
  if (!texto(d?.calle)) e.calle = 'Escribe la calle.';
  else if (texto(d.calle).length > LIMITES.calle) e.calle = 'La calle es demasiado larga.';
  if (!texto(d?.numeroExterior)) e.numeroExterior = 'Escribe el número exterior.';
  else if (texto(d.numeroExterior).length > LIMITES.numeroExterior)
    e.numeroExterior = 'Máximo 20 caracteres.';
  if (texto(d?.numeroInterior).length > LIMITES.numeroInterior)
    e.numeroInterior = 'Máximo 20 caracteres.';
  if (!texto(d?.colonia)) e.colonia = 'Escribe la colonia.';
  else if (texto(d.colonia).length > LIMITES.colonia) e.colonia = 'La colonia es demasiado larga.';
  if (!d?.estado?.id) e.estado = 'Elige el estado.';
  if (!d?.municipio?.id) e.municipio = 'Elige el municipio.';
  if (!/^\d{5}$/.test(texto(d?.codigoPostal))) e.codigoPostal = 'El código postal tiene 5 números.';
  if (texto(d?.referencias).length > LIMITES.referencias) e.referencias = 'Máximo 500 caracteres.';
  return e;
}

/** Cuerpo para POST /api/direcciones. */
export function cuerpoDireccion(d) {
  const opcional = (v) => String(v ?? '').trim() || null;
  return {
    calle: d.calle.trim(),
    numero_exterior: d.numeroExterior.trim(),
    numero_interior: opcional(d.numeroInterior),
    colonia: d.colonia.trim(),
    id_estado: d.estado.id,
    id_municipio: d.municipio.id,
    codigo_postal: d.codigoPostal.trim(),
    referencias: opcional(d.referencias),
  };
}

/** Firma para saber si la dirección cambió desde la última vez que se guardó. */
export const firmaDireccion = (d) => JSON.stringify(cuerpoDireccion(d));

/** Estado o municipio de la API -> { id, nombre }. */
export function normalizarLugar(raw, campoId) {
  return { id: Number(raw?.[campoId]) || null, nombre: String(raw?.nombre ?? '') };
}

/**
 * Enlace de pago de Mercado Pago que regresa el checkout. Solo acepta https.
 * @returns {string|null}
 */
export function urlDePago(respuesta) {
  const url = respuesta?.init_point || respuesta?.sandbox_init_point;
  return typeof url === 'string' && /^https:\/\//i.test(url) ? url : null;
}

/** Filtra una lista por nombre, sin importar acentos ni mayúsculas. */
export function filtrarPorNombre(lista, busqueda) {
  const normal = (s) =>
    String(s ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();
  const q = normal(busqueda);
  if (!q) return lista;
  return lista.filter((x) => normal(x.nombre).includes(q));
}

// Adapta la respuesta de GET /api/obras/:id (HU-02) a lo que muestra la pantalla de detalle.
// Solo renombra y ordena campos; los datos ya vienen resueltos del backend.

const toNumber = (value) => {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
};

const sinCeros = (n) => String(Number(n));

/** "60 × 80 cm" si vienen ancho y alto; null si falta alguno. */
function formatearDimensiones(ancho, alto, unidad) {
  const a = toNumber(ancho);
  const h = toNumber(alto);
  if (a === null || h === null) return null;
  return `${sinCeros(a)} × ${sinCeros(h)} ${unidad || 'cm'}`;
}

const aBooleano = (v) => (typeof v === 'boolean' ? v : null);

/**
 * @param {Record<string, any>} raw campo "data" de la respuesta
 */
export function normalizarObraDetalle(raw) {
  const imagenes = (Array.isArray(raw?.imagenes) ? raw.imagenes : [])
    .slice()
    .sort((a, b) => (a?.orden ?? 0) - (b?.orden ?? 0))
    .map((i) => i?.url_imagen)
    .filter((u) => typeof u === 'string' && u !== '');
  if (imagenes.length === 0 && raw?.imagen_principal) imagenes.push(raw.imagen_principal);

  // Etiquetas: solo reflejan banderas que ya manda el backend.
  const etiquetas = [];
  if (raw?.destacada === true) etiquetas.push({ label: 'Destacada', tone: 'destacada' });
  if (raw?.es_original === true) etiquetas.push({ label: 'Pieza única', tone: 'exito' });

  return {
    id: raw?.id_obra,
    titulo: raw?.titulo ?? '',
    descripcion: raw?.descripcion ?? '',
    precio: toNumber(raw?.precio_base) ?? 0,
    imagenes,
    etiquetas,
    historia: raw?.historia ?? '',
    anio: toNumber(raw?.anio_creacion),
    dimensiones: formatearDimensiones(
      raw?.dimensiones_ancho,
      raw?.dimensiones_alto,
      raw?.dimensiones_unidad
    ),
    permiteMarco: aBooleano(raw?.permite_marco),
    conCertificado: aBooleano(raw?.con_certificado),
    // Piezas que se pueden comprar (existentes menos las apartadas en pedidos sin pagar).
    // null si el backend no lo manda.
    existencias: Number.isFinite(Number(raw?.stock_disponible))
      ? Math.max(0, Math.trunc(Number(raw.stock_disponible)))
      : null,
    artista: {
      id: raw?.id_artista,
      nombre: raw?.artista_alias || raw?.artista_nombre || '',
      foto: raw?.artista_foto ?? null,
    },
  };
}

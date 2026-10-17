// Funciones puras de Mis pedidos (HU-10): agrupar y convertir los datos del API.
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGO = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const toNumber = (value) => {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
};

/** Número de pedido como lo muestra la web: 42 -> "NUB-00042". */
export function codigoPedido(id) {
  return `NUB-${String(Number(id) || 0).padStart(5, '0')}`;
}

/**
 * Fecha a mano (sin Intl, que no siempre está completo en el teléfono).
 * Ej: "18 sep 2026"; con { largo: true }: "18 de septiembre de 2026".
 */
export function formatearFecha(valor, { largo = false } = {}) {
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  return largo
    ? `${d.getDate()} de ${MESES_LARGO[d.getMonth()]} de ${d.getFullYear()}`
    : `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

// Estatus del pedido (los mismos que maneja la web). tono: color del badge.
const ESTADOS = {
  pendiente: {
    label: 'Pendiente',
    tono: 'warning',
    mensaje: 'Estamos esperando la confirmación de tu pago.',
  },
  pagado: {
    label: 'Pagado',
    tono: 'success',
    mensaje: 'Recibimos tu pago. La galería coordinará el envío contigo.',
  },
  procesando: {
    label: 'Procesando',
    tono: 'info',
    mensaje: 'Estamos preparando tu pedido.',
  },
  enviado: {
    label: 'Enviado',
    tono: 'info',
    mensaje: 'Tu pedido va en camino.',
  },
  listo_recoger: {
    label: 'Listo para recoger',
    tono: 'tertiary',
    mensaje:
      'Pasa por la galería NU-B Studio para recoger tu obra. Presenta tu nombre o el código del pedido.',
  },
  entregado: {
    label: 'Entregado',
    tono: 'success',
    mensaje: 'Tu pedido fue entregado. ¡Disfruta tu obra!',
  },
  cancelado: {
    label: 'Cancelado',
    tono: 'error',
    mensaje: 'Este pedido fue cancelado. Si tienes dudas, contacta a la galería.',
  },
};

/** @returns {{ label: string, tono: string, mensaje: string }} */
export function estadoPedido(estado) {
  if (ESTADOS[estado]) return ESTADOS[estado];
  const texto = typeof estado === 'string' && estado ? estado.replace(/_/g, ' ') : 'Sin estatus';
  return { label: texto.charAt(0).toUpperCase() + texto.slice(1), tono: 'neutral', mensaje: '' };
}

const redondear = (n) => Math.round(n * 100) / 100;
const tiempo = (fecha) => {
  const t = new Date(fecha).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/**
 * Agrupa las filas de GET /api/ventas/mis-pedidos (una por obra) en pedidos, del más
 * reciente al más antiguo. El empaque reforzado no viene como campo: es lo que sobra del
 * total después de restar las obras y sumar el descuento del cupón (igual que la web).
 * @param {Record<string, any>[]} filas
 */
export function normalizarPedidos(filas) {
  if (!Array.isArray(filas)) return [];
  const grupos = new Map();

  for (const f of filas) {
    const id = f?.id_pedido;
    if (id === undefined || id === null) continue;
    if (!grupos.has(id)) {
      grupos.set(id, {
        id,
        codigo: codigoPedido(id),
        fecha: f.fecha_pedido ?? null,
        estado: f.estado_pedido ?? 'pendiente',
        total: toNumber(f.total_pedido) ?? 0,
        descuento: toNumber(f.descuento_cupon) ?? 0,
        codigoCupon: f.codigo_cupon ?? null,
        items: [],
      });
    }
    grupos.get(id).items.push({
      id: f.id_venta,
      slug: f.slug ?? '',
      titulo: f.titulo ?? '',
      imagen: f.imagen_principal ?? null,
      artista: f.artista_alias ?? '',
      cantidad: Math.max(1, Number.parseInt(f.cantidad, 10) || 1),
      precioUnitario: toNumber(f.precio_unitario) ?? 0,
      total: toNumber(f.total) ?? toNumber(f.subtotal) ?? 0,
      numeroGuia: f.numero_guia ?? null,
    });
  }

  return [...grupos.values()]
    .map((p) => {
      const subtotal = p.items.reduce((s, i) => s + i.total, 0);
      const empaque = redondear(p.total - subtotal + p.descuento);
      return {
        ...p,
        piezas: p.items.reduce((s, i) => s + i.cantidad, 0),
        subtotal,
        empaque: empaque >= 1 ? empaque : 0,
        numeroGuia: p.items.find((i) => i.numeroGuia)?.numeroGuia ?? null,
      };
    })
    .sort((a, b) => tiempo(b.fecha) - tiempo(a.fecha));
}

/** "1 obra", "2 obras". */
export const textoObras = (total) => (total === 1 ? '1 obra' : `${total} obras`);

/** "18 sep 2026 · 2 obras" (subtítulo de la tarjeta). */
export function resumenPedido(pedido) {
  return [formatearFecha(pedido?.fecha), textoObras(pedido?.piezas ?? 0)]
    .filter(Boolean)
    .join(' · ');
}

/** Los pedidos solo existen para cuentas de cliente. */
export function puedeTenerPedidos(usuario) {
  return !usuario?.rol || usuario.rol === 'cliente';
}

import {
  codigoPedido,
  estadoPedido,
  formatearFecha,
  normalizarPedidos,
  puedeTenerPedidos,
  resumenPedido,
} from '../../src/utils/pedidos';

const fila = (extra = {}) => ({
  id_pedido: 42,
  id_venta: 1,
  titulo: 'Tejido de la Sierra',
  slug: 'tejido-de-la-sierra',
  imagen_principal: 'https://x/y.jpg',
  artista_alias: 'Juana Bautista',
  cantidad: 1,
  precio_unitario: '1850.00',
  subtotal: '1850.00',
  total: '1850.00',
  estado_pedido: 'pagado',
  fecha_pedido: '2026-09-18T15:00:00.000Z',
  total_pedido: '5250.00',
  descuento_cupon: '0',
  codigo_cupon: null,
  numero_guia: null,
  ...extra,
});

describe('codigoPedido y fechas', () => {
  it('rellena con ceros como la web', () => {
    expect(codigoPedido(42)).toBe('NUB-00042');
    expect(codigoPedido(undefined)).toBe('NUB-00000');
  });
  it('formatea la fecha sin Intl', () => {
    expect(formatearFecha('2026-09-18T15:00:00')).toBe('18 sep 2026');
    expect(formatearFecha('2026-09-18T15:00:00', { largo: true })).toBe('18 de septiembre de 2026');
    expect(formatearFecha('no es fecha')).toBe('');
  });
});

describe('estadoPedido', () => {
  it('conoce los estatus de la web', () => {
    expect(estadoPedido('pagado').label).toBe('Pagado');
    expect(estadoPedido('listo_recoger').label).toBe('Listo para recoger');
    expect(estadoPedido('cancelado').tono).toBe('error');
  });
  it('tolera un estatus desconocido', () => {
    expect(estadoPedido('en_revision')).toMatchObject({ label: 'En revision', tono: 'neutral' });
    expect(estadoPedido(undefined).label).toBe('Sin estatus');
  });
});

describe('normalizarPedidos', () => {
  it('agrupa las filas por pedido y suma piezas', () => {
    const filas = [
      fila(),
      fila({
        id_venta: 2,
        titulo: 'Máscara',
        cantidad: 2,
        total: '3400.00',
        precio_unitario: '1700.00',
      }),
      fila({ id_pedido: 43, id_venta: 3, fecha_pedido: '2026-10-01T10:00:00.000Z' }),
    ];
    const [reciente, antiguo] = normalizarPedidos(filas);
    expect(reciente.id).toBe(43); // más reciente primero
    expect(antiguo.items).toHaveLength(2);
    expect(antiguo.piezas).toBe(3);
    expect(antiguo.codigo).toBe('NUB-00042');
    expect(antiguo.total).toBe(5250);
  });

  it('calcula el empaque reforzado y el cupón como la web', () => {
    // obras 5250 + empaque 150 - cupón 200 = 5200
    const [p] = normalizarPedidos([
      fila({
        total: '5250.00',
        total_pedido: '5200.00',
        descuento_cupon: '200',
        codigo_cupon: 'ARTE10',
      }),
    ]);
    expect(p.empaque).toBe(150);
    expect(p.descuento).toBe(200);
    expect(p.codigoCupon).toBe('ARTE10');
  });

  it('sin empaque cuando el total solo cuadra con las obras', () => {
    const [p] = normalizarPedidos([fila({ total: '5250.00' })]);
    expect(p.empaque).toBe(0);
  });

  it('toma el número de guía de cualquier obra', () => {
    const [p] = normalizarPedidos([fila(), fila({ id_venta: 2, numero_guia: 'GUIA123' })]);
    expect(p.numeroGuia).toBe('GUIA123');
  });

  it('tolera datos vacíos', () => {
    expect(normalizarPedidos(null)).toEqual([]);
    expect(normalizarPedidos([{}])).toEqual([]);
  });
});

describe('resumenPedido y permisos', () => {
  it('arma el subtítulo de la tarjeta', () => {
    const [p] = normalizarPedidos([fila({ fecha_pedido: '2026-09-18T15:00:00' })]);
    expect(resumenPedido(p)).toBe('18 sep 2026 · 1 obra');
  });
  it('solo clientes tienen pedidos', () => {
    expect(puedeTenerPedidos({ rol: 'cliente' })).toBe(true);
    expect(puedeTenerPedidos({ rol: 'artista' })).toBe(false);
    expect(puedeTenerPedidos(null)).toBe(true);
  });
});

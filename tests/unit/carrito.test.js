import {
  contarPiezas,
  normalizarItemCarrito,
  puedeTenerCarrito,
  textoObras,
  textoPagar,
} from '../../src/utils/carrito';
import { calcularTotalCarrito } from '../../src/utils/formatters';

const raw = {
  id_carrito: 7,
  id_obra: 3,
  cantidad: 2,
  titulo: 'Tejido de la Sierra',
  slug: 'tejido-de-la-sierra',
  imagen_principal: 'https://x/y.jpg',
  precio_base: '2000.00',
  precio_efectivo: '1850.00',
  tiene_descuento: true,
  artista_alias: 'Juana Bautista',
};

describe('normalizarItemCarrito', () => {
  it('usa el id de la línea y el precio con descuento', () => {
    const item = normalizarItemCarrito(raw);
    expect(item.idCarrito).toBe(7);
    expect(item.id).toBe(3);
    expect(item.precio).toBe(1850);
    expect(item.precioLista).toBe(2000);
    expect(item.precioOferta).toBe(1850);
  });

  it('sin descuento no marca oferta', () => {
    const item = normalizarItemCarrito({ ...raw, tiene_descuento: false, precio_efectivo: '2000' });
    expect(item.precioOferta).toBeNull();
  });

  it('tolera datos incompletos', () => {
    const item = normalizarItemCarrito({});
    expect(item.cantidad).toBe(1);
    expect(item.precio).toBe(0);
  });
});

describe('totales y textos', () => {
  it('el total usa precio efectivo por cantidad', () => {
    expect(calcularTotalCarrito([normalizarItemCarrito(raw)])).toBe(3700);
  });
  it('cuenta piezas', () => {
    expect(contarPiezas([{ cantidad: 2 }, { cantidad: 1 }])).toBe(3);
    expect(contarPiezas(null)).toBe(0);
  });
  it('pluraliza', () => {
    expect(textoObras(1)).toBe('1 obra');
    expect(textoObras(2)).toBe('2 obras');
    expect(textoPagar(2)).toBe('Pagar 2 obras');
  });
  it('solo clientes tienen carrito', () => {
    expect(puedeTenerCarrito({ rol: 'cliente' })).toBe(true);
    expect(puedeTenerCarrito({ rol: 'artista' })).toBe(false);
    expect(puedeTenerCarrito(null)).toBe(true);
  });
});

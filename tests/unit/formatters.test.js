import { calcularTotalCarrito, formatearPrecio } from '../../src/utils/formatters';

describe('formatearPrecio', () => {
  it('formatea montos con separador de miles y MXN', () => {
    expect(formatearPrecio(5250)).toBe('$5,250 MXN');
  });

  it('regresa $0 MXN con valores inválidos', () => {
    expect(formatearPrecio(-10)).toBe('$0 MXN');
    expect(formatearPrecio(NaN)).toBe('$0 MXN');
    expect(formatearPrecio('100')).toBe('$0 MXN');
  });

  it('omite MXN en las tarjetas del catálogo (HU-01)', () => {
    expect(formatearPrecio(1850, { moneda: false })).toBe('$1,850');
    expect(formatearPrecio(-1, { moneda: false })).toBe('$0');
  });
});

describe('calcularTotalCarrito (HU-08)', () => {
  it('suma el precio de las obras del carrito', () => {
    const items = [{ precio: 1850 }, { precio: 3400 }];
    expect(calcularTotalCarrito(items)).toBe(5250);
  });

  it('toma en cuenta la cantidad', () => {
    expect(calcularTotalCarrito([{ precio: 500, cantidad: 2 }])).toBe(1000);
  });

  it('regresa 0 si el carrito está vacío o no es un arreglo', () => {
    expect(calcularTotalCarrito([])).toBe(0);
    expect(calcularTotalCarrito(null)).toBe(0);
  });
});

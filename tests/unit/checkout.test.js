import { resumenObras, urlPagoWeb } from '../../src/utils/checkout';

describe('urlPagoWeb', () => {
  it('agrega /checkout a la URL de la web', () => {
    expect(urlPagoWeb('https://nubstudio.com')).toBe('https://nubstudio.com/checkout');
  });
  it('quita la diagonal final y espacios', () => {
    expect(urlPagoWeb(' http://192.168.0.28:5173/ ')).toBe('http://192.168.0.28:5173/checkout');
  });
  it('rechaza valores que no son una URL http(s)', () => {
    expect(urlPagoWeb(undefined)).toBeNull();
    expect(urlPagoWeb('')).toBeNull();
    expect(urlPagoWeb('javascript:alert(1)')).toBeNull();
    expect(urlPagoWeb('nubstudio.com')).toBeNull();
  });
});

describe('resumenObras', () => {
  it('una sola obra', () => {
    expect(resumenObras([{ titulo: 'Tejido de la Sierra' }])).toBe('Tejido de la Sierra');
  });
  it('varias obras', () => {
    const items = [{ titulo: 'A' }, { titulo: 'B' }];
    expect(resumenObras(items)).toBe('A y 1 obra más');
    expect(resumenObras([...items, { titulo: 'C' }])).toBe('A y 2 obras más');
  });
  it('carrito vacío', () => {
    expect(resumenObras([])).toBe('');
    expect(resumenObras(null)).toBe('');
  });
});

import { resumenObras } from '../../src/utils/checkout';

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

import { limitarCantidad, maximoCompra, textoExistencias } from '../../src/utils/existencias';
import { normalizarObraDetalle } from '../../src/utils/obraDetalle';

describe('existencias y cantidad (HU-02, HU-08)', () => {
  it('describe cuántas piezas quedan', () => {
    expect(textoExistencias(8)).toBe('8 disponibles');
    expect(textoExistencias(1)).toBe('Última pieza disponible');
    expect(textoExistencias(0)).toBe('Agotada');
    expect(textoExistencias(null)).toBe('');
  });

  it('no deja elegir menos de 1 ni más de lo disponible', () => {
    expect(maximoCompra(8)).toBe(8);
    expect(maximoCompra(null)).toBe(1);
    expect(maximoCompra(0)).toBe(1);
    expect(limitarCantidad(0, 8)).toBe(1);
    expect(limitarCantidad(9, 8)).toBe(8);
    expect(limitarCantidad('3', 8)).toBe(3);
  });

  it('lee stock_disponible del detalle de la obra', () => {
    expect(normalizarObraDetalle({ id_obra: 51, stock_disponible: 8 }).existencias).toBe(8);
    expect(normalizarObraDetalle({ id_obra: 51, stock_disponible: -2 }).existencias).toBe(0);
    expect(normalizarObraDetalle({ id_obra: 51 }).existencias).toBeNull();
  });
});

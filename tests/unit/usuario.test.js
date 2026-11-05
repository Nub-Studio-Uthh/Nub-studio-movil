import { obtenerIniciales } from '../../src/utils/usuario';

describe('obtenerIniciales', () => {
  it('usa las dos primeras palabras', () => {
    expect(obtenerIniciales('Luis Gustavo Hernández')).toBe('LG');
  });
  it('con una sola palabra usa una letra', () => {
    expect(obtenerIniciales('soriss')).toBe('S');
  });
  it('maneja vacío o indefinido', () => {
    expect(obtenerIniciales('')).toBe('?');
    expect(obtenerIniciales(undefined)).toBe('?');
  });
});

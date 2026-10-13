import { buildQueryString, joinUrl } from '../../src/utils/query';

describe('buildQueryString', () => {
  it('codifica los valores y omite los vacíos', () => {
    expect(
      buildQueryString({
        categoria: 3,
        buscar: 'rojo vivo',
        page: undefined,
        precio_min: '',
        x: null,
      })
    ).toBe('categoria=3&buscar=rojo%20vivo');
  });

  it('codifica caracteres especiales para que no alteren la consulta', () => {
    expect(buildQueryString({ buscar: 'a&b=c' })).toBe('buscar=a%26b%3Dc');
  });

  it('conserva el cero', () => {
    expect(buildQueryString({ precio_min: 0 })).toBe('precio_min=0');
  });

  it('regresa una cadena vacía sin parámetros', () => {
    expect(buildQueryString()).toBe('');
    expect(buildQueryString(null)).toBe('');
  });
});

describe('joinUrl', () => {
  it('une la base y la ruta con una sola diagonal', () => {
    expect(joinUrl('http://192.168.1.5:4000/', '/api/obras')).toBe(
      'http://192.168.1.5:4000/api/obras'
    );
    expect(joinUrl('http://192.168.1.5:4000', 'api/obras')).toBe(
      'http://192.168.1.5:4000/api/obras'
    );
  });
});

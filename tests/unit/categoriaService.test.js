// categoriaService guarda las categorías en memoria; cada prueba carga el módulo de nuevo
// para empezar sin caché.
jest.mock('../../src/models/api', () => ({
  ...jest.requireActual('../../src/models/api'),
  apiGet: jest.fn(),
}));

let getCategorias;
let apiGet;

const RESPUESTA = {
  data: [
    { id_categoria: 1, nombre: 'Pintura', slug: 'pintura', total_obras: '12' },
    { id_categoria: 2, total_obras: null },
  ],
};

beforeEach(() => {
  jest.resetModules();
  ({ getCategorias } = require('../../src/models/categoriaService'));
  ({ apiGet } = require('../../src/models/api'));
  apiGet.mockResolvedValue(RESPUESTA);
});

afterEach(() => jest.restoreAllMocks());

describe('categoriaService', () => {
  it('pide las categorías y las normaliza', async () => {
    const lista = await getCategorias();
    expect(apiGet).toHaveBeenCalledWith('/api/categorias', { signal: undefined });
    expect(lista).toEqual([
      { id: 1, nombre: 'Pintura', slug: 'pintura', total: 12 },
      { id: 2, nombre: '', slug: '', total: 0 },
    ]);
  });

  it('dentro de 5 minutos usa la caché y no vuelve a llamar a la API', async () => {
    const primera = await getCategorias();
    const segunda = await getCategorias();
    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(segunda).toBe(primera);
  });

  it('pasados 5 minutos vuelve a pedirlas', async () => {
    const ahora = Date.now();
    const reloj = jest.spyOn(Date, 'now').mockReturnValue(ahora);
    await getCategorias();
    reloj.mockReturnValue(ahora + 5 * 60 * 1000 + 1);
    await getCategorias();
    expect(apiGet).toHaveBeenCalledTimes(2);
  });

  it('con force: true ignora la caché', async () => {
    await getCategorias();
    await getCategorias({ force: true });
    expect(apiGet).toHaveBeenCalledTimes(2);
  });

  it('si la respuesta no trae lista regresa un arreglo vacío', async () => {
    apiGet.mockResolvedValue({ success: true });
    expect(await getCategorias()).toEqual([]);
  });
});

import { getDestacadas, getObra, getObras } from '../../src/models/obraService';
import { apiGet } from '../../src/models/api';
import { FILTROS_INICIALES, parametrosObras } from '../../src/utils/obras';

jest.mock('../../src/models/api', () => ({
  ...jest.requireActual('../../src/models/api'),
  apiGet: jest.fn(),
}));

beforeEach(() => apiGet.mockReset());

const OBRA = { id_obra: 36, slug: 'pencas', titulo: 'Pencas', precio_base: '2400' };

describe('obraService (HU-01 / HU-02)', () => {
  it('pide las obras con los filtros convertidos a parámetros y las normaliza', async () => {
    apiGet.mockResolvedValue({ data: [OBRA], pagination: { total: '30', totalPages: '3' } });
    const filtros = { ...FILTROS_INICIALES, buscar: 'pencas' };
    const res = await getObras(filtros, { page: 2 });
    expect(apiGet).toHaveBeenCalledWith('/api/obras', {
      params: parametrosObras(filtros, { page: 2, limit: 12 }),
      signal: undefined,
    });
    expect(res).toEqual({
      items: [expect.objectContaining({ id: 36, titulo: 'Pencas', precio: 2400 })],
      total: 30,
      page: 2,
      totalPages: 3,
    });
  });

  it('sin lista ni paginación regresa una página vacía', async () => {
    apiGet.mockResolvedValue({});
    expect(await getObras(FILTROS_INICIALES)).toEqual({
      items: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });
  });

  it('pide las destacadas con destacadas=true', async () => {
    apiGet.mockResolvedValue({ data: [OBRA] });
    const lista = await getDestacadas();
    expect(apiGet).toHaveBeenCalledWith('/api/obras', {
      params: { destacadas: 'true', limit: 6 },
      signal: undefined,
    });
    expect(lista).toEqual([expect.objectContaining({ id: 36 })]);
  });

  it('si no hay destacadas regresa un arreglo vacío', async () => {
    apiGet.mockResolvedValue(null);
    expect(await getDestacadas({ limit: 3 })).toEqual([]);
  });

  it('pide el detalle de una obra por id', async () => {
    apiGet.mockResolvedValue({ data: { ...OBRA, imagenes: [] } });
    const obra = await getObra('36');
    expect(apiGet).toHaveBeenCalledWith('/api/obras/36', { signal: undefined });
    expect(obra).toEqual(expect.objectContaining({ id: 36, titulo: 'Pencas' }));
  });

  it.each([0, -1, 'x', 1.5])(
    'un id no válido (%p) responde 404 sin llamar a la API',
    async (id) => {
      await expect(getObra(id)).rejects.toMatchObject({ name: 'ApiError', status: 404 });
      expect(apiGet).not.toHaveBeenCalled();
    }
  );

  it('si el backend no regresa la obra responde 404', async () => {
    apiGet.mockResolvedValue({ success: false });
    await expect(getObra(99)).rejects.toMatchObject({ status: 404 });
  });
});

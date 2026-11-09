import {
  getColeccion,
  getColecciones,
  getColeccionesPublicas,
  getTotalColecciones,
} from '../../src/models/coleccionService';
import { apiGet } from '../../src/models/api';

jest.mock('../../src/models/api', () => ({
  ...jest.requireActual('../../src/models/api'),
  apiGet: jest.fn(),
}));

beforeEach(() => apiGet.mockReset());

describe('coleccionService (HU-04)', () => {
  it('pide las colecciones publicadas y las normaliza', async () => {
    apiGet.mockResolvedValue({
      data: [{ id_coleccion: 2, nombre: 'Tierra y cielo', slug: 'tierra', total_obras: '0' }],
    });
    const lista = await getColeccionesPublicas();
    expect(apiGet).toHaveBeenCalledWith('/api/colecciones', {
      params: { page: 1, limit: 50 },
      signal: undefined,
    });
    expect(lista).toEqual([expect.objectContaining({ id: 2, nombre: 'Tierra y cielo' })]);
  });

  it('si la respuesta no trae lista regresa un arreglo vacío', async () => {
    apiGet.mockResolvedValue({ success: true });
    expect(await getColeccionesPublicas()).toEqual([]);
  });

  it('pide el detalle por slug en /api/colecciones/slug/:slug', async () => {
    apiGet.mockResolvedValue({ data: { id_coleccion: 4, slug: 'libro y más', obras: [] } });
    const c = await getColeccion('libro y más');
    expect(apiGet).toHaveBeenCalledWith('/api/colecciones/slug/libro%20y%20m%C3%A1s', {
      signal: undefined,
    });
    expect(c.id).toBe(4);
  });

  it('un slug vacío responde 404 sin llamar a la API', async () => {
    await expect(getColeccion('  ')).rejects.toMatchObject({ status: 404 });
    expect(apiGet).not.toHaveBeenCalled();
  });

  it('un slug que no es texto responde 404 sin llamar a la API', async () => {
    await expect(getColeccion(undefined)).rejects.toMatchObject({ status: 404 });
    expect(apiGet).not.toHaveBeenCalled();
  });

  it('pide las colecciones para los chips de Inicio con id, nombre y slug', async () => {
    apiGet.mockResolvedValue({
      data: [
        { id_coleccion: 3, nombre: 'Raíces', slug: 'raices', descripcion: 'x' },
        { id_coleccion: 4 },
      ],
    });
    const chips = await getColecciones();
    expect(apiGet).toHaveBeenCalledWith('/api/colecciones', {
      params: { limit: 6 },
      signal: undefined,
    });
    expect(chips).toEqual([
      { id: 3, nombre: 'Raíces', slug: 'raices' },
      { id: 4, nombre: '', slug: '' },
    ]);
  });

  it('si no hay colecciones para Inicio regresa un arreglo vacío', async () => {
    apiGet.mockResolvedValue(null);
    expect(await getColecciones({ limit: 3 })).toEqual([]);
  });

  it('cuenta las colecciones de un artista con el total de la paginación', async () => {
    apiGet.mockResolvedValue({ data: [{}], pagination: { total: '4' } });
    expect(await getTotalColecciones(5)).toBe(4);
    expect(apiGet).toHaveBeenCalledWith('/api/colecciones', {
      params: { id_artista: 5, limit: 1 },
      signal: undefined,
    });
  });

  it('si no viene la paginación el total es 0', async () => {
    apiGet.mockResolvedValue({ data: [] });
    expect(await getTotalColecciones(5)).toBe(0);
  });
});

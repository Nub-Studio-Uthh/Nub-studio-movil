import { getArtista } from '../../src/models/artistaService';
import { apiGet } from '../../src/models/api';

jest.mock('../../src/models/api', () => ({
  ...jest.requireActual('../../src/models/api'),
  apiGet: jest.fn(),
}));

beforeEach(() => apiGet.mockReset());

describe('artistaService (HU-03)', () => {
  it('pide el perfil por id y lo normaliza', async () => {
    apiGet.mockResolvedValue({
      data: { id_artista: 5, nombre_artistico: 'Gus', biografia: ' Pintor huasteco ', obras: [] },
    });
    const artista = await getArtista('5');
    expect(apiGet).toHaveBeenCalledWith('/api/artistas/5', { signal: undefined });
    expect(artista).toEqual(
      expect.objectContaining({ id: 5, nombre: 'Gus', biografia: 'Pintor huasteco' })
    );
  });

  it('pasa la señal para poder cancelar la petición', async () => {
    apiGet.mockResolvedValue({ data: { id_artista: 5 } });
    const { signal } = new AbortController();
    await getArtista(5, { signal });
    expect(apiGet).toHaveBeenCalledWith('/api/artistas/5', { signal });
  });

  it.each([0, -3, 'abc', 2.5, undefined])(
    'un id no válido (%p) responde 404 sin llamar a la API',
    async (id) => {
      await expect(getArtista(id)).rejects.toMatchObject({ name: 'ApiError', status: 404 });
      expect(apiGet).not.toHaveBeenCalled();
    }
  );

  it('si el backend no regresa datos responde 404', async () => {
    apiGet.mockResolvedValue({ success: true });
    await expect(getArtista(9)).rejects.toMatchObject({
      status: 404,
      message: 'No encontramos lo que buscabas.',
    });
  });
});

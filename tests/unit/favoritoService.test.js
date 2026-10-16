import {
  agregarFavorito,
  esFavorito,
  getFavoritos,
  quitarFavorito,
} from '../../src/models/favoritoService';
import { ApiError, apiDelete, apiGet, apiPost } from '../../src/models/api';

jest.mock('../../src/models/api', () => ({
  ...jest.requireActual('../../src/models/api'),
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiDelete: jest.fn(),
}));

const TOKEN = 'token-de-prueba';

beforeEach(() => jest.clearAllMocks());

describe('favoritoService (HU-07)', () => {
  it('pide los favoritos con el token y los normaliza', async () => {
    apiGet.mockResolvedValue({
      data: [{ id_obra: 36, titulo: 'Pencas', precio_base: '2400', estado: 'publicada' }],
    });
    const lista = await getFavoritos(TOKEN);
    expect(apiGet).toHaveBeenCalledWith('/api/favoritos', { token: TOKEN, signal: undefined });
    expect(lista).toEqual([expect.objectContaining({ id: 36, precio: 2400, disponible: true })]);
  });

  it('pregunta si una obra es favorita', async () => {
    apiGet.mockResolvedValue({ success: true, esFavorito: true });
    expect(await esFavorito(TOKEN, 36)).toBe(true);
    expect(apiGet).toHaveBeenCalledWith('/api/favoritos/check/36', {
      token: TOKEN,
      signal: undefined,
    });
  });

  it('agregar regresa cómo quedó según el backend (el POST alterna)', async () => {
    apiPost.mockResolvedValueOnce({ accion: 'agregado' });
    expect(await agregarFavorito(TOKEN, 36)).toBe(true);
    apiPost.mockResolvedValueOnce({ accion: 'eliminado' });
    expect(await agregarFavorito(TOKEN, 36)).toBe(false);
    expect(apiPost).toHaveBeenCalledWith('/api/favoritos/36', {}, { token: TOKEN });
  });

  it('quitar una obra que ya no estaba (404) no es un error', async () => {
    apiDelete.mockRejectedValueOnce(new ApiError('No encontramos lo que buscabas.', 404));
    await expect(quitarFavorito(TOKEN, 36)).resolves.toBeUndefined();

    apiDelete.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    await expect(quitarFavorito(TOKEN, 36)).rejects.toMatchObject({ status: 0 });
  });

  it('rechaza un id de obra inválido sin llamar a la API', async () => {
    await expect(esFavorito(TOKEN, 'abc')).rejects.toMatchObject({ status: 400 });
    expect(apiGet).not.toHaveBeenCalled();
  });
});

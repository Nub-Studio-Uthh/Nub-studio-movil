import {
  crearComentario,
  eliminarComentario,
  getComentarios,
} from '../../src/models/comentarioService';
import { ApiError, apiDelete, apiGet, apiPost } from '../../src/models/api';

jest.mock('../../src/models/api', () => ({
  ...jest.requireActual('../../src/models/api'),
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiDelete: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

describe('comentarioService (HU-05)', () => {
  it('pide los comentarios de la publicación y los normaliza', async () => {
    apiGet.mockResolvedValue({ data: [{ id_comentario: 1, contenido: 'Hola', respuestas: [] }] });
    const lista = await getComentarios(7);
    expect(apiGet).toHaveBeenCalledWith('/api/blog/posts/7/comentarios', { signal: undefined });
    expect(lista).toEqual([expect.objectContaining({ id: 1, contenido: 'Hola' })]);
  });

  it('publica un comentario y una respuesta con el token', async () => {
    apiPost.mockResolvedValue({ data: { id_comentario: 3, estado: 'aprobado' } });
    await expect(crearComentario('tk', 7, 'Muy bueno')).resolves.toEqual({
      id: 3,
      pendiente: false,
    });
    expect(apiPost).toHaveBeenCalledWith(
      '/api/blog/posts/7/comentarios',
      { contenido: 'Muy bueno' },
      { token: 'tk' }
    );

    apiPost.mockResolvedValue({ data: { id_comentario: 4, estado: 'pendiente' } });
    await expect(crearComentario('tk', 7, 'Mira www.x.com', 3)).resolves.toEqual({
      id: 4,
      pendiente: true,
    });
    expect(apiPost).toHaveBeenLastCalledWith(
      '/api/blog/posts/7/comentarios',
      { contenido: 'Mira www.x.com', padre_id: 3 },
      { token: 'tk' }
    );
  });

  it('muestra el motivo del backend cuando rechaza el comentario', async () => {
    apiPost.mockRejectedValue(
      new ApiError('genérico', 422, { message: 'Tu comentario contiene palabras no permitidas.' })
    );
    await expect(crearComentario('tk', 7, 'feo')).rejects.toMatchObject({
      status: 422,
      message: 'Tu comentario contiene palabras no permitidas.',
    });
  });

  it('conserva el mensaje genérico en otros errores', async () => {
    apiDelete.mockRejectedValue(new ApiError('No tienes permiso para hacer esto.', 403));
    await expect(eliminarComentario('tk', 3)).rejects.toMatchObject({
      message: 'No tienes permiso para hacer esto.',
    });
  });

  it('no llama a la API con un id inválido', async () => {
    await expect(getComentarios(undefined)).rejects.toMatchObject({ status: 404 });
    expect(apiGet).not.toHaveBeenCalled();
  });

  it('borra un comentario propio', async () => {
    apiDelete.mockResolvedValue({ success: true });
    await eliminarComentario('tk', 3);
    expect(apiDelete).toHaveBeenCalledWith('/api/blog/comentarios/3', { token: 'tk' });
  });
});

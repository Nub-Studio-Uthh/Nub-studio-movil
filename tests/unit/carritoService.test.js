import { agregarAlCarrito, getCarrito, quitarDelCarrito } from '../../src/models/carritoService';
import { ApiError, apiDelete, apiGet, apiPost } from '../../src/models/api';

jest.mock('../../src/models/api', () => ({
  ...jest.requireActual('../../src/models/api'),
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiDelete: jest.fn(),
}));

const TOKEN = 'token-de-prueba';

beforeEach(() => jest.clearAllMocks());

describe('carritoService (HU-08)', () => {
  describe('getCarrito', () => {
    it('pide el carrito con el token y normaliza las líneas', async () => {
      apiGet.mockResolvedValue({
        data: [{ id_carrito: 1, id_obra: 7, titulo: 'Xantolo', precio_base: '1500', cantidad: 2 }],
      });
      const lineas = await getCarrito(TOKEN);
      expect(apiGet).toHaveBeenCalledWith('/api/carrito', { token: TOKEN, signal: undefined });
      expect(lineas).toEqual([
        expect.objectContaining({ idCarrito: 1, id: 7, cantidad: 2, precio: 1500 }),
      ]);
    });

    it('si la respuesta no trae lista regresa un arreglo vacío', async () => {
      apiGet.mockResolvedValue(null);
      expect(await getCarrito(TOKEN)).toEqual([]);
    });
  });

  describe('agregarAlCarrito', () => {
    it('envía la obra y la cantidad y regresa el id de la línea', async () => {
      apiPost.mockResolvedValue({ id_carrito: 12 });
      expect(await agregarAlCarrito(TOKEN, '7', 2)).toBe(12);
      expect(apiPost).toHaveBeenCalledWith(
        '/api/carrito',
        { id_obra: 7, cantidad: 2 },
        { token: TOKEN }
      );
    });

    it('por defecto agrega 1 y regresa null si el backend no manda el id', async () => {
      apiPost.mockResolvedValue({ success: true });
      expect(await agregarAlCarrito(TOKEN, 7)).toBeNull();
      expect(apiPost).toHaveBeenCalledWith(
        '/api/carrito',
        { id_obra: 7, cantidad: 1 },
        { token: TOKEN }
      );
    });

    it('una obra no válida responde 400 sin llamar a la API', async () => {
      await expect(agregarAlCarrito(TOKEN, 'abc')).rejects.toMatchObject({
        status: 400,
        message: 'La obra no es válida.',
      });
      expect(apiPost).not.toHaveBeenCalled();
    });

    it.each([400, 404])('con %i usa el mensaje del backend', async (status) => {
      apiPost.mockRejectedValue(
        new ApiError('Error genérico', status, { message: 'Esta obra está agotada' })
      );
      await expect(agregarAlCarrito(TOKEN, 7)).rejects.toMatchObject({
        status,
        message: 'Esta obra está agotada',
      });
    });

    it('otros errores pasan tal cual', async () => {
      const error = new ApiError('Error del servidor', 500, { message: 'Falla interna' });
      apiPost.mockRejectedValue(error);
      await expect(agregarAlCarrito(TOKEN, 7)).rejects.toBe(error);
    });

    it('un 400 sin mensaje del backend pasa tal cual', async () => {
      const error = new ApiError('Solicitud no válida', 400, null);
      apiPost.mockRejectedValue(error);
      await expect(agregarAlCarrito(TOKEN, 7)).rejects.toBe(error);
    });
  });

  describe('quitarDelCarrito', () => {
    it('borra la línea del carrito por su id', async () => {
      apiDelete.mockResolvedValue({ success: true });
      await quitarDelCarrito(TOKEN, 12);
      expect(apiDelete).toHaveBeenCalledWith('/api/carrito/12', { token: TOKEN });
    });

    it('si ya no estaba (404) cuenta como quitada', async () => {
      apiDelete.mockRejectedValue(new ApiError('No encontrado', 404));
      await expect(quitarDelCarrito(TOKEN, 12)).resolves.toBeUndefined();
    });

    it('otros errores sí se lanzan', async () => {
      const error = new ApiError('Sin conexión', 0);
      apiDelete.mockRejectedValue(error);
      await expect(quitarDelCarrito(TOKEN, 12)).rejects.toBe(error);
    });

    it('un id no válido responde 400 sin llamar a la API', async () => {
      await expect(quitarDelCarrito(TOKEN, -1)).rejects.toMatchObject({
        status: 400,
        message: 'El artículo no es válido.',
      });
      expect(apiDelete).not.toHaveBeenCalled();
    });
  });
});

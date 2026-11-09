import { getPedidos } from '../../src/models/pedidoService';
import { apiGet } from '../../src/models/api';

jest.mock('../../src/models/api', () => ({
  ...jest.requireActual('../../src/models/api'),
  apiGet: jest.fn(),
}));

const TOKEN = 'token-de-prueba';

beforeEach(() => apiGet.mockReset());

describe('pedidoService (HU-10)', () => {
  it('pide mis pedidos con el token y agrupa las filas por pedido', async () => {
    apiGet.mockResolvedValue({
      data: [
        { id_pedido: 40, id_obra: 1, titulo: 'Xantolo' },
        { id_pedido: 40, id_obra: 2, titulo: 'Pencas' },
        { id_pedido: 41, id_obra: 3, titulo: 'Huapango' },
      ],
    });
    const pedidos = await getPedidos(TOKEN);
    expect(apiGet).toHaveBeenCalledWith('/api/ventas/mis-pedidos', {
      token: TOKEN,
      signal: undefined,
    });
    expect(pedidos.map((p) => p.id).sort()).toEqual([40, 41]);
  });

  it('si la respuesta no trae lista regresa un arreglo vacío', async () => {
    apiGet.mockResolvedValue({ success: true });
    expect(await getPedidos(TOKEN)).toEqual([]);
  });

  it('deja pasar el error de la API (por ejemplo, sesión vencida)', async () => {
    const error = Object.assign(new Error('Sesión vencida'), { status: 401 });
    apiGet.mockRejectedValue(error);
    await expect(getPedidos(TOKEN)).rejects.toBe(error);
  });
});

import { crearDireccion, getEstados, getMunicipios } from '../../src/models/direccionService';
import { crearPago } from '../../src/models/pagoService';
import { ApiError, apiGet, apiPost } from '../../src/models/api';

jest.mock('../../src/models/api', () => ({
  ...jest.requireActual('../../src/models/api'),
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

const DIRECCION = {
  calle: 'Av. Juárez',
  numeroExterior: '12',
  numeroInterior: '',
  colonia: 'Centro',
  estado: { id: 13, nombre: 'Hidalgo' },
  municipio: { id: 28, nombre: 'Huejutla de Reyes' },
  codigoPostal: '43000',
  referencias: '',
};

describe('direccionService y pagoService (HU-09)', () => {
  it('pide estados y municipios por estado', async () => {
    apiGet.mockResolvedValueOnce({ data: [{ id_estado: 13, nombre: 'Hidalgo' }] });
    await expect(getEstados()).resolves.toEqual([{ id: 13, nombre: 'Hidalgo' }]);
    expect(apiGet).toHaveBeenCalledWith('/api/estados', { signal: undefined });

    apiGet.mockResolvedValueOnce({ data: [{ id_municipio: 28, nombre: 'Huejutla de Reyes' }] });
    await expect(getMunicipios(13)).resolves.toEqual([{ id: 28, nombre: 'Huejutla de Reyes' }]);
    expect(apiGet).toHaveBeenLastCalledWith('/api/municipios/13', { signal: undefined });
  });

  it('no pide municipios sin un estado válido', async () => {
    await expect(getMunicipios(null)).resolves.toEqual([]);
    expect(apiGet).not.toHaveBeenCalled();
  });

  it('guarda la dirección con el token y regresa su id', async () => {
    apiPost.mockResolvedValue({ success: true, id_direccion: 55 });
    await expect(crearDireccion('tk', DIRECCION)).resolves.toBe(55);
    expect(apiPost).toHaveBeenCalledWith(
      '/api/direcciones',
      expect.objectContaining({ id_estado: 13, id_municipio: 28, codigo_postal: '43000' }),
      { token: 'tk' }
    );
  });

  it('falla si el backend no regresa el id de la dirección', async () => {
    apiPost.mockResolvedValue({ success: true });
    await expect(crearDireccion('tk', DIRECCION)).rejects.toBeInstanceOf(ApiError);
  });

  it('crea el pago y regresa el enlace de Mercado Pago', async () => {
    apiPost.mockResolvedValue({
      success: true,
      id_pedido: 40,
      init_point: 'https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=1',
    });
    await expect(crearPago('tk', 55)).resolves.toEqual({
      idPedido: 40,
      url: 'https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=1',
    });
    expect(apiPost).toHaveBeenCalledWith(
      '/api/ventas/checkout',
      { id_direccion_envio: 55 },
      { token: 'tk' }
    );
  });

  it('muestra el motivo del backend si no hay stock o el carrito está vacío', async () => {
    apiPost.mockRejectedValue(
      new ApiError('genérico', 400, { message: 'Stock insuficiente para "Xantolo". Disponible: 0' })
    );
    await expect(crearPago('tk', 55)).rejects.toMatchObject({
      message: 'Stock insuficiente para "Xantolo". Disponible: 0',
    });
  });

  it('falla si la respuesta no trae un enlace https', async () => {
    apiPost.mockResolvedValue({ success: true, id_pedido: 40 });
    await expect(crearPago('tk', 55)).rejects.toMatchObject({ status: 500 });
  });

  it('con "Comprar ahora" manda solo las líneas indicadas del carrito', async () => {
    apiPost.mockResolvedValue({ id_pedido: 43, init_point: 'https://mp.com/x' });
    await crearPago('tk', 55, [2]);
    expect(apiPost).toHaveBeenCalledWith(
      '/api/ventas/checkout',
      { id_direccion_envio: 55, ids_carrito: [2] },
      { token: 'tk' }
    );
  });
});

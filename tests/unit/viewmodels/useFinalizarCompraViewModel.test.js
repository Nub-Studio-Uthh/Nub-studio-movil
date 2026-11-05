import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useFinalizarCompraViewModel } from '../../../src/viewmodels/useFinalizarCompraViewModel';
import { useAuth } from '../../../src/models/AuthContext';
import { crearDireccion, getEstados, getMunicipios } from '../../../src/models/direccionService';
import { crearPago } from '../../../src/models/pagoService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../src/viewmodels/useCarritoViewModel', () => ({
  useCarritoViewModel: () => ({
    vista: 'lista',
    items: [
      { idCarrito: 1, id: 7, titulo: 'Xantolo', cantidad: 1, precio: 1500 },
      { idCarrito: 2, id: 9, titulo: 'Huapango', cantidad: 2, precio: 800 },
    ],
    total: 3100,
    piezas: 3,
  }),
}));
jest.mock('../../../src/models/direccionService', () => ({
  getEstados: jest.fn(),
  getMunicipios: jest.fn(),
  crearDireccion: jest.fn(),
}));
jest.mock('../../../src/models/pagoService', () => ({ crearPago: jest.fn() }));

const HIDALGO = { id: 13, nombre: 'Hidalgo' };
const HUEJUTLA = { id: 28, nombre: 'Huejutla de Reyes' };

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ status: 'authenticated', token: 'tk', usuario: { rol: 'cliente' } });
  getEstados.mockResolvedValue([HIDALGO]);
  getMunicipios.mockResolvedValue([HUEJUTLA]);
});

async function llenar(result) {
  act(() => {
    result.current.cambiar('calle', 'Av. Juárez');
    result.current.cambiar('numeroExterior', '12');
    result.current.cambiar('colonia', 'Centro');
    result.current.cambiar('estado', HIDALGO);
    result.current.cambiar('codigoPostal', '43000');
  });
  await waitFor(() => expect(result.current.municipios.data).toEqual([HUEJUTLA]));
  act(() => result.current.cambiar('municipio', HUEJUTLA));
}

describe('useFinalizarCompraViewModel (HU-09)', () => {
  it('carga los estados y, al elegir uno, sus municipios', async () => {
    const { result } = renderHook(() => useFinalizarCompraViewModel());
    await waitFor(() => expect(result.current.estados.data).toEqual([HIDALGO]));
    expect(result.current.municipios).toEqual({ data: [], isLoading: false, error: null });
    expect(result.current.resumen).toBe('Xantolo y 1 obra más');

    act(() => result.current.cambiar('estado', HIDALGO));
    expect(result.current.municipios.isLoading).toBe(true);
    await waitFor(() => expect(result.current.municipios.data).toEqual([HUEJUTLA]));
    expect(getMunicipios).toHaveBeenCalledWith(13, expect.anything());
  });

  it('al cambiar de estado borra el municipio elegido', async () => {
    const { result } = renderHook(() => useFinalizarCompraViewModel());
    await llenar(result);
    act(() => result.current.cambiar('estado', { id: 30, nombre: 'Veracruz' }));
    expect(result.current.direccion.municipio).toBeNull();
    await waitFor(() => expect(result.current.municipios.isLoading).toBe(false));
  });

  it('no paga si la dirección está incompleta y marca los errores', async () => {
    const { result } = renderHook(() => useFinalizarCompraViewModel());
    await waitFor(() => expect(result.current.estados.isLoading).toBe(false));
    let r;
    await act(async () => {
      r = await result.current.pagar();
    });
    expect(r).toEqual({ ok: false, error: null });
    expect(result.current.errores.calle).toBe('Escribe la calle.');
    expect(crearDireccion).not.toHaveBeenCalled();

    act(() => result.current.cambiar('calle', 'Av. Juárez'));
    expect(result.current.errores.calle).toBeUndefined();
  });

  it('guarda la dirección, crea el pago y regresa el enlace de Mercado Pago', async () => {
    crearDireccion.mockResolvedValue(55);
    crearPago.mockResolvedValue({ idPedido: 40, url: 'https://mp.com/pagar' });
    const { result } = renderHook(() => useFinalizarCompraViewModel());
    await llenar(result);

    let r;
    await act(async () => {
      r = await result.current.pagar();
    });
    expect(crearDireccion).toHaveBeenCalledWith(
      'tk',
      expect.objectContaining({ calle: 'Av. Juárez' })
    );
    expect(crearPago).toHaveBeenCalledWith('tk', 55, null);
    expect(r).toEqual({ ok: true, idPedido: 40, url: 'https://mp.com/pagar' });
  });

  it('si el pago falla no vuelve a guardar la misma dirección al reintentar', async () => {
    crearDireccion.mockResolvedValue(55);
    crearPago.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    crearPago.mockResolvedValueOnce({ idPedido: 41, url: 'https://mp.com/pagar' });
    const { result } = renderHook(() => useFinalizarCompraViewModel());
    await llenar(result);

    let r;
    await act(async () => {
      r = await result.current.pagar();
    });
    expect(r).toEqual({ ok: false, error: 'Sin conexión' });
    await act(async () => {
      r = await result.current.pagar();
    });
    expect(r.ok).toBe(true);
    expect(crearDireccion).toHaveBeenCalledTimes(1);
    expect(crearPago).toHaveBeenCalledTimes(2);
  });

  it('con "Comprar ahora" muestra y paga solo esa obra', async () => {
    crearDireccion.mockResolvedValue(55);
    crearPago.mockResolvedValue({ idPedido: 42, url: 'https://mp.com/pagar' });
    const { result } = renderHook(() => useFinalizarCompraViewModel(9));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.total).toBe(1600);
    expect(result.current.piezas).toBe(2);
    expect(result.current.resumen).toBe('Huapango');
    await llenar(result);

    await act(async () => {
      await result.current.pagar();
    });
    expect(crearPago).toHaveBeenCalledWith('tk', 55, [2]);
  });
});

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useDetallePedidoViewModel } from '../../../src/viewmodels/useDetallePedidoViewModel';
import { useAuth } from '../../../src/models/AuthContext';
import { getPedidos } from '../../../src/models/pedidoService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../src/models/pedidoService', () => ({ getPedidos: jest.fn() }));

const CLIENTE = { status: 'authenticated', token: 'tk', usuario: { rol: 'cliente' } };
const PEDIDOS = [
  { id: 40, codigo: 'P-40' },
  { id: 41, codigo: 'P-41' },
];

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue(CLIENTE);
});

describe('useDetallePedidoViewModel (HU-10)', () => {
  it('sin sesión no llama a la API y muestra la invitación', () => {
    useAuth.mockReturnValue({ status: 'guest', token: null, usuario: null });
    const { result } = renderHook(() => useDetallePedidoViewModel(40));
    expect(result.current.vista).toBe('invitado');
    expect(result.current.isLoading).toBe(false);
    expect(getPedidos).not.toHaveBeenCalled();
  });

  it('un administrador no puede ver pedidos de cliente', () => {
    useAuth.mockReturnValue({ ...CLIENTE, usuario: { rol: 'admin' } });
    const { result } = renderHook(() => useDetallePedidoViewModel(40));
    expect(result.current.vista).toBe('sin-permiso');
    expect(getPedidos).not.toHaveBeenCalled();
  });

  it('busca el pedido de la ruta dentro de mis pedidos (el id puede venir como texto)', async () => {
    getPedidos.mockResolvedValue(PEDIDOS);
    const { result } = renderHook(() => useDetallePedidoViewModel('41'));
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.pedido).toEqual(PEDIDOS[1]));
    expect(getPedidos).toHaveBeenCalledWith('tk', { signal: expect.anything() });
    expect(result.current.vista).toBe('detalle');
    expect(result.current.isLoading).toBe(false);
  });

  it('si el pedido no está en la lista muestra "no encontrado"', async () => {
    getPedidos.mockResolvedValue(PEDIDOS);
    const { result } = renderHook(() => useDetallePedidoViewModel(99));
    await waitFor(() => expect(result.current.vista).toBe('no-encontrado'));
    expect(result.current.pedido).toBeNull();
  });

  it('si falla muestra el error y "Reintentar" vuelve a pedir los datos', async () => {
    getPedidos.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    const { result } = renderHook(() => useDetallePedidoViewModel(40));
    await waitFor(() => expect(result.current.vista).toBe('error'));
    expect(result.current.error).toBe('Sin conexión');

    getPedidos.mockResolvedValueOnce(PEDIDOS);
    act(() => result.current.reload());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.vista).toBe('detalle'));
    expect(getPedidos).toHaveBeenCalledTimes(2);
  });

  it('un 401 muestra que la sesión venció', async () => {
    getPedidos.mockRejectedValue(new ApiError('Tu sesión venció', 401));
    const { result } = renderHook(() => useDetallePedidoViewModel(40));
    await waitFor(() => expect(result.current.vista).toBe('sesion-vencida'));
  });

  it('una petición cancelada no cambia el estado', async () => {
    getPedidos.mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    const { result } = renderHook(() => useDetallePedidoViewModel(40));
    await waitFor(() => expect(getPedidos).toHaveBeenCalled());
    expect(result.current.isLoading).toBe(true);
  });
});

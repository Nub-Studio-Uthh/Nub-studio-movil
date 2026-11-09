import { act, renderHook, waitFor } from '@testing-library/react-native';
import { usePedidosViewModel } from '../../../src/viewmodels/usePedidosViewModel';
import { useAuth } from '../../../src/models/AuthContext';
import { getPedidos } from '../../../src/models/pedidoService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../src/models/pedidoService', () => ({ getPedidos: jest.fn() }));

const CLIENTE = { status: 'authenticated', token: 'tk', usuario: { rol: 'cliente' } };
const pedido = (id) => ({ id, codigo: `P-${id}`, total: 100 });

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue(CLIENTE);
});

describe('usePedidosViewModel (HU-10)', () => {
  it('sin sesión no llama a la API y muestra la invitación', () => {
    useAuth.mockReturnValue({ status: 'guest', token: null, usuario: null });
    const { result } = renderHook(() => usePedidosViewModel());
    expect(result.current.vista).toBe('invitado');
    expect(result.current.isLoading).toBe(false);
    expect(getPedidos).not.toHaveBeenCalled();
  });

  it('un artista no tiene pedidos de cliente: no llama a la API', () => {
    useAuth.mockReturnValue({ ...CLIENTE, usuario: { rol: 'artista' } });
    const { result } = renderHook(() => usePedidosViewModel());
    expect(result.current.vista).toBe('sin-permiso');
    expect(getPedidos).not.toHaveBeenCalled();
  });

  it('carga los pedidos con el token', async () => {
    getPedidos.mockResolvedValue([pedido(40), pedido(41)]);
    const { result } = renderHook(() => usePedidosViewModel());
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.pedidos).toHaveLength(2));
    expect(getPedidos).toHaveBeenCalledWith('tk', { signal: expect.anything() });
    expect(result.current.vista).toBe('lista');
    expect(result.current.isLoading).toBe(false);
  });

  it('si falla muestra el error y "Reintentar" vuelve a pedir los datos', async () => {
    getPedidos.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    const { result } = renderHook(() => usePedidosViewModel());
    await waitFor(() => expect(result.current.vista).toBe('error'));
    expect(result.current.error).toBe('Sin conexión');

    getPedidos.mockResolvedValueOnce([pedido(40)]);
    await act(async () => {
      await result.current.reload();
    });
    expect(result.current.vista).toBe('lista');
    expect(result.current.pedidos).toHaveLength(1);
  });

  it('un 401 muestra que la sesión venció', async () => {
    getPedidos.mockRejectedValue(new ApiError('Tu sesión venció', 401));
    const { result } = renderHook(() => usePedidosViewModel());
    await waitFor(() => expect(result.current.vista).toBe('sesion-vencida'));
  });

  it('recargar en silencio actualiza la lista sin volver a "cargando"', async () => {
    getPedidos.mockResolvedValueOnce([pedido(40)]);
    const { result } = renderHook(() => usePedidosViewModel());
    await waitFor(() => expect(result.current.pedidos).toHaveLength(1));

    let resolver;
    getPedidos.mockReturnValueOnce(new Promise((r) => (resolver = r)));
    act(() => {
      result.current.recargarEnSilencio();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.pedidos).toHaveLength(1);

    await act(async () => resolver([pedido(40), pedido(41)]));
    expect(result.current.pedidos).toHaveLength(2);
  });

  it('si la recarga en silencio falla conserva la lista que ya había', async () => {
    getPedidos.mockResolvedValueOnce([pedido(40)]);
    const { result } = renderHook(() => usePedidosViewModel());
    await waitFor(() => expect(result.current.pedidos).toHaveLength(1));

    getPedidos.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    await act(async () => {
      await result.current.recargarEnSilencio();
    });
    expect(result.current.vista).toBe('lista');
    expect(result.current.pedidos).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('una petición cancelada no cambia el estado', async () => {
    const cancelada = Object.assign(new Error('aborted'), { name: 'AbortError' });
    getPedidos.mockRejectedValue(cancelada);
    const { result } = renderHook(() => usePedidosViewModel());
    await waitFor(() => expect(getPedidos).toHaveBeenCalled());
    expect(result.current.vista).toBe('lista');
    expect(result.current.isLoading).toBe(true);
  });
});

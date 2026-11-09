import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useCarritoViewModel } from '../../../src/viewmodels/useCarritoViewModel';
import { useAuth } from '../../../src/models/AuthContext';
import { getCarrito, quitarDelCarrito } from '../../../src/models/carritoService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../src/models/carritoService', () => ({
  getCarrito: jest.fn(),
  quitarDelCarrito: jest.fn(),
}));

const CLIENTE = { status: 'authenticated', token: 'tk', usuario: { rol: 'cliente' } };
const linea = (idCarrito, precio, cantidad = 1) => ({
  idCarrito,
  id: idCarrito * 10,
  titulo: `Obra ${idCarrito}`,
  precio,
  cantidad,
});

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue(CLIENTE);
});

async function montarConCarrito(items) {
  getCarrito.mockResolvedValueOnce(items);
  const hook = renderHook(() => useCarritoViewModel());
  await waitFor(() => expect(hook.result.current.items).toHaveLength(items.length));
  return hook;
}

describe('useCarritoViewModel (HU-08)', () => {
  it('sin sesión no llama a la API y muestra la invitación', () => {
    useAuth.mockReturnValue({ status: 'guest', token: null, usuario: null });
    const { result } = renderHook(() => useCarritoViewModel());
    expect(result.current.vista).toBe('invitado');
    expect(result.current.isLoading).toBe(false);
    expect(getCarrito).not.toHaveBeenCalled();
  });

  it('un artista no tiene carrito: no llama a la API', () => {
    useAuth.mockReturnValue({ ...CLIENTE, usuario: { rol: 'artista' } });
    const { result } = renderHook(() => useCarritoViewModel());
    expect(result.current.vista).toBe('sin-permiso');
    expect(getCarrito).not.toHaveBeenCalled();
  });

  it('carga el carrito y calcula el total y las piezas', async () => {
    const { result } = await montarConCarrito([linea(1, 1500, 2), linea(2, 800)]);
    expect(getCarrito).toHaveBeenCalledWith('tk', { signal: expect.anything() });
    expect(result.current.vista).toBe('lista');
    expect(result.current.total).toBe(3800);
    expect(result.current.piezas).toBe(3);
  });

  it('si falla muestra el error y "Reintentar" vuelve a pedir el carrito', async () => {
    getCarrito.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    const { result } = renderHook(() => useCarritoViewModel());
    await waitFor(() => expect(result.current.vista).toBe('error'));
    expect(result.current.error).toBe('Sin conexión');

    getCarrito.mockResolvedValueOnce([linea(1, 100)]);
    await act(async () => {
      await result.current.reload();
    });
    expect(result.current.vista).toBe('lista');
    expect(result.current.total).toBe(100);
  });

  it('un 401 muestra que la sesión venció', async () => {
    getCarrito.mockRejectedValue(new ApiError('Tu sesión venció', 401));
    const { result } = renderHook(() => useCarritoViewModel());
    await waitFor(() => expect(result.current.vista).toBe('sesion-vencida'));
  });

  it('recargar en silencio conserva la lista si falla', async () => {
    const { result } = await montarConCarrito([linea(1, 100)]);
    getCarrito.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    await act(async () => {
      await result.current.recargarEnSilencio();
    });
    expect(result.current.vista).toBe('lista');
    expect(result.current.items).toHaveLength(1);
  });

  it('recargar en silencio trae los cambios sin pasar por "cargando"', async () => {
    const { result } = await montarConCarrito([linea(1, 100)]);
    getCarrito.mockResolvedValueOnce([linea(1, 100), linea(2, 200)]);
    await act(async () => {
      await result.current.recargarEnSilencio();
    });
    expect(result.current.items).toHaveLength(2);
    expect(result.current.total).toBe(300);
  });

  it('quitar baja el total de inmediato', async () => {
    const { result } = await montarConCarrito([linea(1, 100), linea(2, 200)]);
    quitarDelCarrito.mockResolvedValueOnce();
    let mensaje;
    await act(async () => {
      mensaje = await result.current.quitar(linea(1, 100));
    });
    expect(mensaje).toBeNull();
    expect(quitarDelCarrito).toHaveBeenCalledWith('tk', 1);
    expect(result.current.items.map((i) => i.idCarrito)).toEqual([2]);
    expect(result.current.total).toBe(200);
  });

  it('si quitar falla regresa la obra a su lugar y devuelve el mensaje', async () => {
    const { result } = await montarConCarrito([linea(1, 100), linea(2, 200), linea(3, 300)]);
    quitarDelCarrito.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    let mensaje;
    await act(async () => {
      mensaje = await result.current.quitar(linea(2, 200));
    });
    expect(mensaje).toBe('Sin conexión');
    expect(result.current.items.map((i) => i.idCarrito)).toEqual([1, 2, 3]);
    expect(result.current.total).toBe(600);
  });

  it('si quitar falla con una obra que ya no estaba, la agrega al final', async () => {
    const { result } = await montarConCarrito([linea(1, 100)]);
    quitarDelCarrito.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    await act(async () => {
      await result.current.quitar(linea(9, 50));
    });
    expect(result.current.items.map((i) => i.idCarrito)).toEqual([1, 9]);
  });
});

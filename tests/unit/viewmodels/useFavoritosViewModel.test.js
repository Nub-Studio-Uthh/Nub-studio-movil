import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useFavoritosViewModel } from '../../../src/viewmodels/useFavoritosViewModel';
import { useAuth } from '../../../src/models/AuthContext';
import { getFavoritos, quitarFavorito } from '../../../src/models/favoritoService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../src/models/favoritoService', () => ({
  getFavoritos: jest.fn(),
  quitarFavorito: jest.fn(),
}));

const CLIENTE = { status: 'authenticated', token: 'tk', usuario: { rol: 'cliente' } };
const obra = (id, titulo) => ({ id, slug: `obra-${id}`, titulo, precio: 100, disponible: true });

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue(CLIENTE);
});

describe('useFavoritosViewModel (HU-07)', () => {
  it('sin sesión no llama a la API y muestra la invitación', () => {
    useAuth.mockReturnValue({ status: 'guest', token: null, usuario: null });
    const { result } = renderHook(() => useFavoritosViewModel());
    expect(result.current.vista).toBe('invitado');
    expect(result.current.isLoading).toBe(false);
    expect(getFavoritos).not.toHaveBeenCalled();
  });

  it('carga los favoritos con el token y cuenta las obras guardadas', async () => {
    getFavoritos.mockResolvedValue([obra(1, 'Pencas'), obra(2, 'Tlahui')]);
    const { result } = renderHook(() => useFavoritosViewModel());

    await waitFor(() => expect(result.current.favoritos).toHaveLength(2));
    expect(getFavoritos).toHaveBeenCalledWith('tk', expect.anything());
    expect(result.current.vista).toBe('lista');
    expect(result.current.subtitulo).toBe('2 obras guardadas');
  });

  it('quita una obra de inmediato y la regresa a su lugar si el backend falla', async () => {
    getFavoritos.mockResolvedValue([obra(1, 'Pencas'), obra(2, 'Tlahui'), obra(3, 'Sierra')]);
    const { result } = renderHook(() => useFavoritosViewModel());
    await waitFor(() => expect(result.current.favoritos).toHaveLength(3));

    quitarFavorito.mockResolvedValueOnce();
    await act(async () => {
      await result.current.quitar(obra(1, 'Pencas'));
    });
    expect(quitarFavorito).toHaveBeenCalledWith('tk', 1);
    expect(result.current.favoritos.map((o) => o.id)).toEqual([2, 3]);
    expect(result.current.subtitulo).toBe('2 obras guardadas');

    quitarFavorito.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    let mensaje;
    await act(async () => {
      mensaje = await result.current.quitar(obra(3, 'Sierra'));
    });
    expect(mensaje).toBe('Sin conexión');
    expect(result.current.favoritos.map((o) => o.id)).toEqual([2, 3]);
  });

  it('si la sesión venció (401) lo indica para volver a iniciar sesión', async () => {
    getFavoritos.mockRejectedValue(new ApiError('Tu sesión no es válida.', 401));
    const { result } = renderHook(() => useFavoritosViewModel());
    await waitFor(() => expect(result.current.vista).toBe('sesion-vencida'));
  });

  it('si falla la conexión muestra el error y permite reintentar', async () => {
    getFavoritos
      .mockRejectedValueOnce(new ApiError('Sin conexión', 0))
      .mockResolvedValue([obra(1, 'Pencas')]);
    const { result } = renderHook(() => useFavoritosViewModel());
    await waitFor(() => expect(result.current.vista).toBe('error'));

    await act(async () => {
      await result.current.reload();
    });
    expect(result.current.vista).toBe('lista');
    expect(result.current.favoritos).toHaveLength(1);
  });

  it('al recargar en silencio conserva la lista si el refresco falla', async () => {
    getFavoritos.mockResolvedValueOnce([obra(1, 'Pencas')]);
    const { result } = renderHook(() => useFavoritosViewModel());
    await waitFor(() => expect(result.current.favoritos).toHaveLength(1));

    getFavoritos.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    await act(async () => {
      await result.current.recargarEnSilencio();
    });
    expect(result.current.vista).toBe('lista');
    expect(result.current.favoritos).toHaveLength(1);
  });

  it('una cuenta que no es de cliente no pide favoritos', () => {
    useAuth.mockReturnValue({ ...CLIENTE, usuario: { rol: 'artista' } });
    const { result } = renderHook(() => useFavoritosViewModel());
    expect(result.current.vista).toBe('sin-permiso');
    expect(getFavoritos).not.toHaveBeenCalled();
  });
});

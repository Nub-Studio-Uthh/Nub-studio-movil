import { act, renderHook, waitFor } from '@testing-library/react-native';
import { usePostViewModel } from '../../../src/viewmodels/usePostViewModel';
import { getPost } from '../../../src/models/blogService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/blogService', () => ({ getPost: jest.fn() }));

const palabras = (n) => Array.from({ length: n }, () => 'arte').join(' ');
const completo = {
  id: 7,
  slug: 'el-xantolo',
  titulo: 'El Xantolo',
  autor: 'Equipo NU-B Studio',
  fecha: new Date(2026, 8, 20),
  contenido: `<p>${palabras(600)}</p>`,
};

describe('usePostViewModel (HU-05)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('pide el post por slug y calcula autor, fecha y minutos de lectura', async () => {
    getPost.mockResolvedValue(completo);
    const { result } = renderHook(() => usePostViewModel('el-xantolo'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getPost).toHaveBeenCalledWith('el-xantolo', expect.anything());
    expect(result.current.post.titulo).toBe('El Xantolo');
    expect(result.current.contenido).toBe(completo.contenido);
    expect(result.current.iniciales).toBe('ES');
    expect(result.current.meta).toBe('20 sep 2026 · 3 min');
    expect(result.current.sinDatos).toBe(false);
  });

  it('mientras carga usa los datos que venían de la lista', () => {
    getPost.mockReturnValue(new Promise(() => {}));
    const previa = { ...completo, contenido: null };
    const { result } = renderHook(() => usePostViewModel('el-xantolo', previa));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.post.titulo).toBe('El Xantolo');
    expect(result.current.contenido).toBeNull();
    // Sin contenido todavía no se conocen los minutos.
    expect(result.current.meta).toBe('20 sep 2026');
  });

  it('marca noEncontrado cuando la API responde 404', async () => {
    getPost.mockRejectedValue(new ApiError('No encontramos lo que buscabas.', 404));
    const { result } = renderHook(() => usePostViewModel('no-existe'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.noEncontrado).toBe(true);
    expect(result.current.sinDatos).toBe(true);
  });

  it('si falla la conexión permite reintentar', async () => {
    getPost.mockRejectedValueOnce(new ApiError('Sin conexión', 0)).mockResolvedValue(completo);
    const { result } = renderHook(() => usePostViewModel('el-xantolo'));

    await waitFor(() => expect(result.current.error).toBe('Sin conexión'));
    expect(result.current.noEncontrado).toBe(false);

    await act(() => result.current.reload());
    expect(result.current.error).toBeNull();
    expect(result.current.contenido).toBe(completo.contenido);
  });
});

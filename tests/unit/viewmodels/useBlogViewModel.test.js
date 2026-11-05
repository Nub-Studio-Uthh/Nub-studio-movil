import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useBlogViewModel } from '../../../src/viewmodels/useBlogViewModel';
import { getPosts } from '../../../src/models/blogService';

jest.mock('../../../src/models/blogService', () => ({ getPosts: jest.fn() }));

const post = (id) => ({ id, slug: `post-${id}`, titulo: `Post ${id}` });
const pagina = (items, page = 1, totalPages = 1) => ({
  items,
  total: items.length,
  page,
  totalPages,
});

describe('useBlogViewModel (HU-05)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('pide la primera página de 10 y expone las publicaciones', async () => {
    getPosts.mockResolvedValue(pagina([post(3), post(2)]));
    const { result } = renderHook(() => useBlogViewModel());

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.posts.map((p) => p.id)).toEqual([3, 2]);
    expect(getPosts).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10 }));
  });

  it('agrega la siguiente página sin repetir publicaciones', async () => {
    getPosts.mockResolvedValueOnce(pagina([post(3), post(2)], 1, 2));
    const { result } = renderHook(() => useBlogViewModel());
    await waitFor(() => expect(result.current.status).toBe('success'));

    getPosts.mockResolvedValueOnce(pagina([post(2), post(1)], 2, 2));
    await act(async () => {
      await result.current.loadMore();
    });
    await waitFor(() => expect(result.current.posts).toHaveLength(3));
    expect(result.current.posts.map((p) => p.id)).toEqual([3, 2, 1]);

    // Ya no hay más páginas: no vuelve a pedir.
    await act(async () => {
      await result.current.loadMore();
    });
    expect(getPosts).toHaveBeenCalledTimes(2);
  });

  it('si falla la primera carga muestra el error y reload lo recupera', async () => {
    getPosts.mockRejectedValueOnce(new Error('Sin conexión'));
    const { result } = renderHook(() => useBlogViewModel());
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Sin conexión');

    getPosts.mockResolvedValue(pagina([post(1)]));
    await act(async () => {
      await result.current.reload();
    });
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.posts).toHaveLength(1);
  });

  it('si falla una página siguiente conserva la lista y permite reintentar', async () => {
    getPosts.mockResolvedValueOnce(pagina([post(2)], 1, 2));
    const { result } = renderHook(() => useBlogViewModel());
    await waitFor(() => expect(result.current.status).toBe('success'));

    getPosts.mockRejectedValueOnce(new Error('Se cortó'));
    await act(async () => {
      await result.current.loadMore();
    });
    await waitFor(() => expect(result.current.loadMoreError).toBe('Se cortó'));
    expect(result.current.posts).toHaveLength(1);

    getPosts.mockResolvedValueOnce(pagina([post(1)], 2, 2));
    await act(async () => {
      await result.current.retryMore();
    });
    await waitFor(() => expect(result.current.posts).toHaveLength(2));
    expect(result.current.loadMoreError).toBeNull();
  });

  it('al refrescar conserva la lista mientras carga', async () => {
    getPosts.mockResolvedValueOnce(pagina([post(2)]));
    const { result } = renderHook(() => useBlogViewModel());
    await waitFor(() => expect(result.current.status).toBe('success'));

    let resolver;
    getPosts.mockReturnValueOnce(new Promise((r) => (resolver = r)));
    let pendiente;
    act(() => {
      pendiente = result.current.refresh();
    });
    expect(result.current.refreshing).toBe(true);
    expect(result.current.posts).toHaveLength(1);

    await act(async () => {
      resolver(pagina([post(3), post(2)]));
      await pendiente;
    });
    expect(result.current.refreshing).toBe(false);
    expect(result.current.posts).toHaveLength(2);
  });
});

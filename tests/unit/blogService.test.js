import { getPost, getPosts } from '../../src/models/blogService';
import { apiGet } from '../../src/models/api';

jest.mock('../../src/models/api', () => ({
  ...jest.requireActual('../../src/models/api'),
  apiGet: jest.fn(),
}));

beforeEach(() => apiGet.mockReset());

describe('blogService (HU-05)', () => {
  it('pide la primera página de publicaciones y las normaliza', async () => {
    apiGet.mockResolvedValue({
      data: [{ id_post: 1, slug: 'xantolo', titulo: 'Xantolo' }],
      pagination: { total: '11', totalPages: '2' },
    });
    const res = await getPosts();
    expect(apiGet).toHaveBeenCalledWith('/api/blog/posts', {
      params: { page: 1, limit: 10 },
      signal: undefined,
    });
    expect(res).toEqual({
      items: [expect.objectContaining({ id: 1, slug: 'xantolo', titulo: 'Xantolo' })],
      total: 11,
      page: 1,
      totalPages: 2,
    });
  });

  it('respeta la página y el límite que se piden', async () => {
    apiGet.mockResolvedValue({ data: [] });
    const res = await getPosts({ page: 3, limit: 5 });
    expect(apiGet).toHaveBeenCalledWith('/api/blog/posts', {
      params: { page: 3, limit: 5 },
      signal: undefined,
    });
    expect(res.page).toBe(3);
  });

  it('sin lista ni paginación regresa una página vacía', async () => {
    apiGet.mockResolvedValue(null);
    expect(await getPosts()).toEqual({ items: [], total: 0, page: 1, totalPages: 0 });
  });

  it('pide una publicación por slug codificado en la URL', async () => {
    apiGet.mockResolvedValue({ data: { id_post: 7, slug: 'día de muertos', titulo: 'Día' } });
    const post = await getPost('día de muertos');
    expect(apiGet).toHaveBeenCalledWith('/api/blog/posts/d%C3%ADa%20de%20muertos', {
      signal: undefined,
    });
    expect(post).toEqual(expect.objectContaining({ id: 7, titulo: 'Día' }));
  });
});

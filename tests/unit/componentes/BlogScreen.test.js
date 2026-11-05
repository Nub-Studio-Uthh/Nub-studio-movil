import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { BlogScreen } from '../../../src/views/screens/blog/BlogScreen';
import { getPosts } from '../../../src/models/blogService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/blogService', () => ({ getPosts: jest.fn() }));

const post = (id, titulo, fecha) => ({
  id,
  slug: `post-${id}`,
  titulo,
  extracto: 'Conoce el origen de esta celebración.',
  imagen: null,
  categoria: 'Tradiciones',
  autor: 'Equipo NU-B Studio',
  autorFoto: null,
  fecha,
  comentarios: 0,
  contenido: null,
  etiquetas: [],
});

const pagina = (items, { page = 1, totalPages = 1 } = {}) => ({
  items,
  total: items.length,
  page,
  totalPages,
});

function montar() {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  render(<BlogScreen navigation={navigation} />);
  return navigation;
}

beforeEach(() => getPosts.mockReset());

describe('BlogScreen (HU-05)', () => {
  it('lista las publicaciones en el orden de la API (más reciente primero) y abre la elegida', async () => {
    getPosts.mockResolvedValue(
      pagina([
        post(3, 'El Xantolo', new Date(2026, 8, 20)),
        post(2, 'Técnicas del bordado tének', new Date(2026, 8, 12)),
        post(1, 'Entrevista: Pedro Martínez', new Date(2026, 8, 3)),
      ])
    );
    const navigation = montar();

    expect(await screen.findByText('El Xantolo')).toBeTruthy();
    // La primera es la destacada: muestra categoría, fecha y extracto.
    expect(screen.getByText('TRADICIONES')).toBeTruthy();
    expect(screen.getByText('20 sep 2026')).toBeTruthy();
    expect(screen.getByText('Conoce el origen de esta celebración.')).toBeTruthy();
    expect(screen.getByTestId('blog-post-1')).toBeTruthy();
    expect(screen.getByText('3 sep 2026')).toBeTruthy();
    expect(getPosts).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10 }));

    fireEvent.press(screen.getByTestId('blog-post-1'));
    expect(navigation.navigate).toHaveBeenCalledWith('Publicacion', {
      slug: 'post-2',
      post: expect.objectContaining({ id: 2 }),
    });
  });

  it('sin publicaciones muestra un mensaje claro', async () => {
    getPosts.mockResolvedValue(pagina([]));
    montar();
    expect(await screen.findByText('Aún no hay publicaciones')).toBeTruthy();
  });

  it('si falla la carga muestra el error y "Reintentar" vuelve a pedir las publicaciones', async () => {
    getPosts.mockRejectedValueOnce(new ApiError('No pudimos conectar con el servidor.', 0));
    montar();
    expect(await screen.findByText('No pudimos cargar el blog')).toBeTruthy();

    getPosts.mockResolvedValue(pagina([post(9, 'Arte huasteco', new Date(2026, 1, 1))]));
    fireEvent.press(screen.getByTestId('estado-error-accion'));
    expect(await screen.findByText('Arte huasteco')).toBeTruthy();
    await waitFor(() => expect(getPosts).toHaveBeenCalledTimes(2));
  });

  it('pide la siguiente página al llegar al final de la lista', async () => {
    getPosts.mockResolvedValueOnce(
      pagina([post(3, 'Primera', null), post(2, 'Segunda', null)], { totalPages: 2 })
    );
    montar();
    await screen.findByText('Primera');

    getPosts.mockResolvedValueOnce(pagina([post(1, 'Tercera', null)], { page: 2, totalPages: 2 }));
    fireEvent(screen.getByTestId('blog-lista'), 'onEndReached');
    expect(await screen.findByText('Tercera')).toBeTruthy();
    expect(getPosts).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
  });

  it('el botón de regresar vuelve a Inicio', async () => {
    getPosts.mockResolvedValue(pagina([]));
    const navigation = montar();
    await screen.findByText('Aún no hay publicaciones');
    fireEvent.press(screen.getByTestId('blog-regresar'));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});

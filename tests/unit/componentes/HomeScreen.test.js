import { fireEvent, render, screen } from '@testing-library/react-native';
import { HomeScreen } from '../../../src/views/screens/catalog/HomeScreen';
import { getDestacadas, getObras } from '../../../src/models/obraService';
import { getColecciones } from '../../../src/models/coleccionService';
import { getPosts } from '../../../src/models/blogService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/obraService', () => ({
  getDestacadas: jest.fn(),
  getObras: jest.fn(),
}));
jest.mock('../../../src/models/coleccionService', () => ({ getColecciones: jest.fn() }));
jest.mock('../../../src/models/blogService', () => ({ getPosts: jest.fn() }));

const obra = (id, titulo) => ({
  id,
  slug: `obra-${id}`,
  titulo,
  imagen: null,
  artista: 'Mariana Castillo',
  categoria: 'Pintura',
  precio: 1500,
  precioOferta: null,
  destacada: true,
});

const POST = {
  id: 7,
  slug: 'xantolo',
  titulo: 'Así se vive el Xantolo',
  extracto: 'Ofrendas y danzas.',
  imagen: null,
  categoria: 'Tradiciones',
  etiquetas: [],
};

function montar() {
  const navigation = { navigate: jest.fn() };
  render(<HomeScreen navigation={navigation} />);
  return navigation;
}

beforeEach(() => {
  jest.clearAllMocks();
  getDestacadas.mockResolvedValue([obra(1, 'Xantolo')]);
  getObras.mockResolvedValue({ items: [obra(2, 'Pencas'), obra(3, 'Huapango')], total: 2 });
  getColecciones.mockResolvedValue([{ id: 4, nombre: 'Raíces', slug: 'raices' }]);
  getPosts.mockResolvedValue({ items: [POST], total: 1 });
});

describe('HomeScreen (HU-01)', () => {
  it('muestra destacadas, colecciones, obras recientes y el blog', async () => {
    montar();
    expect(await screen.findByTestId('destacada-0')).toBeTruthy();
    expect(screen.getByTestId('coleccion-raices')).toBeTruthy();
    expect(screen.getByTestId('reciente-0')).toBeTruthy();
    expect(screen.getByTestId('reciente-1')).toBeTruthy();
    expect(await screen.findByTestId('inicio-post-0')).toBeTruthy();
    expect(getObras).toHaveBeenCalledWith(
      { ordenar: 'recientes' },
      expect.objectContaining({ limit: 2 })
    );
  });

  it('abre el detalle de una obra destacada o reciente', async () => {
    const navigation = montar();

    fireEvent.press(await screen.findByTestId('destacada-0'));
    expect(navigation.navigate).toHaveBeenCalledWith('DetalleObra', { id: 1, slug: 'obra-1' });

    fireEvent.press(screen.getByTestId('reciente-1'));
    expect(navigation.navigate).toHaveBeenCalledWith('DetalleObra', { id: 3, slug: 'obra-3' });
  });

  it('los accesos llevan al catálogo, las colecciones y el blog', async () => {
    const navigation = montar();
    await screen.findByTestId('destacada-0');

    fireEvent.press(screen.getByTestId('ver-catalogo'));
    expect(navigation.navigate).toHaveBeenCalledWith('Catalogo');

    fireEvent.press(screen.getByTestId('buscar-inicio'));
    expect(navigation.navigate).toHaveBeenLastCalledWith('Catalogo');

    fireEvent.press(screen.getByTestId('ver-colecciones'));
    expect(navigation.navigate).toHaveBeenCalledWith('Colecciones');

    fireEvent.press(screen.getByTestId('coleccion-raices'));
    expect(navigation.navigate).toHaveBeenCalledWith('Coleccion', { slug: 'raices' });

    fireEvent.press(screen.getByTestId('abrir-blog'));
    expect(navigation.navigate).toHaveBeenCalledWith('Blog');

    fireEvent.press(await screen.findByTestId('inicio-post-0'));
    expect(navigation.navigate).toHaveBeenCalledWith('Publicacion', {
      slug: 'xantolo',
      post: POST,
    });
  });

  it('si el blog falla, el resto del inicio se muestra igual', async () => {
    getPosts.mockRejectedValue(new ApiError('Sin conexión', 0));
    montar();
    expect(await screen.findByTestId('destacada-0')).toBeTruthy();
    expect(screen.queryByTestId('inicio-blog')).toBeNull();
  });

  it('si fallan las recientes, avisa solo en esa sección', async () => {
    getObras.mockRejectedValue(new ApiError('Sin conexión', 0));
    montar();
    expect(await screen.findByTestId('error-recientes')).toBeTruthy();
    expect(screen.getByTestId('destacada-0')).toBeTruthy();
  });

  it('si fallan destacadas y recientes muestra el error y "Reintentar" recarga todo', async () => {
    getDestacadas.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    getObras.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    montar();
    expect(await screen.findByText('No pudimos cargar el inicio')).toBeTruthy();

    fireEvent.press(screen.getByTestId('estado-error-accion'));
    expect(await screen.findByTestId('destacada-0')).toBeTruthy();
    expect(getDestacadas).toHaveBeenCalledTimes(2);
  });

  it('sin obras publicadas muestra un mensaje', async () => {
    getDestacadas.mockResolvedValue([]);
    getObras.mockResolvedValue({ items: [], total: 0 });
    montar();
    expect(await screen.findByTestId('inicio-vacio')).toBeTruthy();
  });
});

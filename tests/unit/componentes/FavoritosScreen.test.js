import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { FavoritosScreen } from '../../../src/views/screens/favoritos/FavoritosScreen';
import { useAuth } from '../../../src/models/AuthContext';
import { getFavoritos, quitarFavorito } from '../../../src/models/favoritoService';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../src/models/favoritoService', () => ({
  getFavoritos: jest.fn(),
  quitarFavorito: jest.fn(),
}));

const CLIENTE = { status: 'authenticated', token: 'tk', usuario: { rol: 'cliente' } };

const obra = (id, titulo, extra = {}) => ({
  id,
  slug: `obra-${id}`,
  titulo,
  imagen: null,
  artista: 'Tomás Reyes',
  categoria: '',
  precio: 1450,
  precioOferta: null,
  destacada: false,
  disponible: true,
  ...extra,
});

function montar() {
  const navigation = { navigate: jest.fn(), addListener: jest.fn(() => jest.fn()) };
  render(<FavoritosScreen navigation={navigation} />);
  return navigation;
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue(CLIENTE);
});

describe('FavoritosScreen (HU-07)', () => {
  it('muestra las obras guardadas y abre el detalle de la elegida', async () => {
    getFavoritos.mockResolvedValue([
      obra(1, 'Río Candelaria'),
      obra(2, 'Huapango en rojo', { disponible: false }),
    ]);
    const navigation = montar();

    expect(await screen.findByText('Río Candelaria')).toBeTruthy();
    expect(screen.getByTestId('favoritos-total')).toHaveTextContent('2 obras guardadas');
    // La que ya no está publicada se marca, sin precio.
    expect(screen.getByText('NO DISPONIBLE')).toBeTruthy();

    fireEvent.press(screen.getByTestId('favorito-0'));
    expect(navigation.navigate).toHaveBeenCalledWith('DetalleObra', { id: 1, slug: 'obra-1' });
  });

  it('el corazón quita la obra de la lista', async () => {
    getFavoritos.mockResolvedValue([obra(1, 'Río Candelaria'), obra(2, 'Tejido de la Sierra')]);
    quitarFavorito.mockResolvedValue();
    montar();
    await screen.findByText('Río Candelaria');

    fireEvent.press(screen.getByTestId('favorito-0-quitar'));
    await waitFor(() => expect(screen.queryByText('Río Candelaria')).toBeNull());
    expect(quitarFavorito).toHaveBeenCalledWith('tk', 1);
    expect(screen.getByTestId('favoritos-total')).toHaveTextContent('1 obra guardada');
  });

  it('sin favoritos invita a explorar el catálogo', async () => {
    getFavoritos.mockResolvedValue([]);
    const navigation = montar();
    expect(await screen.findByText('Aún no tienes favoritos')).toBeTruthy();
    fireEvent.press(screen.getByTestId('favoritos-vacio-accion'));
    expect(navigation.navigate).toHaveBeenCalledWith('Catalogo');
  });

  it('sin sesión pide iniciar sesión y regresa a Favoritos al entrar', () => {
    useAuth.mockReturnValue({ status: 'guest', token: null, usuario: null });
    const navigation = montar();

    expect(screen.getByText('Guarda las obras que te gustan')).toBeTruthy();
    fireEvent.press(screen.getByTestId('favoritos-invitado-accion'));
    expect(navigation.navigate).toHaveBeenCalledWith('Login', { regresar: true });
    expect(getFavoritos).not.toHaveBeenCalled();
  });
});

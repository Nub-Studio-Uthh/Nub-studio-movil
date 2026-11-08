import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { DetalleObraScreen } from '../../../src/views/screens/catalog/DetalleObraScreen';
import { getObra } from '../../../src/models/obraService';
import { useAuth } from '../../../src/models/AuthContext';
import { agregarAlCarrito } from '../../../src/models/carritoService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/obraService', () => ({ getObra: jest.fn() }));
jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../src/models/favoritoService', () => ({
  agregarFavorito: jest.fn(),
  esFavorito: jest.fn(async () => false),
  quitarFavorito: jest.fn(),
}));
jest.mock('../../../src/models/carritoService', () => ({ agregarAlCarrito: jest.fn() }));

// El primer render del detalle puede tardar en el runner de CI.
jest.setTimeout(20000);

const OBRA = {
  id: 51,
  titulo: 'Espíritu Navideño',
  descripcion: '',
  precio: 2150,
  imagenes: [],
  etiquetas: [],
  historia: '',
  anio: 2024,
  dimensiones: '',
  permiteMarco: false,
  conCertificado: false,
  existencias: 5,
  artista: { id: 27, nombre: 'Sxmu', foto: null },
};

const CLIENTE = { status: 'authenticated', token: 'tk', usuario: { rol: 'cliente' } };
const ARTISTA = { status: 'authenticated', token: 'tk', usuario: { rol: 'artista' } };
const INVITADO = { status: 'guest', token: null, usuario: null };

function montar() {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  render(<DetalleObraScreen navigation={navigation} route={{ params: { id: 51 } }} />);
  return navigation;
}
const esperar = () => screen.findByText('Espíritu Navideño', {}, { timeout: 10000 });

/** Toca el botón "Iniciar sesión" del aviso que se mostró con Alert.alert. */
function tocarIniciarSesion() {
  const botones = Alert.alert.mock.calls.at(-1)[2];
  botones.find((b) => b.text === 'Iniciar sesión').onPress();
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue(CLIENTE);
  getObra.mockResolvedValue(OBRA);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('Detalle de obra: carrito según la cuenta (HU-02, HU-08)', () => {
  it('sin sesión, "Agregar al carrito" pide iniciar sesión y regresa a la obra', async () => {
    useAuth.mockReturnValue(INVITADO);
    const navigation = montar();
    await esperar();

    fireEvent.press(screen.getByTestId('detalle-agregar-carrito'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Inicia sesión',
      'Para agregar obras a tu carrito necesitas una cuenta.',
      expect.any(Array)
    );
    expect(agregarAlCarrito).not.toHaveBeenCalled();

    tocarIniciarSesion();
    expect(navigation.navigate).toHaveBeenCalledWith('Login', { regresar: true });
  });

  it('una cuenta de artista no puede agregar al carrito', async () => {
    useAuth.mockReturnValue(ARTISTA);
    montar();
    await esperar();

    fireEvent.press(screen.getByTestId('detalle-agregar-carrito'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Carrito',
      'El carrito está disponible para cuentas de cliente.'
    );
    expect(agregarAlCarrito).not.toHaveBeenCalled();
  });

  it('una cuenta de artista no puede comprar', async () => {
    useAuth.mockReturnValue(ARTISTA);
    montar();
    await esperar();

    fireEvent.press(screen.getByTestId('detalle-comprar'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Compras',
      'Las compras están disponibles para cuentas de cliente.'
    );
    expect(agregarAlCarrito).not.toHaveBeenCalled();
  });

  it('una cuenta de artista no puede guardar favoritos', async () => {
    useAuth.mockReturnValue(ARTISTA);
    montar();
    await esperar();

    fireEvent.press(screen.getByTestId('detalle-favorito'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Favoritos',
      'Los favoritos están disponibles para cuentas de cliente.'
    );
  });

  it('si no se pudo agregar al carrito avisa el motivo y no abre el carrito', async () => {
    agregarAlCarrito.mockRejectedValue(new ApiError('Esta obra está agotada', 400));
    const navigation = montar();
    await esperar();

    fireEvent.press(screen.getByTestId('detalle-agregar-carrito'));
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        'No pudimos agregar la obra',
        'Esta obra está agotada'
      )
    );
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('si no se pudo preparar la compra avisa el motivo y no abre Finalizar compra', async () => {
    agregarAlCarrito.mockRejectedValue(new ApiError('Sin conexión', 0));
    const navigation = montar();
    await esperar();

    fireEvent.press(screen.getByTestId('detalle-comprar'));
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('No pudimos preparar tu compra', 'Sin conexión')
    );
    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});

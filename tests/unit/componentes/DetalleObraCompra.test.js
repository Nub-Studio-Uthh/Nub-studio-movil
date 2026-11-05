import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { DetalleObraScreen } from '../../../src/views/screens/catalog/DetalleObraScreen';
import { getObra } from '../../../src/models/obraService';
import { useAuth } from '../../../src/models/AuthContext';
import { agregarAlCarrito } from '../../../src/models/carritoService';

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

const obra = (existencias) => ({
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
  existencias,
  artista: { id: 27, nombre: 'Sxmu', foto: null },
});

function montar() {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  render(<DetalleObraScreen navigation={navigation} route={{ params: { id: 51 } }} />);
  return navigation;
}
const esperar = () => screen.findByText('Espíritu Navideño', {}, { timeout: 10000 });

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ status: 'authenticated', token: 'tk', usuario: { rol: 'cliente' } });
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('Detalle de obra: existencias y compra (HU-02, HU-08)', () => {
  it('muestra cuántas quedan y la cantidad no pasa de las existencias', async () => {
    getObra.mockResolvedValue(obra(2));
    montar();
    await esperar();
    expect(screen.getByText('2 disponibles')).toBeTruthy();
    expect(screen.getByTestId('detalle-cantidad-valor').props.children).toBe(1);

    fireEvent.press(screen.getByTestId('detalle-mas'));
    fireEvent.press(screen.getByTestId('detalle-mas'));
    expect(screen.getByTestId('detalle-cantidad-valor').props.children).toBe(2);
    fireEvent.press(screen.getByTestId('detalle-menos'));
    expect(screen.getByTestId('detalle-cantidad-valor').props.children).toBe(1);
  });

  it('"Comprar ahora" agrega la cantidad elegida y abre Finalizar compra solo con esa obra', async () => {
    getObra.mockResolvedValue(obra(8));
    agregarAlCarrito.mockResolvedValue(3);
    const navigation = montar();
    await esperar();
    fireEvent.press(screen.getByTestId('detalle-mas'));

    fireEvent.press(screen.getByTestId('detalle-comprar'));
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('FinalizarCompra', { soloObra: 51 })
    );
    expect(agregarAlCarrito).toHaveBeenCalledWith('tk', 51, 2);
  });

  it('"Agregar al carrito" usa la cantidad elegida', async () => {
    getObra.mockResolvedValue(obra(8));
    agregarAlCarrito.mockResolvedValue(3);
    const navigation = montar();
    await esperar();
    fireEvent.press(screen.getByTestId('detalle-agregar-carrito'));
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('Tabs', { screen: 'Carrito' })
    );
    expect(agregarAlCarrito).toHaveBeenCalledWith('tk', 51, 1);
  });

  it('si está agotada no deja comprar', async () => {
    getObra.mockResolvedValue(obra(0));
    montar();
    await esperar();
    expect(screen.getAllByText('Agotada').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('detalle-cantidad')).toBeNull();
    fireEvent.press(screen.getByTestId('detalle-comprar'));
    expect(agregarAlCarrito).not.toHaveBeenCalled();
  });

  it('sin sesión, "Comprar ahora" pide iniciar sesión', async () => {
    useAuth.mockReturnValue({ status: 'guest', token: null, usuario: null });
    getObra.mockResolvedValue(obra(8));
    montar();
    await esperar();
    fireEvent.press(screen.getByTestId('detalle-comprar'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Inicia sesión',
      'Para comprar necesitas una cuenta.',
      expect.any(Array)
    );
    expect(agregarAlCarrito).not.toHaveBeenCalled();
  });
});

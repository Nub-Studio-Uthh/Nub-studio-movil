import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { CarritoScreen } from '../../../src/views/screens/cart/CarritoScreen';
import { useAuth } from '../../../src/models/AuthContext';
import { getCarrito, quitarDelCarrito } from '../../../src/models/carritoService';
import { ApiError } from '../../../src/models/api';
import { formatearPrecio } from '../../../src/utils/formatters';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../src/models/carritoService', () => ({
  getCarrito: jest.fn(),
  quitarDelCarrito: jest.fn(),
}));

const CLIENTE = { status: 'authenticated', token: 'tk', usuario: { rol: 'cliente' } };

const linea = (idCarrito, titulo, precio, cantidad = 1) => ({
  idCarrito,
  id: idCarrito * 10,
  slug: `obra-${idCarrito}`,
  titulo,
  imagen: null,
  artista: 'Tomás Reyes',
  cantidad,
  precio,
  precioLista: precio,
  precioOferta: null,
});

function montar() {
  const listeners = {};
  const navigation = {
    navigate: jest.fn(),
    addListener: jest.fn((evento, fn) => {
      listeners[evento] = fn;
      return jest.fn();
    }),
  };
  render(<CarritoScreen navigation={navigation} />);
  return { navigation, enfocar: () => listeners.focus?.() };
}

const total = () => screen.getByTestId('carrito-total');

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue(CLIENTE);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('CarritoScreen (HU-08)', () => {
  it('sin sesión invita a iniciar sesión y regresa al carrito después', () => {
    useAuth.mockReturnValue({ status: 'guest', token: null, usuario: null });
    const { navigation } = montar();

    fireEvent.press(screen.getByTestId('carrito-invitado-accion'));
    expect(navigation.navigate).toHaveBeenCalledWith('Login', { regresar: true });
    expect(getCarrito).not.toHaveBeenCalled();
  });

  it('muestra las obras, las piezas y el total', async () => {
    getCarrito.mockResolvedValue([linea(1, 'Xantolo', 1500, 2), linea(2, 'Pencas', 800)]);
    montar();

    expect(await screen.findByText('Xantolo')).toBeTruthy();
    expect(screen.getByText('Pencas')).toBeTruthy();
    expect(screen.getByTestId('carrito-resumen-compra')).toHaveTextContent(/3 obras/);
    expect(total()).toHaveTextContent(formatearPrecio(3800));
    expect(screen.getByTestId('carrito-pagar')).toHaveTextContent(/pagar 3 obras/i);
  });

  it('al quitar una obra el total baja de inmediato', async () => {
    getCarrito.mockResolvedValue([linea(1, 'Xantolo', 1500), linea(2, 'Pencas', 800)]);
    quitarDelCarrito.mockResolvedValue();
    montar();
    await screen.findByText('Xantolo');

    fireEvent.press(screen.getByTestId('carrito-0-quitar'));

    await waitFor(() => expect(screen.queryByText('Xantolo')).toBeNull());
    expect(quitarDelCarrito).toHaveBeenCalledWith('tk', 1);
    expect(total()).toHaveTextContent(formatearPrecio(800));
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('si no se pudo quitar, la obra regresa y avisa el motivo', async () => {
    getCarrito.mockResolvedValue([linea(1, 'Xantolo', 1500), linea(2, 'Pencas', 800)]);
    quitarDelCarrito.mockRejectedValue(new ApiError('Sin conexión', 0));
    montar();
    await screen.findByText('Xantolo');

    fireEvent.press(screen.getByTestId('carrito-0-quitar'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('No pudimos quitarla del carrito', 'Sin conexión')
    );
    expect(screen.getByText('Xantolo')).toBeTruthy();
    expect(total()).toHaveTextContent(formatearPrecio(2300));
  });

  it('al quitar la última obra muestra el carrito vacío', async () => {
    getCarrito.mockResolvedValue([linea(1, 'Xantolo', 1500)]);
    quitarDelCarrito.mockResolvedValue();
    const { navigation } = montar();
    await screen.findByText('Xantolo');

    fireEvent.press(screen.getByTestId('carrito-0-quitar'));

    expect(await screen.findByTestId('carrito-vacio')).toBeTruthy();
    fireEvent.press(screen.getByTestId('carrito-vacio-accion'));
    expect(navigation.navigate).toHaveBeenCalledWith('Catalogo');
  });

  it('"Pagar" abre Finalizar compra y tocar una obra abre su detalle', async () => {
    getCarrito.mockResolvedValue([linea(1, 'Xantolo', 1500)]);
    const { navigation } = montar();
    await screen.findByText('Xantolo');

    fireEvent.press(screen.getByTestId('carrito-pagar'));
    expect(navigation.navigate).toHaveBeenCalledWith('FinalizarCompra');

    fireEvent.press(screen.getByTestId('carrito-0'));
    expect(navigation.navigate).toHaveBeenCalledWith('DetalleObra', { id: 10, slug: 'obra-1' });
  });

  it('al volver a la pestaña trae lo que se agregó desde otra pantalla', async () => {
    getCarrito.mockResolvedValueOnce([linea(1, 'Xantolo', 1500)]);
    const { enfocar } = montar();
    await screen.findByText('Xantolo');

    // El primer "focus" es la apertura de la pestaña: no recarga.
    act(() => enfocar());
    expect(getCarrito).toHaveBeenCalledTimes(1);

    getCarrito.mockResolvedValueOnce([linea(1, 'Xantolo', 1500), linea(2, 'Pencas', 800)]);
    await act(async () => enfocar());

    expect(await screen.findByText('Pencas')).toBeTruthy();
    expect(total()).toHaveTextContent(formatearPrecio(2300));
  });

  it('si falla la carga muestra el error y "Reintentar" vuelve a pedir el carrito', async () => {
    getCarrito.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    montar();

    expect(await screen.findByText('No pudimos cargar tu carrito')).toBeTruthy();

    getCarrito.mockResolvedValueOnce([linea(1, 'Xantolo', 1500)]);
    fireEvent.press(screen.getByTestId('estado-error-accion'));
    expect(await screen.findByText('Xantolo')).toBeTruthy();
  });
});

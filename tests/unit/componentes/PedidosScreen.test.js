import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { PedidosScreen } from '../../../src/views/screens/pedidos/PedidosScreen';
import { useAuth } from '../../../src/models/AuthContext';
import { getPedidos } from '../../../src/models/pedidoService';
import { ApiError } from '../../../src/models/api';
import { normalizarPedidos } from '../../../src/utils/pedidos';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../src/models/pedidoService', () => ({ getPedidos: jest.fn() }));

const CLIENTE = { status: 'authenticated', token: 'tk', usuario: { rol: 'cliente' } };

const fila = (id, extra = {}) => ({
  id_pedido: id,
  id_venta: id * 10,
  titulo: 'Tejido de la Sierra',
  slug: 'tejido-de-la-sierra',
  imagen_principal: null,
  artista_alias: 'Juana Bautista',
  cantidad: 1,
  precio_unitario: '1850.00',
  subtotal: '1850.00',
  total: '1850.00',
  estado_pedido: 'pagado',
  fecha_pedido: '2026-09-18T15:00:00.000Z',
  total_pedido: '1850.00',
  descuento_cupon: '0',
  codigo_cupon: null,
  numero_guia: null,
  ...extra,
});

const PEDIDOS = normalizarPedidos([fila(42), fila(43, { estado_pedido: 'enviado' })]);

function montar() {
  const listeners = {};
  const navigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    addListener: jest.fn((evento, fn) => {
      listeners[evento] = fn;
      return jest.fn();
    }),
  };
  render(<PedidosScreen navigation={navigation} />);
  return { navigation, enfocar: () => listeners.focus?.() };
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue(CLIENTE);
});

describe('PedidosScreen (HU-10)', () => {
  it('sin sesión invita a iniciar sesión y no pide pedidos', () => {
    useAuth.mockReturnValue({ status: 'guest', token: null, usuario: null });
    const { navigation } = montar();

    fireEvent.press(screen.getByTestId('pedidos-invitado-accion'));
    expect(navigation.navigate).toHaveBeenCalledWith('Login', { regresar: true });
    expect(getPedidos).not.toHaveBeenCalled();
  });

  it('una cuenta de artista ve que los pedidos son para clientes', () => {
    useAuth.mockReturnValue({ ...CLIENTE, usuario: { rol: 'artista' } });
    montar();
    expect(screen.getByTestId('pedidos-sin-permiso')).toBeTruthy();
  });

  it('muestra los pedidos con su estatus y abre el detalle del elegido', async () => {
    getPedidos.mockResolvedValue(PEDIDOS);
    const { navigation } = montar();

    const tarjeta = await screen.findByTestId('pedido-0');
    expect(screen.getByTestId('pedido-1')).toBeTruthy();
    expect(screen.getByText('También ves los pedidos que hiciste en la web.')).toBeTruthy();

    fireEvent.press(tarjeta);
    expect(navigation.navigate).toHaveBeenCalledWith('DetallePedido', {
      id: PEDIDOS[0].id,
    });
  });

  it('sin pedidos invita a explorar el catálogo', async () => {
    getPedidos.mockResolvedValue([]);
    const { navigation } = montar();

    fireEvent.press(await screen.findByTestId('pedidos-vacio-accion'));
    expect(navigation.navigate).toHaveBeenCalledWith('Tabs', { screen: 'Catalogo' });
  });

  it('si falla la carga muestra el error y "Reintentar" vuelve a pedirlos', async () => {
    getPedidos.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    montar();
    expect(await screen.findByText('No pudimos cargar tus pedidos')).toBeTruthy();

    getPedidos.mockResolvedValueOnce(PEDIDOS);
    fireEvent.press(screen.getByTestId('estado-error-accion'));
    expect(await screen.findByTestId('pedido-0')).toBeTruthy();
  });

  it('si la sesión venció pide iniciar sesión de nuevo', async () => {
    getPedidos.mockRejectedValue(new ApiError('Tu sesión venció', 401));
    const { navigation } = montar();

    fireEvent.press(await screen.findByTestId('pedidos-sesion-vencida-accion'));
    expect(navigation.navigate).toHaveBeenCalledWith('Login', { regresar: true });
  });

  it('al volver a la pantalla recarga para ver cambios de estatus', async () => {
    getPedidos.mockResolvedValueOnce([PEDIDOS[0]]);
    const { enfocar } = montar();
    await screen.findByTestId('pedido-0');

    act(() => enfocar()); // primera vez: es la apertura, no recarga
    expect(getPedidos).toHaveBeenCalledTimes(1);

    getPedidos.mockResolvedValueOnce(PEDIDOS);
    await act(async () => enfocar());
    expect(await screen.findByTestId('pedido-1')).toBeTruthy();
  });

  it('el botón de regresar vuelve a la pantalla anterior', () => {
    getPedidos.mockResolvedValue([]);
    const { navigation } = montar();
    fireEvent.press(screen.getByTestId('pedidos-regresar'));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});

import { Alert, Linking } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { DetallePedidoScreen } from '../../../src/views/screens/pedidos/DetallePedidoScreen';
import { useAuth } from '../../../src/models/AuthContext';
import { getPedidos } from '../../../src/models/pedidoService';
import { ApiError } from '../../../src/models/api';
import { formatearPrecio } from '../../../src/utils/formatters';
import { normalizarPedidos } from '../../../src/utils/pedidos';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../src/models/pedidoService', () => ({ getPedidos: jest.fn() }));

const CLIENTE = { status: 'authenticated', token: 'tk', usuario: { rol: 'cliente' } };

const fila = (extra = {}) => ({
  id_pedido: 42,
  id_venta: 1,
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

function montar(id = 42) {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  render(<DetallePedidoScreen navigation={navigation} route={{ params: { id } }} />);
  return navigation;
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue(CLIENTE);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('DetallePedidoScreen (HU-10)', () => {
  it('sin sesión invita a iniciar sesión', () => {
    useAuth.mockReturnValue({ status: 'guest', token: null, usuario: null });
    const navigation = montar();

    fireEvent.press(screen.getByTestId('detalle-pedido-invitado-accion'));
    expect(navigation.navigate).toHaveBeenCalledWith('Login', { regresar: true });
    expect(getPedidos).not.toHaveBeenCalled();
  });

  it('muestra el código, las obras y el total del pedido', async () => {
    getPedidos.mockResolvedValue(normalizarPedidos([fila()]));
    montar();

    expect(await screen.findByTestId('detalle-pedido')).toBeTruthy();
    expect(screen.getByText('Pedido NUB-00042')).toBeTruthy();
    expect(screen.getByTestId('detalle-pedido-item-0')).toBeTruthy();
    expect(screen.getByTestId('detalle-pedido-total')).toHaveTextContent(formatearPrecio(1850));
    expect(screen.queryByTestId('detalle-pedido-guia')).toBeNull();
  });

  it('si tiene cupón muestra el descuento en el desglose', async () => {
    getPedidos.mockResolvedValue(
      normalizarPedidos([
        fila({ descuento_cupon: '185', codigo_cupon: 'XANTOLO10', total_pedido: '1665.00' }),
      ])
    );
    montar();

    expect(await screen.findByText('Cupón XANTOLO10')).toBeTruthy();
    expect(screen.getByText(`-${formatearPrecio(185)}`)).toBeTruthy();
  });

  it('un pedido enviado con guía permite rastrear el paquete', async () => {
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    getPedidos.mockResolvedValue(
      normalizarPedidos([fila({ estado_pedido: 'enviado', numero_guia: 'ABC123' })])
    );
    montar();

    expect(await screen.findByText('Número de guía: ABC123')).toBeTruthy();
    fireEvent.press(screen.getByTestId('detalle-pedido-rastrear'));
    await waitFor(() =>
      expect(Linking.openURL).toHaveBeenCalledWith(expect.stringContaining('ABC123'))
    );
  });

  it('si no se puede abrir el rastreo avisa', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('sin navegador'));
    getPedidos.mockResolvedValue(
      normalizarPedidos([fila({ estado_pedido: 'enviado', numero_guia: 'ABC123' })])
    );
    montar();

    fireEvent.press(await screen.findByTestId('detalle-pedido-rastrear'));
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        'No pudimos abrir el enlace',
        'Revisa tu conexión e inténtalo de nuevo.'
      )
    );
  });

  it('un pedido enviado sin guía avisa que pronto llegará', async () => {
    getPedidos.mockResolvedValue(normalizarPedidos([fila({ estado_pedido: 'enviado' })]));
    montar();

    expect(
      await screen.findByText('Pronto recibirás el número de guía para rastrear tu paquete.')
    ).toBeTruthy();
    expect(screen.queryByTestId('detalle-pedido-rastrear')).toBeNull();
  });

  it('si el pedido no existe ofrece volver a Mis pedidos', async () => {
    getPedidos.mockResolvedValue(normalizarPedidos([fila()]));
    const navigation = montar(999);

    fireEvent.press(await screen.findByTestId('detalle-pedido-no-encontrado-accion'));
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('si falla la carga muestra el error y "Reintentar" vuelve a pedirlo', async () => {
    getPedidos.mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    montar();
    expect(await screen.findByText('No pudimos cargar el pedido')).toBeTruthy();

    getPedidos.mockResolvedValueOnce(normalizarPedidos([fila()]));
    fireEvent.press(screen.getByTestId('estado-error-accion'));
    expect(await screen.findByTestId('detalle-pedido')).toBeTruthy();
  });

  it('si la sesión venció lo explica', async () => {
    getPedidos.mockRejectedValue(new ApiError('Tu sesión venció', 401));
    montar();
    expect(await screen.findByText('Tu sesión ya no es válida')).toBeTruthy();
  });
});

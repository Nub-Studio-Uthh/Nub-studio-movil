import { Alert, Linking } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { FinalizarCompraScreen } from '../../../src/views/screens/cart/FinalizarCompraScreen';
import { useAuth } from '../../../src/models/AuthContext';
import { getCarrito } from '../../../src/models/carritoService';
import { crearDireccion, getEstados, getMunicipios } from '../../../src/models/direccionService';
import { crearPago } from '../../../src/models/pagoService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../src/models/carritoService', () => ({
  getCarrito: jest.fn(),
  quitarDelCarrito: jest.fn(),
}));
jest.mock('../../../src/models/direccionService', () => ({
  getEstados: jest.fn(),
  getMunicipios: jest.fn(),
  crearDireccion: jest.fn(),
}));
jest.mock('../../../src/models/pagoService', () => ({ crearPago: jest.fn() }));

const ITEM = {
  idCarrito: 1,
  id: 7,
  slug: 'xantolo',
  titulo: 'Xantolo',
  imagen: null,
  artista: 'gus',
  cantidad: 1,
  precio: 1500,
  precioLista: 1500,
  precioOferta: null,
};

function montar() {
  const navigation = { navigate: jest.fn(), goBack: jest.fn(), replace: jest.fn() };
  render(<FinalizarCompraScreen navigation={navigation} />);
  return navigation;
}

async function llenarDireccion() {
  fireEvent.changeText(await screen.findByTestId('dir-calle'), 'Av. Juárez');
  fireEvent.changeText(screen.getByTestId('dir-num-ext'), '12');
  fireEvent.changeText(screen.getByTestId('dir-colonia'), 'Centro');
  fireEvent.changeText(screen.getByTestId('dir-cp'), '43000');
  fireEvent.press(await screen.findByTestId('dir-estado'));
  fireEvent.press(await screen.findByTestId('dir-estado-opcion-13'));
  await waitFor(() =>
    expect(screen.getByTestId('dir-municipio').props.accessibilityState.disabled).toBe(false)
  );
  fireEvent.press(screen.getByTestId('dir-municipio'));
  fireEvent.press(await screen.findByTestId('dir-municipio-opcion-28'));
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ status: 'authenticated', token: 'tk', usuario: { rol: 'cliente' } });
  getCarrito.mockResolvedValue([ITEM]);
  getEstados.mockResolvedValue([{ id: 13, nombre: 'Hidalgo' }]);
  getMunicipios.mockResolvedValue([{ id: 28, nombre: 'Huejutla de Reyes' }]);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
});

describe('FinalizarCompraScreen (HU-09)', () => {
  it('pide la dirección y no paga si está incompleta', async () => {
    montar();
    expect(await screen.findByTestId('finalizar-direccion')).toBeTruthy();
    expect(screen.getByText('Primero elige el estado.')).toBeTruthy();

    fireEvent.press(screen.getByTestId('finalizar-continuar'));
    expect(await screen.findByText('Escribe la calle.')).toBeTruthy();
    expect(crearDireccion).not.toHaveBeenCalled();
  });

  it('con la dirección completa abre Mercado Pago y lleva a Mis pedidos', async () => {
    crearDireccion.mockResolvedValue(55);
    crearPago.mockResolvedValue({ idPedido: 40, url: 'https://mp.com/pagar' });
    const navigation = montar();
    await llenarDireccion();

    fireEvent.press(screen.getByTestId('finalizar-continuar'));
    await waitFor(() => expect(Linking.openURL).toHaveBeenCalledWith('https://mp.com/pagar'));
    expect(crearPago).toHaveBeenCalledWith('tk', 55, null);
    expect(navigation.replace).toHaveBeenCalledWith('Pedidos');
  });

  it('si el backend rechaza el pago muestra el motivo y se queda en la pantalla', async () => {
    crearDireccion.mockResolvedValue(55);
    crearPago.mockRejectedValue(new ApiError('Stock insuficiente para "Xantolo".', 400));
    const navigation = montar();
    await llenarDireccion();

    fireEvent.press(screen.getByTestId('finalizar-continuar'));
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        'No pudimos iniciar el pago',
        'Stock insuficiente para "Xantolo".'
      )
    );
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});

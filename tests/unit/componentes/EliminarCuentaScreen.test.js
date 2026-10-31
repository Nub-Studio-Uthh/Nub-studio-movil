import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { EliminarCuentaScreen } from '../../../src/views/screens/profile/EliminarCuentaScreen';
import { useAuth } from '../../../src/models/AuthContext';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));

const eliminarCuenta = jest.fn();
function montar() {
  const navigation = { goBack: jest.fn(), reset: jest.fn() };
  render(<EliminarCuentaScreen navigation={navigation} />);
  return navigation;
}

// Simula que la persona confirma en el diálogo ("Eliminar").
function confirmarDialogo() {
  const [, , botones] = Alert.alert.mock.calls.find(
    ([titulo]) => titulo === '¿Eliminar tu cuenta?'
  );
  return act(() => botones.find((b) => b.style === 'destructive').onPress());
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ eliminarCuenta });
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('EliminarCuentaScreen (ARCO, Cancelación)', () => {
  it('explica qué se borra y qué se conserva', () => {
    montar();
    expect(screen.getByTestId('eliminar-explicacion')).toBeTruthy();
    expect(screen.getByText(/Tus favoritos, tu carrito y tus direcciones/)).toBeTruthy();
    expect(screen.getByText(/Tus compras ya hechas se guardan/)).toBeTruthy();
  });

  it('sin contraseña avisa y no abre la confirmación', async () => {
    montar();
    await act(async () => {
      fireEvent.press(screen.getByTestId('eliminar-confirmar'));
    });
    expect(screen.getByTestId('eliminar-error')).toBeTruthy();
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(eliminarCuenta).not.toHaveBeenCalled();
  });

  it('confirma, elimina la cuenta y regresa al inicio de sesión', async () => {
    eliminarCuenta.mockResolvedValue(undefined);
    const navigation = montar();
    fireEvent.changeText(screen.getByTestId('eliminar-contrasena'), 'Huapango.26');
    fireEvent.press(screen.getByTestId('eliminar-confirmar'));
    await confirmarDialogo();
    await waitFor(() =>
      expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Login' }] })
    );
    expect(eliminarCuenta).toHaveBeenCalledWith('Huapango.26');
    expect(Alert.alert).toHaveBeenCalledWith('Cuenta eliminada', expect.any(String));
  });

  it('si hay un pedido en camino lo dice y no cierra la pantalla', async () => {
    eliminarCuenta.mockRejectedValue(new Error('Tienes un pedido en camino.'));
    const navigation = montar();
    fireEvent.changeText(screen.getByTestId('eliminar-contrasena'), 'Huapango.26');
    fireEvent.press(screen.getByTestId('eliminar-confirmar'));
    await confirmarDialogo();
    expect(await screen.findByText('Tienes un pedido en camino.')).toBeTruthy();
    expect(navigation.reset).not.toHaveBeenCalled();
  });
});

jest.setTimeout(20000);

import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { RecuperarContrasenaScreen } from '../../../src/views/screens/auth/RecuperarContrasenaScreen';
import { useAuth } from '../../../src/models/AuthContext';
import {
  pedirCodigoRecuperacion,
  restablecerContrasena,
  validarCodigoRecuperacion,
} from '../../../src/models/authService';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../src/models/authService', () => ({
  pedirCodigoRecuperacion: jest.fn(),
  validarCodigoRecuperacion: jest.fn(),
  restablecerContrasena: jest.fn(),
}));

function montar(params = {}) {
  const navigation = { goBack: jest.fn(), reset: jest.fn(), navigate: jest.fn() };
  render(<RecuperarContrasenaScreen navigation={navigation} route={{ params }} />);
  return navigation;
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ status: 'guest', token: null, usuario: null });
  pedirCodigoRecuperacion.mockResolvedValue({ correoOculto: 'gu***vo@c***.com' });
  validarCodigoRecuperacion.mockResolvedValue(undefined);
  restablecerContrasena.mockResolvedValue(undefined);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('RecuperarContrasenaScreen (HU-06)', () => {
  it('recorre los 3 pasos y regresa al inicio de sesión con el correo', async () => {
    const navigation = montar({ correo: 'gustavo@correo.com' });
    expect(screen.getByText('PASO 1 DE 3')).toBeTruthy();
    expect(screen.getByTestId('recuperar-correo').props.value).toBe('gustavo@correo.com');

    fireEvent.press(screen.getByTestId('recuperar-enviar'));
    expect(await screen.findByText('PASO 2 DE 3')).toBeTruthy();
    expect(pedirCodigoRecuperacion).toHaveBeenCalledWith('gustavo@correo.com');

    fireEvent.changeText(screen.getByTestId('recuperar-codigo'), 'vm32v8');
    expect(screen.getByTestId('recuperar-codigo').props.value).toBe('VM32V8');
    fireEvent.press(screen.getByTestId('recuperar-verificar'));
    expect(await screen.findByText('PASO 3 DE 3')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('recuperar-nueva'), 'Huapango.26');
    fireEvent.changeText(screen.getByTestId('recuperar-confirmacion'), 'Huapango.26');
    fireEvent.press(screen.getByTestId('recuperar-guardar'));
    await waitFor(() =>
      expect(navigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [
          { name: 'Login', params: { correo: 'gustavo@correo.com', contrasenaNueva: true } },
        ],
      })
    );
    expect(restablecerContrasena).toHaveBeenCalledWith({
      correo: 'gustavo@correo.com',
      codigo: 'VM32V8',
      nueva: 'Huapango.26',
    });
  });

  it('no avanza con un correo inválido ni con un código incompleto', async () => {
    montar();
    fireEvent.changeText(screen.getByTestId('recuperar-correo'), 'sin-arroba');
    fireEvent.press(screen.getByTestId('recuperar-enviar'));
    expect(screen.getByText('Ingresa un correo válido.')).toBeTruthy();
    expect(pedirCodigoRecuperacion).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByTestId('recuperar-correo'), 'a@b.com');
    fireEvent.press(screen.getByTestId('recuperar-enviar'));
    await screen.findByText('PASO 2 DE 3');
    fireEvent.changeText(screen.getByTestId('recuperar-codigo'), 'AB1');
    fireEvent.press(screen.getByTestId('recuperar-verificar'));
    expect(screen.getByText('El código tiene 6 letras o números.')).toBeTruthy();
    expect(validarCodigoRecuperacion).not.toHaveBeenCalled();
  });

  it('muestra el error del backend y deja reenviar el código', async () => {
    validarCodigoRecuperacion.mockRejectedValue(
      new ApiError('El código no es válido o ya venció. Pide uno nuevo.', 401)
    );
    montar({ correo: 'a@b.com' });
    fireEvent.press(screen.getByTestId('recuperar-enviar'));
    await screen.findByText('PASO 2 DE 3');
    fireEvent.changeText(screen.getByTestId('recuperar-codigo'), 'XXXXXX');
    fireEvent.press(screen.getByTestId('recuperar-verificar'));
    expect(
      await screen.findByText('El código no es válido o ya venció. Pide uno nuevo.')
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('recuperar-reenviar'));
    expect(await screen.findByText('Te enviamos un código nuevo.')).toBeTruthy();
    expect(pedirCodigoRecuperacion).toHaveBeenCalledTimes(2);
  });

  it('valida la contraseña nueva antes de enviarla', async () => {
    montar({ correo: 'a@b.com' });
    fireEvent.press(screen.getByTestId('recuperar-enviar'));
    await screen.findByText('PASO 2 DE 3');
    fireEvent.changeText(screen.getByTestId('recuperar-codigo'), 'VM32V8');
    fireEvent.press(screen.getByTestId('recuperar-verificar'));
    await screen.findByText('PASO 3 DE 3');
    fireEvent.changeText(screen.getByTestId('recuperar-nueva'), 'sinmayuscula1!');
    fireEvent.press(screen.getByTestId('recuperar-guardar'));
    expect(screen.getByText('Agrega al menos una mayúscula.')).toBeTruthy();
    expect(restablecerContrasena).not.toHaveBeenCalled();
  });

  it('desde Cuenta usa el correo de la sesión y al terminar regresa', async () => {
    useAuth.mockReturnValue({
      status: 'authenticated',
      token: 'tk',
      usuario: { correo: 'cliente@correo.com', rol: 'cliente' },
    });
    const navigation = montar({ modo: 'cuenta' });
    expect(screen.getByText('CAMBIAR CONTRASEÑA')).toBeTruthy();
    expect(screen.queryByTestId('recuperar-correo')).toBeNull();

    fireEvent.press(screen.getByTestId('recuperar-enviar'));
    await screen.findByText('PASO 2 DE 3');
    expect(pedirCodigoRecuperacion).toHaveBeenCalledWith('cliente@correo.com');
    fireEvent.changeText(screen.getByTestId('recuperar-codigo'), 'VM32V8');
    fireEvent.press(screen.getByTestId('recuperar-verificar'));
    await screen.findByText('PASO 3 DE 3');
    fireEvent.changeText(screen.getByTestId('recuperar-nueva'), 'Huapango.26');
    fireEvent.changeText(screen.getByTestId('recuperar-confirmacion'), 'Huapango.26');
    fireEvent.press(screen.getByTestId('recuperar-guardar'));
    await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
    expect(Alert.alert).toHaveBeenCalledWith('Contraseña actualizada', expect.any(String));
    expect(navigation.reset).not.toHaveBeenCalled();
  });

  it('desde el paso 2, regresar vuelve al paso 1', async () => {
    const navigation = montar({ correo: 'a@b.com' });
    fireEvent.press(screen.getByTestId('recuperar-enviar'));
    await screen.findByText('PASO 2 DE 3');
    fireEvent.press(screen.getByTestId('layout-volver'));
    expect(screen.getByText('PASO 1 DE 3')).toBeTruthy();
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
});
jest.setTimeout(20000);

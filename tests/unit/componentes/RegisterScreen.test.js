import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { RegisterScreen } from '../../../src/views/screens/auth/RegisterScreen';
import { useAuth } from '../../../src/models/AuthContext';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));

const signUp = jest.fn();

function montar() {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  render(<RegisterScreen navigation={navigation} />);
  return navigation;
}

function llenar({
  nombre = 'Ana López',
  correo = 'ana@mail.com',
  contrasena = 'Secreta1!',
  confirmacion = contrasena,
} = {}) {
  fireEvent.changeText(screen.getByTestId('registro-nombre'), nombre);
  fireEvent.changeText(screen.getByTestId('registro-correo'), correo);
  fireEvent.changeText(screen.getByTestId('registro-contrasena'), contrasena);
  fireEvent.changeText(screen.getByTestId('registro-confirmacion'), confirmacion);
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ signUp });
});

describe('RegisterScreen (HU-06)', () => {
  it('con el formulario vacío marca cada campo y no crea la cuenta', async () => {
    montar();
    fireEvent.press(screen.getByTestId('registro-enviar'));

    expect(await screen.findByText('Este campo es obligatorio')).toBeTruthy();
    expect(screen.getByText('Ingresa un correo válido')).toBeTruthy();
    expect(screen.getByText('Mínimo 8 caracteres')).toBeTruthy();
    expect(screen.getByText('Debes aceptar los términos y condiciones')).toBeTruthy();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('valida el nombre, la confirmación y los términos', async () => {
    montar();
    llenar({ nombre: 'Ana123', confirmacion: 'Otra1234!' });
    fireEvent.press(screen.getByTestId('registro-enviar'));

    expect(await screen.findByText('Solo se permiten letras')).toBeTruthy();
    expect(screen.getByText('Las contraseñas no coinciden')).toBeTruthy();
    expect(screen.getByText('Debes aceptar los términos y condiciones')).toBeTruthy();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('la casilla de términos se marca y desmarca', () => {
    montar();
    const casilla = () => screen.getByTestId('registro-terminos');
    expect(casilla().props.accessibilityState.checked).toBe(false);
    fireEvent.press(casilla());
    expect(casilla().props.accessibilityState.checked).toBe(true);
    fireEvent.press(casilla());
    expect(casilla().props.accessibilityState.checked).toBe(false);
  });

  it('con datos válidos crea la cuenta y lleva a verificar el correo', async () => {
    signUp.mockResolvedValue({ correo: 'ana@mail.com' });
    const navigation = montar();
    llenar();
    fireEvent.press(screen.getByTestId('registro-terminos'));
    fireEvent.press(screen.getByTestId('registro-enviar'));

    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('VerifyEmail', { correo: 'ana@mail.com' })
    );
    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Ana López', correo: 'ana@mail.com', aceptaTerminos: true })
    );
  });

  it('si el correo ya está registrado lo marca debajo del campo', async () => {
    signUp.mockRejectedValue(new ApiError('Este correo ya está registrado.', 409));
    const navigation = montar();
    llenar();
    fireEvent.press(screen.getByTestId('registro-terminos'));
    fireEvent.press(screen.getByTestId('registro-enviar'));

    expect(await screen.findByText('Este correo ya está registrado.')).toBeTruthy();
    expect(screen.queryByTestId('registro-error')).toBeNull();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('otros errores se muestran como aviso general', async () => {
    signUp.mockRejectedValue(new ApiError('Sin conexión', 0));
    montar();
    llenar();
    fireEvent.press(screen.getByTestId('registro-terminos'));
    fireEvent.press(screen.getByTestId('registro-enviar'));

    expect(await screen.findByTestId('registro-error')).toHaveTextContent('Sin conexión');
  });

  it('"Inicia sesión" regresa a la pantalla anterior', () => {
    const navigation = montar();
    fireEvent.press(screen.getByTestId('registro-login'));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});

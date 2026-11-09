import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../../../src/views/screens/auth/LoginScreen';
import { useAuth } from '../../../src/models/AuthContext';
import { ApiError } from '../../../src/models/api';

jest.mock('../../../src/models/AuthContext', () => ({ useAuth: jest.fn() }));

const signIn = jest.fn();

function montar(params) {
  const navigation = {
    navigate: jest.fn(),
    reset: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(() => true),
  };
  render(<LoginScreen navigation={navigation} route={{ params }} />);
  return navigation;
}

function llenar(correo, contrasena) {
  fireEvent.changeText(screen.getByTestId('login-correo'), correo);
  fireEvent.changeText(screen.getByTestId('login-contrasena'), contrasena);
}

const deshabilitado = () => screen.getByTestId('login-ingresar').props.accessibilityState.disabled;

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ signIn });
});

describe('LoginScreen (HU-06)', () => {
  it('el botón se activa solo cuando hay correo y contraseña', () => {
    montar();
    expect(deshabilitado()).toBe(true);

    fireEvent.changeText(screen.getByTestId('login-correo'), 'ana@mail.com');
    expect(deshabilitado()).toBe(true);

    fireEvent.changeText(screen.getByTestId('login-contrasena'), 'Secreta1!');
    expect(deshabilitado()).toBe(false);
  });

  it('con un correo no válido muestra el error y no intenta entrar', async () => {
    montar();
    llenar('ana@', 'Secreta1!');
    fireEvent.press(screen.getByTestId('login-ingresar'));

    expect(await screen.findByText('Ingresa un correo válido')).toBeTruthy();
    expect(signIn).not.toHaveBeenCalled();

    // Al corregir el campo se quita su error.
    fireEvent.changeText(screen.getByTestId('login-correo'), 'ana@mail.com');
    expect(screen.queryByText('Ingresa un correo válido')).toBeNull();
  });

  it('con datos correctos inicia sesión y lleva a las pestañas', async () => {
    signIn.mockResolvedValue();
    const navigation = montar();
    llenar('ana@mail.com', 'Secreta1!');
    fireEvent.press(screen.getByTestId('login-ingresar'));

    await waitFor(() =>
      expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Tabs' }] })
    );
    expect(signIn).toHaveBeenCalledWith({ correo: 'ana@mail.com', contrasena: 'Secreta1!' });
  });

  it('si se abrió desde otra pantalla regresa a ella al iniciar sesión', async () => {
    signIn.mockResolvedValue();
    const navigation = montar({ regresar: true });
    llenar('ana@mail.com', 'Secreta1!');
    fireEvent.press(screen.getByTestId('login-ingresar'));

    await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
    expect(navigation.reset).not.toHaveBeenCalled();
  });

  it('si el backend rechaza el acceso muestra su mensaje', async () => {
    signIn.mockRejectedValue(new ApiError('Contraseña incorrecta', 401));
    const navigation = montar();
    llenar('ana@mail.com', 'mala-contra');
    fireEvent.press(screen.getByTestId('login-ingresar'));

    expect(await screen.findByTestId('login-error')).toHaveTextContent('Contraseña incorrecta');
    expect(navigation.reset).not.toHaveBeenCalled();
    expect(deshabilitado()).toBe(false);
  });

  it('una cuenta sin verificar lleva a poner el código del correo', async () => {
    signIn.mockRejectedValue(
      new ApiError('Verifica tu correo', 403, { requiresVerification: true })
    );
    const navigation = montar();
    llenar(' ana@mail.com ', 'Secreta1!');
    fireEvent.press(screen.getByTestId('login-ingresar'));

    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('VerifyEmail', { correo: 'ana@mail.com' })
    );
  });

  it('llega con el correo ya escrito y avisa que se verificó', () => {
    montar({ correo: 'ana@mail.com', verificado: true });
    expect(screen.getByTestId('login-correo').props.value).toBe('ana@mail.com');
    expect(screen.getByText('Correo verificado. Ya puedes iniciar sesión.')).toBeTruthy();
  });

  it('avisa cuando se acaba de cambiar la contraseña', () => {
    montar({ contrasenaNueva: true });
    expect(screen.getByTestId('login-contrasena-nueva')).toBeTruthy();
  });

  it('el ojito muestra y oculta la contraseña', () => {
    montar();
    expect(screen.getByTestId('login-contrasena').props.secureTextEntry).toBe(true);
    fireEvent.press(screen.getByTestId('login-contrasena-toggle'));
    expect(screen.getByTestId('login-contrasena').props.secureTextEntry).toBe(false);
  });

  it('los enlaces llevan a recuperar contraseña, registro y explorar sin cuenta', () => {
    const navigation = montar();
    fireEvent.changeText(screen.getByTestId('login-correo'), 'ana@mail.com');

    fireEvent.press(screen.getByTestId('login-olvidaste'));
    expect(navigation.navigate).toHaveBeenCalledWith('RecuperarContrasena', {
      correo: 'ana@mail.com',
    });

    fireEvent.press(screen.getByTestId('login-registrate'));
    expect(navigation.navigate).toHaveBeenCalledWith('Register');

    fireEvent.press(screen.getByTestId('login-explorar'));
    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Tabs' }] });
  });
});

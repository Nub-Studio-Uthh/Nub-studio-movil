// Integración (#45): autenticación. Pantallas + AuthContext + authService + api.js +
// almacenamiento seguro, con el backend simulado (solo se reemplaza fetch).
import { CLIENTE, crearBackend } from './backendFalso';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../../src/models/AuthContext';
import { LoginScreen } from '../../../src/views/screens/auth/LoginScreen';
import { RegisterScreen } from '../../../src/views/screens/auth/RegisterScreen';
import { VerifyEmailScreen } from '../../../src/views/screens/auth/VerifyEmailScreen';
import { CarritoScreen } from '../../../src/views/screens/cart/CarritoScreen';
import { almacen } from './secureStoreFalso';

jest.mock('expo-secure-store', () => require('./secureStoreFalso'));

// Muestra el estado de la sesión y permite cerrarla, como lo haría la pantalla de Cuenta.
function Sesion() {
  const { status, usuario, sesionVencida, signOut } = useAuth();
  return (
    <>
      <Text testID="sesion-estado">{status}</Text>
      <Text testID="sesion-usuario">{usuario?.nombre ?? ''}</Text>
      <Text testID="sesion-vencida">{sesionVencida ? 'si' : 'no'}</Text>
      <Pressable testID="sesion-cerrar" onPress={signOut} />
    </>
  );
}

const navegacion = () => ({
  navigate: jest.fn(),
  reset: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
  canGoBack: jest.fn(() => false),
  addListener: jest.fn(() => jest.fn()),
});

function montar(Pantalla, props = {}) {
  const navigation = navegacion();
  const vista = render(
    <AuthProvider>
      <Pantalla navigation={navigation} route={{ params: props }} />
      <Sesion />
    </AuthProvider>
  );
  return { navigation, ...vista };
}

const estado = () => screen.getByTestId('sesion-estado').props.children;
const guardarSesion = (token = 'tk-guardado') => {
  almacen.set('nub_token', token);
  almacen.set('nub_usuario', JSON.stringify(CLIENTE));
};

let api;
beforeEach(() => {
  almacen.clear();
  api = crearBackend();
  api.ruta('GET /api/auth/check-session', () => ({ success: true }));
  api.ruta('POST /api/auth/logout', () => ({ success: true }));
});

describe('Integración: inicio de sesión', () => {
  it('con datos correctos guarda la sesión en el teléfono y entra a la app', async () => {
    api.ruta('POST /api/auth/login', () => ({ access_token: 'tk-nuevo', usuario: CLIENTE }));
    const { navigation } = montar(LoginScreen);
    await waitFor(() => expect(estado()).toBe('guest'));

    fireEvent.changeText(screen.getByTestId('login-correo'), '  ana@mail.com ');
    fireEvent.changeText(screen.getByTestId('login-contrasena'), 'Secreta1!');
    fireEvent.press(screen.getByTestId('login-ingresar'));

    await waitFor(() => expect(estado()).toBe('authenticated'));
    expect(screen.getByTestId('sesion-usuario')).toHaveTextContent('Ana López');
    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Tabs' }] });
    expect(api.llamadas('POST /api/auth/login')[0].body).toEqual({
      correo: 'ana@mail.com',
      contrasena: 'Secreta1!',
    });
    expect(almacen.get('nub_token')).toBe('tk-nuevo');
    expect(JSON.parse(almacen.get('nub_usuario'))).toMatchObject({ rol: 'cliente' });
  });

  it('con la contraseña incorrecta muestra el mensaje del servidor y no guarda nada', async () => {
    api.ruta('POST /api/auth/login', () => [401, { message: 'Contraseña incorrecta' }]);
    const { navigation } = montar(LoginScreen);
    await waitFor(() => expect(estado()).toBe('guest'));

    fireEvent.changeText(screen.getByTestId('login-correo'), 'ana@mail.com');
    fireEvent.changeText(screen.getByTestId('login-contrasena'), 'mala');
    fireEvent.press(screen.getByTestId('login-ingresar'));

    expect(await screen.findByTestId('login-error')).toHaveTextContent('Contraseña incorrecta');
    expect(estado()).toBe('guest');
    expect(navigation.reset).not.toHaveBeenCalled();
    expect(almacen.has('nub_token')).toBe(false);
  });

  it('una cuenta sin verificar lleva a poner el código del correo', async () => {
    api.ruta('POST /api/auth/login', () => [
      403,
      { message: 'Verifica tu correo', requiresVerification: true },
    ]);
    const { navigation } = montar(LoginScreen);
    await waitFor(() => expect(estado()).toBe('guest'));

    fireEvent.changeText(screen.getByTestId('login-correo'), 'ana@mail.com');
    fireEvent.changeText(screen.getByTestId('login-contrasena'), 'Secreta1!');
    fireEvent.press(screen.getByTestId('login-ingresar'));

    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('VerifyEmail', { correo: 'ana@mail.com' })
    );
    expect(estado()).toBe('guest');
  });
});

describe('Integración: sesión persistente', () => {
  it('al abrir la app con una sesión guardada la valida con el backend y sigue dentro', async () => {
    guardarSesion();
    montar(LoginScreen);

    await waitFor(() => expect(estado()).toBe('authenticated'));
    expect(screen.getByTestId('sesion-usuario')).toHaveTextContent('Ana López');
    expect(api.llamadas('GET /api/auth/check-session')[0].token).toBe('tk-guardado');
  });

  it('si el token guardado ya venció, lo borra y entra como invitado', async () => {
    guardarSesion();
    api.ruta('GET /api/auth/check-session', () => [401, { message: 'Token expirado' }]);
    montar(LoginScreen);

    await waitFor(() => expect(estado()).toBe('guest'));
    expect(almacen.has('nub_token')).toBe(false);
    expect(almacen.has('nub_usuario')).toBe(false);
  });

  it('sin internet al abrir conserva la sesión guardada', async () => {
    guardarSesion();
    api.ruta('GET /api/auth/check-session', () => {
      throw new TypeError('Network request failed');
    });
    montar(LoginScreen);

    await waitFor(() => expect(estado()).toBe('authenticated'));
    expect(almacen.get('nub_token')).toBe('tk-guardado');
  });

  it('cerrar sesión avisa al backend y borra la sesión del teléfono', async () => {
    guardarSesion();
    montar(LoginScreen);
    await waitFor(() => expect(estado()).toBe('authenticated'));

    await act(async () => fireEvent.press(screen.getByTestId('sesion-cerrar')));

    expect(estado()).toBe('guest');
    expect(api.llamadas('POST /api/auth/logout')[0].token).toBe('tk-guardado');
    expect(almacen.size).toBe(0);
  });

  it('si el backend rechaza el token en plena sesión, se cierra en toda la app', async () => {
    guardarSesion();
    api.ruta('GET /api/carrito', () => [401, { message: 'Token expirado', code: 'TOKEN_EXPIRED' }]);
    montar(CarritoScreen);

    // El carrito pide sus datos con el token; el 401 cierra la sesión de forma central.
    await waitFor(() => expect(screen.getByTestId('sesion-vencida')).toHaveTextContent('si'));
    expect(estado()).toBe('guest');
    expect(api.llamadas('GET /api/carrito')[0].token).toBe('tk-guardado');
    expect(await screen.findByTestId('carrito-invitado')).toBeTruthy();
    await waitFor(() => expect(almacen.size).toBe(0));
  });
});

describe('Integración: registro y verificación de correo', () => {
  it('crea la cuenta, verifica el correo y regresa a iniciar sesión con el correo escrito', async () => {
    api.ruta('POST /api/auth/register', () => [201, { success: true }]);
    api.ruta('POST /api/auth/verify-email', () => ({ success: true }));

    const registro = montar(RegisterScreen);
    await waitFor(() => expect(estado()).toBe('guest'));
    fireEvent.changeText(screen.getByTestId('registro-nombre'), ' Ana López ');
    fireEvent.changeText(screen.getByTestId('registro-correo'), 'ana@mail.com');
    fireEvent.changeText(screen.getByTestId('registro-contrasena'), 'Secreta1!');
    fireEvent.changeText(screen.getByTestId('registro-confirmacion'), 'Secreta1!');
    fireEvent.press(screen.getByTestId('registro-terminos'));
    fireEvent.press(screen.getByTestId('registro-enviar'));

    await waitFor(() =>
      expect(registro.navigation.navigate).toHaveBeenCalledWith('VerifyEmail', {
        correo: 'ana@mail.com',
      })
    );
    expect(api.llamadas('POST /api/auth/register')[0].body).toEqual({
      nombre: 'Ana López',
      correo: 'ana@mail.com',
      contrasena: 'Secreta1!',
      aceptoTerminos: true,
    });
    // Registrar no inicia sesión.
    expect(estado()).toBe('guest');
    registro.unmount();

    const verificar = montar(VerifyEmailScreen, { correo: 'ana@mail.com' });
    fireEvent.changeText(screen.getByTestId('verificar-codigo'), '123456');
    fireEvent.press(screen.getByTestId('verificar-enviar'));

    await waitFor(() =>
      expect(verificar.navigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'Login', params: { correo: 'ana@mail.com', verificado: true } }],
      })
    );
    expect(api.llamadas('POST /api/auth/verify-email')[0].body).toEqual({
      correo: 'ana@mail.com',
      codigo: '123456',
    });
  });

  it('si el correo ya existe lo marca en el campo y no avanza', async () => {
    api.ruta('POST /api/auth/register', () => [400, { message: 'El correo ya está registrado' }]);
    const { navigation } = montar(RegisterScreen);
    await waitFor(() => expect(estado()).toBe('guest'));

    fireEvent.changeText(screen.getByTestId('registro-nombre'), 'Ana López');
    fireEvent.changeText(screen.getByTestId('registro-correo'), 'ana@mail.com');
    fireEvent.changeText(screen.getByTestId('registro-contrasena'), 'Secreta1!');
    fireEvent.changeText(screen.getByTestId('registro-confirmacion'), 'Secreta1!');
    fireEvent.press(screen.getByTestId('registro-terminos'));
    fireEvent.press(screen.getByTestId('registro-enviar'));

    expect(await screen.findByText('Este correo ya está registrado.')).toBeTruthy();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});

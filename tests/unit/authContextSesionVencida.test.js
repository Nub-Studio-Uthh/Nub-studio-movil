import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider, useAuth } from '../../src/models/AuthContext';
import { setManejadorSesionInvalida } from '../../src/models/api';
import { login, verificarSesion } from '../../src/models/authService';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('../../src/models/authService', () => ({
  login: jest.fn(),
  verificarSesion: jest.fn(),
}));
jest.mock('../../src/models/api', () => ({
  ...jest.requireActual('../../src/models/api'),
  setManejadorSesionInvalida: jest.fn(),
}));

const USUARIO = { nombre: 'Ana', rol: 'cliente' };

let guardados;

async function montarConSesion() {
  const hook = renderHook(() => useAuth(), { wrapper: AuthProvider });
  await waitFor(() => expect(hook.result.current.status).toBe('authenticated'));
  return hook;
}

const avisar = (token) =>
  act(async () => {
    await setManejadorSesionInvalida.mock.calls[0][0](token);
  });

beforeEach(() => {
  jest.clearAllMocks();
  guardados = { nub_token: 'tkn', nub_usuario: JSON.stringify(USUARIO) };
  SecureStore.getItemAsync.mockImplementation(async (clave) => guardados[clave] ?? null);
  SecureStore.setItemAsync.mockImplementation(async (clave, valor) => {
    guardados[clave] = valor;
  });
  SecureStore.deleteItemAsync.mockImplementation(async (clave) => {
    delete guardados[clave];
  });
  verificarSesion.mockResolvedValue({ valid: true });
});

describe('AuthContext: sesión vencida', () => {
  it('cierra la sesión y borra lo guardado en el dispositivo', async () => {
    const { result } = await montarConSesion();
    await avisar('tkn');
    expect(result.current.status).toBe('guest');
    expect(result.current.token).toBeNull();
    expect(result.current.sesionVencida).toBe(true);
    expect(guardados).toEqual({});
  });

  it('una respuesta con un token viejo no cierra la sesión actual', async () => {
    const { result } = await montarConSesion();
    await avisar('token-viejo');
    expect(result.current.status).toBe('authenticated');
    expect(result.current.token).toBe('tkn');
    expect(guardados.nub_token).toBe('tkn');
  });

  it('varias respuestas rechazadas cuentan como una', async () => {
    const { result } = await montarConSesion();
    const primero = result.current;
    await avisar('tkn');
    const cerrado = result.current;
    await avisar('tkn');
    expect(primero.status).toBe('authenticated');
    expect(result.current).toBe(cerrado);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2); // token y usuario, una vez
  });

  it('iniciar sesión de nuevo quita el aviso', async () => {
    login.mockResolvedValue({ token: 'nuevo', usuario: USUARIO });
    const { result } = await montarConSesion();
    await avisar('tkn');
    await act(async () => {
      await result.current.signIn({ correo: 'a@b.mx', contrasena: 'x' });
    });
    expect(result.current.status).toBe('authenticated');
    expect(result.current.sesionVencida).toBeUndefined();
  });

  it('no avisa a la persona si el token ya venció al abrir la app', async () => {
    verificarSesion.mockRejectedValue(
      new (jest.requireActual('../../src/models/api').ApiError)('x', 401)
    );
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.status).toBe('guest'));
    expect(result.current.sesionVencida).toBeUndefined();
  });

  it('deja de escuchar al desmontarse', async () => {
    const { unmount } = await montarConSesion();
    unmount();
    expect(setManejadorSesionInvalida).toHaveBeenLastCalledWith(null);
  });
});

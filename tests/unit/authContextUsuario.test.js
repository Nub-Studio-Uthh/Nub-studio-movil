import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider, useAuth } from '../../src/models/AuthContext';
import { verificarSesion } from '../../src/models/authService';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('../../src/models/authService', () => ({ verificarSesion: jest.fn() }));

const USUARIO = { nombre: 'Ana', correo: 'ana@correo.mx', rol: 'cliente' };

beforeEach(() => {
  jest.clearAllMocks();
  SecureStore.getItemAsync.mockImplementation(async (clave) =>
    clave === 'nub_token' ? 'tkn' : JSON.stringify(USUARIO)
  );
  SecureStore.setItemAsync.mockResolvedValue(undefined);
  verificarSesion.mockResolvedValue({ valid: true });
});

describe('AuthContext: actualizarUsuario', () => {
  it('cambia el nombre de la sesión y lo guarda en el dispositivo', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.status).toBe('authenticated'));

    await act(async () => {
      await result.current.actualizarUsuario({ nombre: 'Ana Ruiz' });
    });

    expect(result.current.usuario).toEqual({ ...USUARIO, nombre: 'Ana Ruiz' });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'nub_usuario',
      JSON.stringify({ ...USUARIO, nombre: 'Ana Ruiz' })
    );
  });

  it('si no se puede guardar en el dispositivo, la pantalla igual se actualiza', async () => {
    SecureStore.setItemAsync.mockRejectedValue(new Error('sin espacio'));
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.status).toBe('authenticated'));

    await act(async () => {
      await result.current.actualizarUsuario({ nombre: 'Ana Ruiz' });
    });

    expect(result.current.usuario.nombre).toBe('Ana Ruiz');
  });
});

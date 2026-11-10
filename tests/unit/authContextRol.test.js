import { renderHook, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider, useAuth } from '../../src/models/AuthContext';
import { cerrarSesion, verificarSesion } from '../../src/models/authService';

// La app es solo para clientes (#148): una sesión guardada de artista o administrador
// (por ejemplo, de la versión 1.0.0) se cierra al abrir la app.
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('../../src/models/authService', () => ({
  verificarSesion: jest.fn(),
  cerrarSesion: jest.fn(),
}));

function conSesionGuardada(usuario) {
  SecureStore.getItemAsync.mockImplementation(async (clave) =>
    clave === 'nub_token' ? 'tkn' : JSON.stringify(usuario)
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  SecureStore.deleteItemAsync.mockResolvedValue(undefined);
  verificarSesion.mockResolvedValue({ valid: true });
  cerrarSesion.mockResolvedValue({});
});

describe('AuthContext: solo clientes (#148)', () => {
  it.each(['artista', 'admin'])('cierra la sesión guardada de un %s', async (rol) => {
    conSesionGuardada({ nombre: 'Leo', rol });
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.status).toBe('guest'));
    expect(cerrarSesion).toHaveBeenCalledWith('tkn');
    expect(verificarSesion).not.toHaveBeenCalled();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('nub_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('nub_usuario');
  });

  it('conserva la sesión de un cliente', async () => {
    conSesionGuardada({ nombre: 'Ana', rol: 'cliente' });
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(cerrarSesion).not.toHaveBeenCalled();
  });

  it('si no se puede avisar al backend, igual cierra la sesión local', async () => {
    conSesionGuardada({ nombre: 'Leo', rol: 'artista' });
    cerrarSesion.mockRejectedValue(new Error('sin red'));
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.status).toBe('guest'));
  });
});

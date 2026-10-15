import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ApiError } from './api';
import * as authService from './authService';

const TOKEN_KEY = 'nub_token';
const USUARIO_KEY = 'nub_usuario';
const GUEST = { status: 'guest', token: null, usuario: null };

const borrarSesionLocal = () =>
  Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(USUARIO_KEY),
  ]).catch(() => {});

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', token: null, usuario: null });

  // Al abrir la app: si hay token guardado, se valida con el backend.
  useEffect(() => {
    let cancelado = false;
    const set = (next) => !cancelado && setState(next);

    (async () => {
      let token = null;
      let usuario = null;
      try {
        token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!token) return set(GUEST);
        const guardado = await SecureStore.getItemAsync(USUARIO_KEY);
        usuario = guardado ? JSON.parse(guardado) : null;
        await authService.verificarSesion(token);
        set({ status: 'authenticated', token, usuario });
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await borrarSesionLocal(); // token vencido o revocado
          return set(GUEST);
        }
        // Sin red u otro fallo: se conserva la sesión guardada.
        set(token ? { status: 'authenticated', token, usuario } : GUEST);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  const guardarSesion = useCallback(async ({ token, usuario }) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USUARIO_KEY, JSON.stringify(usuario ?? null));
    setState({ status: 'authenticated', token, usuario });
  }, []);

  const signIn = useCallback(
    async (credenciales) => guardarSesion(await authService.login(credenciales)),
    [guardarSesion]
  );

  // Registrar no inicia sesión: el backend exige verificar el correo primero.
  const signUp = useCallback((datos) => authService.registrar(datos), []);

  const signOut = useCallback(async () => {
    // Se invalida también en el backend; si falla, igual se cierra local.
    if (state.token) authService.cerrarSesion(state.token).catch(() => {});
    await borrarSesionLocal();
    setState(GUEST);
  }, [state.token]);

  const changePassword = useCallback(
    (datos) => authService.cambiarContrasena(state.token, datos),
    [state.token]
  );

  const value = useMemo(
    () => ({ ...state, signIn, signUp, signOut, changePassword }),
    [state, signIn, signUp, signOut, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

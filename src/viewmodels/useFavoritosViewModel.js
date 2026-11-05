import { useCallback, useEffect, useRef, useState } from 'react';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { useAuth } from '../models/AuthContext';
import { getFavoritos, quitarFavorito } from '../models/favoritoService';
import { isAbortError } from '../models/api';
import { puedeTenerFavoritos, textoGuardadas } from '../utils/favoritos';

const INICIAL = { favoritos: [], status: 'loading', error: null, errorStatus: null };

/**
 * Favoritos (HU-07): obras guardadas por el cliente. Sin sesión no se pide nada a la API
 * y la pantalla invita a iniciar sesión. La vista llama a reload cada vez que se enfoca,
 * para ver lo que se agregó desde el detalle de una obra.
 */
export function useFavoritosViewModel() {
  const { status: sesion, token, usuario } = useAuth();
  const autenticado = sesion === 'authenticated';
  const esCliente = autenticado && puedeTenerFavoritos(usuario);

  const [state, setState] = useState(INICIAL);
  const controller = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const cargar = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!esCliente || !token) return;
      controller.current?.abort();
      const c = new AbortController();
      controller.current = c;
      // Al volver a la pestaña se recarga sin quitar la lista que ya se ve.
      setState((s) => (silencioso && s.status === 'success' ? s : INICIAL));
      try {
        const favoritos = await getFavoritos(token, { signal: c.signal });
        setState({ favoritos, status: 'success', error: null, errorStatus: null });
      } catch (error) {
        if (isAbortError(error)) return;
        setState((s) =>
          silencioso && s.status === 'success'
            ? s
            : { ...INICIAL, status: 'error', error: error.message, errorStatus: error.status }
        );
      }
    },
    [esCliente, token]
  );

  useEffect(() => {
    cargar();
    return () => controller.current?.abort();
  }, [cargar]);

  /**
   * Quita una obra de la lista de inmediato y la regresa a su lugar si el backend falla.
   * @returns {Promise<string|null>} mensaje de error para mostrar, o null si salió bien
   */
  const quitar = useCallback(
    async (obra) => {
      const indice = stateRef.current.favoritos.findIndex((f) => f.id === obra.id);
      setState((s) => ({ ...s, favoritos: s.favoritos.filter((f) => f.id !== obra.id) }));
      try {
        await quitarFavorito(token, obra.id);
        return null;
      } catch (error) {
        setState((s) => {
          if (s.favoritos.some((f) => f.id === obra.id)) return s;
          const favoritos = [...s.favoritos];
          favoritos.splice(indice < 0 ? favoritos.length : indice, 0, obra);
          return { ...s, favoritos };
        });
        return error.message;
      }
    },
    [token]
  );

  const isLoading = esCliente && state.status === 'loading';
  const showSkeleton = useDelayedLoading(isLoading);

  let vista = 'lista';
  if (!autenticado) vista = 'invitado';
  else if (!esCliente) vista = 'sin-permiso';
  else if (state.status === 'error') vista = state.errorStatus === 401 ? 'sesion-vencida' : 'error';

  return {
    vista,
    favoritos: state.favoritos,
    subtitulo: state.status === 'success' ? textoGuardadas(state.favoritos.length) : '',
    error: state.error,
    isLoading,
    // Menos de 150 ms cargando: no se muestra nada para no parpadear.
    esperando: isLoading && !showSkeleton,
    showSkeleton,
    reload: useCallback(() => cargar(), [cargar]),
    recargarEnSilencio: useCallback(() => cargar({ silencioso: true }), [cargar]),
    quitar,
  };
}

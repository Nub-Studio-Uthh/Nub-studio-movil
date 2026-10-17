import { useCallback, useEffect, useRef, useState } from 'react';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { useAuth } from '../models/AuthContext';
import { getCarrito, quitarDelCarrito } from '../models/carritoService';
import { isAbortError } from '../models/api';
import { calcularTotalCarrito } from '../utils/formatters';
import { contarPiezas, puedeTenerCarrito } from '../utils/carrito';

const INICIAL = { items: [], status: 'loading', error: null, errorStatus: null };

/**
 * Carrito (HU-08). Sin sesión no se pide nada a la API y la pantalla invita a iniciar sesión.
 * El total se calcula con lo que queda en la lista, así se actualiza al quitar una obra.
 * La vista llama a recargarEnSilencio cada vez que se enfoca la pestaña.
 */
export function useCarritoViewModel() {
  const { status: sesion, token, usuario } = useAuth();
  const autenticado = sesion === 'authenticated';
  const esCliente = autenticado && puedeTenerCarrito(usuario);

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
      setState((s) => (silencioso && s.status === 'success' ? s : INICIAL));
      try {
        const items = await getCarrito(token, { signal: c.signal });
        setState({ items, status: 'success', error: null, errorStatus: null });
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
   * Quita la obra de inmediato (y con ella baja el total); la regresa a su lugar si el backend falla.
   * @returns {Promise<string|null>} mensaje de error para mostrar, o null si salió bien
   */
  const quitar = useCallback(
    async (item) => {
      const indice = stateRef.current.items.findIndex((i) => i.idCarrito === item.idCarrito);
      setState((s) => ({ ...s, items: s.items.filter((i) => i.idCarrito !== item.idCarrito) }));
      try {
        await quitarDelCarrito(token, item.idCarrito);
        return null;
      } catch (error) {
        setState((s) => {
          if (s.items.some((i) => i.idCarrito === item.idCarrito)) return s;
          const items = [...s.items];
          items.splice(indice < 0 ? items.length : indice, 0, item);
          return { ...s, items };
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
    items: state.items,
    total: calcularTotalCarrito(state.items),
    piezas: contarPiezas(state.items),
    error: state.error,
    isLoading,
    esperando: isLoading && !showSkeleton,
    showSkeleton,
    reload: useCallback(() => cargar(), [cargar]),
    recargarEnSilencio: useCallback(() => cargar({ silencioso: true }), [cargar]),
    quitar,
  };
}

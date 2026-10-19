import { useCallback, useEffect, useRef, useState } from 'react';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { useAuth } from '../models/AuthContext';
import { getPedidos } from '../models/pedidoService';
import { isAbortError } from '../models/api';
import { puedeTenerPedidos } from '../utils/pedidos';

const INICIAL = { pedidos: [], status: 'loading', error: null, errorStatus: null };

/**
 * Mis pedidos (HU-10): lista de pedidos del cliente, incluidos los hechos en la web.
 * Sin sesión no se pide nada a la API. La vista llama a recargarEnSilencio cada vez que
 * se enfoca, para ver pedidos nuevos o cambios de estatus.
 */
export function usePedidosViewModel() {
  const { status: sesion, token, usuario } = useAuth();
  const autenticado = sesion === 'authenticated';
  const esCliente = autenticado && puedeTenerPedidos(usuario);

  const [state, setState] = useState(INICIAL);
  const controller = useRef(null);

  const cargar = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!esCliente || !token) return;
      controller.current?.abort();
      const c = new AbortController();
      controller.current = c;
      setState((s) => (silencioso && s.status === 'success' ? s : INICIAL));
      try {
        const pedidos = await getPedidos(token, { signal: c.signal });
        setState({ pedidos, status: 'success', error: null, errorStatus: null });
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

  const isLoading = esCliente && state.status === 'loading';
  const showSkeleton = useDelayedLoading(isLoading);

  let vista = 'lista';
  if (!autenticado) vista = 'invitado';
  else if (!esCliente) vista = 'sin-permiso';
  else if (state.status === 'error') vista = state.errorStatus === 401 ? 'sesion-vencida' : 'error';

  return {
    vista,
    pedidos: state.pedidos,
    error: state.error,
    isLoading,
    // Menos de 150 ms cargando: no se muestra nada para no parpadear.
    esperando: isLoading && !showSkeleton,
    showSkeleton,
    reload: useCallback(() => cargar(), [cargar]),
    recargarEnSilencio: useCallback(() => cargar({ silencioso: true }), [cargar]),
  };
}

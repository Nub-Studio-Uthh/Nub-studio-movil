import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../models/AuthContext';
import { getPedidos } from '../models/pedidoService';
import { isAbortError } from '../models/api';
import { puedeTenerPedidos } from '../utils/pedidos';

const INICIAL = { pedido: null, status: 'loading', error: null, errorStatus: null };

/**
 * Detalle de pedido (HU-10), solo consulta. El backend no tiene un endpoint de detalle,
 * así que se pide la lista de pedidos y se busca el que corresponde al id de la ruta.
 * @param {number|string} id id del pedido (parámetro de ruta)
 */
export function useDetallePedidoViewModel(id) {
  const { status: sesion, token, usuario } = useAuth();
  const autenticado = sesion === 'authenticated';
  const esCliente = autenticado && puedeTenerPedidos(usuario);

  const [state, setState] = useState(INICIAL);
  // "Reintentar" suma uno para que el efecto vuelva a pedir los datos.
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!esCliente || !token) return undefined;
    const c = new AbortController();
    getPedidos(token, { signal: c.signal })
      .then((pedidos) => {
        const pedido = pedidos.find((p) => String(p.id) === String(id)) ?? null;
        setState({ pedido, status: pedido ? 'success' : 'vacio', error: null, errorStatus: null });
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        setState({ ...INICIAL, status: 'error', error: error.message, errorStatus: error.status });
      });
    return () => c.abort();
  }, [esCliente, token, id, intento]);

  const reload = useCallback(() => {
    setState(INICIAL);
    setIntento((n) => n + 1);
  }, []);

  let vista = 'detalle';
  if (!autenticado) vista = 'invitado';
  else if (!esCliente) vista = 'sin-permiso';
  else if (state.status === 'error') vista = state.errorStatus === 401 ? 'sesion-vencida' : 'error';
  else if (state.status === 'vacio') vista = 'no-encontrado';

  return {
    vista,
    pedido: state.pedido,
    error: state.error,
    isLoading: esCliente && state.status === 'loading',
    reload,
  };
}

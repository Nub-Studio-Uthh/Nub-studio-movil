import { useCallback, useEffect, useRef, useState } from 'react';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { getColeccionesPublicas } from '../models/coleccionService';
import { isAbortError } from '../models/api';

const INICIAL = { colecciones: [], status: 'loading', error: null, refreshing: false };

/**
 * Colecciones (HU-04): lista de colecciones publicadas. Al refrescar se conserva la lista
 * que ya se ve; si el refresco falla, se queda la lista anterior.
 */
export function useColeccionesViewModel() {
  const [state, setState] = useState(INICIAL);
  const controller = useRef(null);

  const cargar = useCallback(async (modo) => {
    controller.current?.abort();
    const c = new AbortController();
    controller.current = c;
    setState((s) => (modo === 'refrescar' ? { ...s, refreshing: true } : INICIAL));
    try {
      const colecciones = await getColeccionesPublicas({ signal: c.signal });
      setState({ colecciones, status: 'success', error: null, refreshing: false });
    } catch (error) {
      if (isAbortError(error)) return;
      setState((s) =>
        modo === 'refrescar'
          ? { ...s, refreshing: false }
          : { ...INICIAL, status: 'error', error: error.message }
      );
    }
  }, []);

  useEffect(() => {
    cargar('inicial');
    return () => controller.current?.abort();
  }, [cargar]);

  const isLoading = state.status === 'loading';
  const showSkeleton = useDelayedLoading(isLoading);

  return {
    colecciones: state.colecciones,
    status: state.status,
    error: state.error,
    isLoading,
    // Menos de 150 ms cargando: no se muestra nada para no parpadear.
    esperando: isLoading && !showSkeleton,
    showSkeleton,
    refreshing: state.refreshing,
    reload: useCallback(() => cargar('inicial'), [cargar]),
    refresh: useCallback(() => cargar('refrescar'), [cargar]),
  };
}

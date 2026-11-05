import { useCallback, useEffect, useRef, useState } from 'react';
import { isAbortError } from '../models/api';

/**
 * Carga datos simples de la API (categorías, destacadas, colecciones).
 * @template T
 * @param {(signal: AbortSignal) => Promise<T>} fetcher función del servicio
 * @param {T} vacio valor inicial
 */
export function useRemoteData(fetcher, vacio) {
  const [state, setState] = useState({ data: vacio, isLoading: true, error: null });
  const controller = useRef(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const cargar = useCallback(async () => {
    controller.current?.abort();
    const c = new AbortController();
    controller.current = c;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const data = await fetcherRef.current(c.signal);
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      if (isAbortError(error)) return;
      setState((s) => ({ ...s, isLoading: false, error: error.message }));
    }
  }, []);

  useEffect(() => {
    cargar();
    return () => controller.current?.abort();
  }, [cargar]);

  return { ...state, reload: cargar };
}

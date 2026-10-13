import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getObras } from '../services/obraService';
import { isAbortError } from '../services/api';
import { parametrosObras } from '../utils/obras';

const INICIAL = {
  items: [],
  total: 0,
  page: 0,
  totalPages: 0,
  status: 'loading', // 'loading' | 'success' | 'error'
  error: null,
  loadingMore: false,
  loadMoreError: null,
  refreshing: false,
};

const sinRepetidos = (actuales, nuevas) => {
  const ids = new Set(actuales.map((o) => o.id));
  return [...actuales, ...nuevas.filter((o) => !ids.has(o.id))];
};

/**
 * Catálogo paginado (HU-01). Vuelve a pedir la primera página cuando cambian los filtros
 * y cancela la petición anterior para que una respuesta vieja no pise a la nueva.
 * @param {object} filtros
 * @param {{ limit?: number }} [options]
 */
export function useObras(filtros, { limit = 12 } = {}) {
  const [state, setState] = useState(INICIAL);
  const controller = useRef(null);
  const filtrosRef = useRef(filtros);
  filtrosRef.current = filtros;

  // Solo cambia si cambia lo que realmente se envía a la API.
  const clave = useMemo(() => JSON.stringify(parametrosObras(filtros)), [filtros]);

  const cargar = useCallback(
    async (page, modo) => {
      controller.current?.abort();
      const c = new AbortController();
      controller.current = c;

      setState((s) => {
        if (modo === 'mas') return { ...s, loadingMore: true, loadMoreError: null };
        if (modo === 'refrescar') return { ...s, refreshing: true };
        return INICIAL;
      });

      try {
        const r = await getObras(filtrosRef.current, { page, limit, signal: c.signal });
        setState((s) => ({
          ...INICIAL,
          items: modo === 'mas' ? sinRepetidos(s.items, r.items) : r.items,
          total: r.total,
          page,
          totalPages: r.totalPages,
          status: 'success',
        }));
      } catch (error) {
        if (isAbortError(error)) return;
        setState((s) => {
          if (modo === 'mas') return { ...s, loadingMore: false, loadMoreError: error.message };
          if (modo === 'refrescar') return { ...s, refreshing: false };
          return { ...INICIAL, status: 'error', error: error.message };
        });
      }
    },
    [limit]
  );

  useEffect(() => {
    cargar(1, 'inicial');
  }, [clave, cargar]);

  useEffect(() => () => controller.current?.abort(), []);

  // Estado actual para los callbacks, sin volver a crearlos en cada render.
  const stateRef = useRef(state);
  stateRef.current = state;

  const loadMore = useCallback(() => {
    const s = stateRef.current;
    if (s.status === 'success' && !s.loadingMore && !s.loadMoreError && s.page < s.totalPages) {
      cargar(s.page + 1, 'mas');
    }
  }, [cargar]);

  const retryMore = useCallback(() => {
    const s = stateRef.current;
    if (s.status === 'success' && !s.loadingMore) cargar(s.page + 1, 'mas');
  }, [cargar]);

  return {
    ...state,
    isLoading: state.status === 'loading',
    hasMore: state.page < state.totalPages,
    reload: useCallback(() => cargar(1, 'inicial'), [cargar]),
    refresh: useCallback(() => cargar(1, 'refrescar'), [cargar]),
    loadMore,
    retryMore,
  };
}

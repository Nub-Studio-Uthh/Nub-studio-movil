import { useCallback, useEffect, useRef, useState } from 'react';
import { getPosts } from '../models/blogService';
import { isAbortError } from '../models/api';

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

const sinRepetidos = (actuales, nuevos) => {
  const ids = new Set(actuales.map((p) => p.id));
  return [...actuales, ...nuevos.filter((p) => !ids.has(p.id))];
};

/**
 * Lista paginada del blog (HU-05), con el mismo manejo que useObras: cancela la petición
 * anterior, conserva la lista al refrescar y permite reintentar la siguiente página.
 * @param {{ limit?: number }} [options]
 */
export function usePosts({ limit = 10 } = {}) {
  const [state, setState] = useState(INICIAL);
  const controller = useRef(null);

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
        const r = await getPosts({ page, limit, signal: c.signal });
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
    return () => controller.current?.abort();
  }, [cargar]);

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

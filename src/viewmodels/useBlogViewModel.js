import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { usePosts } from './usePosts';

/**
 * Blog (HU-05): publicaciones de la más reciente a la más antigua, paginadas de 10 en 10.
 * La primera se muestra como destacada; la vista decide cómo dibujar cada una.
 */
export function useBlogViewModel() {
  const posts = usePosts({ limit: 10 });
  const showSkeleton = useDelayedLoading(posts.isLoading);

  return {
    posts: posts.items,
    status: posts.status,
    error: posts.error,
    // Menos de 150 ms cargando: no se muestra nada para no parpadear.
    esperando: posts.isLoading && !showSkeleton,
    showSkeleton,
    refreshing: posts.refreshing,
    loadingMore: posts.loadingMore,
    loadMoreError: posts.loadMoreError,
    reload: posts.reload,
    refresh: posts.refresh,
    loadMore: posts.loadMore,
    retryMore: posts.retryMore,
  };
}

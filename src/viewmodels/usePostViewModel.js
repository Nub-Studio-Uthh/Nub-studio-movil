import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { getPost } from '../models/blogService';
import { isAbortError } from '../models/api';
import { formatearFecha, iniciales, minutosLectura } from '../utils/blog';

/**
 * Publicación (HU-05): pide el post completo por su slug. Mientras llega, usa los datos
 * que ya venían de la lista (previa) para mostrar título, imagen y autor de inmediato.
 * @param {string} slug
 * @param {object|null} [previa] post normalizado que se tocó en la lista
 */
export function usePostViewModel(slug, previa = null) {
  const [state, setState] = useState({
    post: null,
    isLoading: true,
    error: null,
    noEncontrado: false,
  });
  const controller = useRef(null);

  const reload = useCallback(async () => {
    controller.current?.abort();
    const c = new AbortController();
    controller.current = c;
    setState((s) => ({ ...s, isLoading: true, error: null, noEncontrado: false }));
    try {
      const post = await getPost(slug, { signal: c.signal });
      setState({ post, isLoading: false, error: null, noEncontrado: false });
    } catch (error) {
      if (isAbortError(error)) return;
      // 404: la publicación se retiró o ya no está publicada.
      setState((s) => ({
        ...s,
        isLoading: false,
        error: error.message,
        noEncontrado: error.status === 404,
      }));
    }
  }, [slug]);

  useEffect(() => {
    reload();
    return () => controller.current?.abort();
  }, [reload]);

  const showSkeleton = useDelayedLoading(state.isLoading);
  const datos = state.post ?? previa;
  const minutos = useMemo(
    () => (state.post?.contenido ? minutosLectura(state.post.contenido) : null),
    [state.post]
  );

  return {
    post: datos,
    contenido: state.post?.contenido ?? null,
    isLoading: state.isLoading,
    error: state.error,
    noEncontrado: state.noEncontrado,
    showSkeleton,
    // Sin nada que mostrar: ni el post completo ni el de la lista.
    sinDatos: !datos && !state.isLoading,
    iniciales: iniciales(datos?.autor),
    meta: [formatearFecha(datos?.fecha), minutos ? `${minutos} min` : null]
      .filter(Boolean)
      .join(' · '),
    reload,
  };
}

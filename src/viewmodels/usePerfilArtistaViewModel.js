import { useCallback, useEffect, useRef, useState } from 'react';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { getArtista } from '../models/artistaService';
import { isAbortError } from '../models/api';
import { obtenerIniciales } from '../utils/usuario';

/**
 * Perfil de artista (HU-03): datos públicos del artista y sus obras publicadas.
 * @param {number|string} id id del artista (parámetro de ruta)
 */
export function usePerfilArtistaViewModel(id) {
  const [state, setState] = useState({
    artista: null,
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
      const artista = await getArtista(id, { signal: c.signal });
      setState({ artista, isLoading: false, error: null, noEncontrado: false });
    } catch (error) {
      if (isAbortError(error)) return;
      // 404: el artista no existe, está inactivo o fue dado de baja.
      setState((s) => ({
        ...s,
        artista: null,
        isLoading: false,
        error: error.message,
        noEncontrado: error.status === 404,
      }));
    }
  }, [id]);

  useEffect(() => {
    reload();
    return () => controller.current?.abort();
  }, [reload]);

  const showSkeleton = useDelayedLoading(state.isLoading);
  const { artista } = state;

  return {
    artista,
    obras: artista?.obras ?? [],
    iniciales: obtenerIniciales(artista?.nombre),
    totalObras: artista?.obras.length ?? 0,
    isLoading: state.isLoading,
    // Menos de 150 ms cargando: no se muestra nada para no parpadear.
    esperando: state.isLoading && !showSkeleton,
    showSkeleton,
    error: state.error,
    noEncontrado: state.noEncontrado,
    reload,
  };
}

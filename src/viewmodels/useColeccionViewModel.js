import { useCallback, useEffect, useRef, useState } from 'react';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { getColeccion } from '../models/coleccionService';
import { isAbortError } from '../models/api';
import { obtenerIniciales } from '../utils/usuario';
import { textoObras } from '../utils/colecciones';

/**
 * Detalle de colección (HU-04): su historia y sus obras publicadas, pedidas por slug.
 * Mientras llega, usa los datos que ya venían de la lista (previa) para mostrar
 * portada, nombre e historia de inmediato.
 * @param {string} slug
 * @param {object|null} [previa] colección normalizada que se tocó en la lista
 */
export function useColeccionViewModel(slug, previa = null) {
  const [state, setState] = useState({
    coleccion: null,
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
      const coleccion = await getColeccion(slug, { signal: c.signal });
      setState({ coleccion, isLoading: false, error: null, noEncontrado: false });
    } catch (error) {
      if (isAbortError(error)) return;
      // 404: la colección no existe, se despublicó o se eliminó.
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
  const datos = state.coleccion ?? previa;
  const obras = state.coleccion?.obras ?? [];

  return {
    coleccion: datos,
    // Las obras solo llegan con el detalle; la lista no las trae.
    obras,
    obrasCargadas: state.coleccion !== null,
    totalTexto: textoObras(state.coleccion ? obras.length : datos?.totalObras),
    iniciales: obtenerIniciales(datos?.artista),
    isLoading: state.isLoading,
    error: state.error,
    noEncontrado: state.noEncontrado,
    showSkeleton,
    // Sin nada que mostrar: ni el detalle ni la colección de la lista.
    sinDatos: !datos && !state.isLoading,
    reload,
  };
}

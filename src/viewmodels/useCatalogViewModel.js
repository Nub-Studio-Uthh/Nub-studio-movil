import { useCallback, useEffect, useState } from 'react';
import { SEARCH_DEBOUNCE_MS } from '../constants/animations';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { useRemoteData } from '../hooks/useRemoteData';
import { useCatalogFilters } from '../models/CatalogFiltersContext';
import { getCategorias } from '../models/categoriaService';
import { contarFiltros, hayFiltrosActivos } from '../utils/obras';
import { useObras } from './useObras';

/**
 * Catálogo (HU-01): obras paginadas según los filtros compartidos, categorías y búsqueda.
 */
export function useCatalogViewModel() {
  const { filtros, actualizar, limpiarTodo } = useCatalogFilters();
  const obras = useObras(filtros);
  const categorias = useRemoteData((signal) => getCategorias({ signal }), []);
  const showSkeleton = useDelayedLoading(obras.isLoading);

  // Búsqueda: se escribe en local y se aplica 300 ms después de dejar de escribir.
  // Si la búsqueda no cambia lo que se envía a la API, useObras no vuelve a pedir datos.
  const [texto, setTexto] = useState(filtros.buscar);
  const debounced = useDebouncedValue(texto, SEARCH_DEBOUNCE_MS);
  useEffect(() => {
    actualizar({ buscar: debounced });
  }, [debounced, actualizar]);

  // "Limpiar filtros" también borra lo escrito en el buscador.
  const limpiar = useCallback(() => {
    setTexto('');
    limpiarTodo();
  }, [limpiarTodo]);

  const cambiarOrden = useCallback((ordenar) => actualizar({ ordenar }), [actualizar]);
  const elegirCategoria = useCallback((categoria) => actualizar({ categoria }), [actualizar]);

  return {
    filtros,
    obras,
    categorias,
    showSkeleton,
    texto,
    setTexto,
    limpiar,
    cambiarOrden,
    elegirCategoria,
    nFiltros: contarFiltros(filtros),
    hayFiltros: hayFiltrosActivos(filtros),
  };
}

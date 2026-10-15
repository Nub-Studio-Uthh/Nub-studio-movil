import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { FILTROS_INICIALES } from '../utils/obras';

const CatalogFiltersContext = createContext(null);

/**
 * Filtros del catálogo compartidos entre Inicio, Catálogo y Filtros
 * (p. ej., Inicio puede abrir el catálogo con una categoría ya elegida).
 */
export function CatalogFiltersProvider({ children }) {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  // Si nada cambia, se conserva el mismo objeto para no volver a renderizar.
  const actualizar = useCallback(
    (cambios) =>
      setFiltros((f) =>
        Object.keys(cambios).every((k) => f[k] === cambios[k]) ? f : { ...f, ...cambios }
      ),
    []
  );
  const limpiarTodo = useCallback(
    () => setFiltros((f) => ({ ...FILTROS_INICIALES, ordenar: f.ordenar })),
    []
  );

  const value = useMemo(
    () => ({ filtros, actualizar, limpiarTodo }),
    [filtros, actualizar, limpiarTodo]
  );
  return <CatalogFiltersContext.Provider value={value}>{children}</CatalogFiltersContext.Provider>;
}

export function useCatalogFilters() {
  const ctx = useContext(CatalogFiltersContext);
  if (!ctx) throw new Error('useCatalogFilters debe usarse dentro de <CatalogFiltersProvider>.');
  return ctx;
}

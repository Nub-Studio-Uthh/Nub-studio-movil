import { useCallback, useState } from 'react';
import { useRemoteData } from '../hooks/useRemoteData';
import { useCatalogFilters } from '../models/CatalogFiltersContext';
import { getCategorias } from '../models/categoriaService';
import { getObras } from '../models/obraService';
import { contarFiltros, validarRangoPrecio } from '../utils/obras';

const TOPE_POR_DEFECTO = 10000;

// Precio más alto del catálogo, redondeado hacia arriba a miles, como tope del deslizador.
async function getTopePrecio(signal) {
  const { items } = await getObras({ ordenar: 'precio_desc' }, { limit: 1, signal });
  const mayor = items[0]?.precio ?? 0;
  return mayor > 0 ? Math.ceil(mayor / 1000) * 1000 : TOPE_POR_DEFECTO;
}

/**
 * Hoja de filtros (HU-01): una categoría y un rango de precio que se combinan.
 * Los cambios se guardan en un borrador y solo se aplican al catálogo con `aplicar`.
 */
export function useFiltersViewModel() {
  const { filtros, actualizar } = useCatalogFilters();
  const categorias = useRemoteData((signal) => getCategorias({ signal }), []);
  const tope = useRemoteData(getTopePrecio, TOPE_POR_DEFECTO);

  const [borrador, setBorrador] = useState({
    categoria: filtros.categoria,
    precioMin: filtros.precioMin,
    precioMax: filtros.precioMax,
  });
  const cambiar = useCallback((cambios) => setBorrador((b) => ({ ...b, ...cambios })), []);

  const error = validarRangoPrecio(borrador.precioMin, borrador.precioMax);

  // Tocar la categoría elegida la quita.
  const elegirCategoria = (c) =>
    cambiar({
      categoria: borrador.categoria?.id === c.id ? null : { id: c.id, nombre: c.nombre },
    });
  const limpiar = () => cambiar({ categoria: null, precioMin: null, precioMax: null });

  /** Aplica el borrador al catálogo. Devuelve false si el rango de precio no es válido. */
  const aplicar = () => {
    if (error) return false;
    actualizar(borrador);
    return true;
  };

  return {
    categorias,
    topePrecio: tope.data,
    borrador,
    error,
    nActivos: contarFiltros(borrador),
    cambiar,
    elegirCategoria,
    limpiar,
    aplicar,
  };
}

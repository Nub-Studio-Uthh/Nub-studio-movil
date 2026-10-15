import { useCallback, useState } from 'react';
import { useRemoteData } from '../hooks/useRemoteData';
import { getObra } from '../models/obraService';

/**
 * Detalle de obra (HU-02): pide la obra a la API y lleva el estado del favorito.
 * @param {number|string} id id de la obra (parámetro de ruta)
 */
export function useDetalleObraViewModel(id) {
  const { data: obra, error, reload } = useRemoteData((signal) => getObra(id, { signal }), null);

  // TODO HU-07: el favorito debe guardarse en el backend (requiere sesión). Por ahora solo cambia en pantalla.
  const [favorito, setFavorito] = useState(false);
  const toggleFavorito = useCallback(() => setFavorito((v) => !v), []);

  return { obra, error, reload, favorito, toggleFavorito };
}

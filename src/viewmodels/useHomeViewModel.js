import { useCallback, useState } from 'react';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { useRemoteData } from '../hooks/useRemoteData';
import { getColecciones } from '../models/coleccionService';
import { getDestacadas, getObras } from '../models/obraService';

const getRecientes = (signal) =>
  getObras({ ordenar: 'recientes' }, { limit: 2, signal }).then((r) => r.items);

/**
 * Inicio (HU-01): obras destacadas, colecciones y obras recientes.
 * Las tres cargas son independientes; la pantalla decide qué mostrar con los valores derivados.
 */
export function useHomeViewModel() {
  const destacadas = useRemoteData((signal) => getDestacadas({ limit: 6, signal }), []);
  const recientes = useRemoteData(getRecientes, []);
  const colecciones = useRemoteData((signal) => getColecciones({ limit: 6, signal }), []);
  const [refrescando, setRefrescando] = useState(false);

  const cargando = destacadas.isLoading || recientes.isLoading || colecciones.isLoading;
  // Al deslizar para recargar se conserva el contenido: el skeleton es solo para la primera carga.
  const showSkeleton = useDelayedLoading(cargando && !refrescando);

  const { reload: recargarDestacadas } = destacadas;
  const { reload: recargarRecientes } = recientes;
  const { reload: recargarColecciones } = colecciones;
  const recargarTodo = useCallback(
    () => Promise.all([recargarDestacadas(), recargarRecientes(), recargarColecciones()]),
    [recargarDestacadas, recargarRecientes, recargarColecciones]
  );

  const refrescar = useCallback(async () => {
    setRefrescando(true);
    await recargarTodo();
    setRefrescando(false);
  }, [recargarTodo]);

  return {
    destacadas,
    recientes,
    colecciones,
    showSkeleton,
    // Menos de 150 ms cargando: no se muestra nada para no parpadear.
    esperando: cargando && !refrescando,
    refrescando,
    fallaronTodas: !!destacadas.error && !!recientes.error,
    sinObras: !destacadas.data.length && !recientes.data.length,
    recargarTodo,
    refrescar,
  };
}

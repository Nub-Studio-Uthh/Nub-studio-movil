import { useCallback, useEffect, useRef, useState } from 'react';
import { useCarritoViewModel } from './useCarritoViewModel';
import { useRemoteData } from '../hooks/useRemoteData';
import { useAuth } from '../models/AuthContext';
import { isAbortError } from '../models/api';
import { crearDireccion, getEstados, getMunicipios } from '../models/direccionService';
import { crearPago } from '../models/pagoService';
import { resumenObras } from '../utils/checkout';
import { contarPiezas } from '../utils/carrito';
import { calcularTotalCarrito } from '../utils/formatters';
import { DIRECCION_VACIA, firmaDireccion, validarDireccion } from '../utils/direccion';

/**
 * Finalizar compra (HU-09): resumen del carrito, dirección de envío y pago directo en
 * Mercado Pago, sin pasar por la web ni volver a iniciar sesión.
 * @param {number|null} [soloObra] id de obra de "Comprar ahora": se paga solo esa, aunque el
 *   carrito tenga otras
 */
export function useFinalizarCompraViewModel(soloObra = null) {
  const todo = useCarritoViewModel();
  const items = soloObra ? todo.items.filter((i) => i.id === soloObra) : todo.items;
  const carrito = soloObra
    ? { ...todo, items, total: calcularTotalCarrito(items), piezas: contarPiezas(items) }
    : todo;
  // Líneas del carrito a pagar, como texto para que pagar() no cambie en cada render.
  const lineas = soloObra
    ? items
        .map((i) => i.idCarrito)
        .filter(Boolean)
        .join(',')
    : '';
  const { token } = useAuth();
  const estados = useRemoteData((signal) => getEstados({ signal }), []);

  const [direccion, setDireccion] = useState(DIRECCION_VACIA);
  const [errores, setErrores] = useState({});
  // Municipios del último estado consultado; mientras no coincide con el elegido, está cargando.
  const [lugares, setLugares] = useState({ idEstado: null, data: [], error: null });
  const [pagando, setPagando] = useState(false);
  const pagandoRef = useRef(false);
  // Si el pago falla después de guardar la dirección, no se vuelve a guardar igual.
  const guardada = useRef({ firma: null, id: null });

  const idEstado = direccion.estado?.id ?? null;
  useEffect(() => {
    if (!idEstado) return undefined;
    const c = new AbortController();
    getMunicipios(idEstado, { signal: c.signal })
      .then((data) => setLugares({ idEstado, data, error: null }))
      .catch((error) => {
        if (!isAbortError(error)) setLugares({ idEstado, data: [], error: error.message });
      });
    return () => c.abort();
  }, [idEstado]);
  const listos = !!idEstado && lugares.idEstado === idEstado;
  const municipios = {
    data: listos ? lugares.data : [],
    isLoading: !!idEstado && !listos,
    error: listos ? lugares.error : null,
  };

  /** Cambia un campo; si cambia el estado, se borra el municipio elegido. */
  const cambiar = useCallback((campo, valor) => {
    setDireccion((d) => ({
      ...d,
      [campo]: valor,
      ...(campo === 'estado' && valor?.id !== d.estado?.id ? { municipio: null } : null),
    }));
    setErrores((e) => (e[campo] ? { ...e, [campo]: undefined } : e));
  }, []);

  /**
   * Guarda la dirección y crea el pago.
   * @returns {Promise<{ ok: true, url: string, idPedido: number|null } | { ok: false, error: string|null }>}
   */
  const pagar = useCallback(async () => {
    const faltan = validarDireccion(direccion);
    if (Object.keys(faltan).length) {
      setErrores(faltan);
      return { ok: false, error: null };
    }
    if (!token || pagandoRef.current) return { ok: false, error: null };
    pagandoRef.current = true;
    setPagando(true);
    try {
      const firma = firmaDireccion(direccion);
      let idDireccion = guardada.current.firma === firma ? guardada.current.id : null;
      if (!idDireccion) {
        idDireccion = await crearDireccion(token, direccion);
        guardada.current = { firma, id: idDireccion };
      }
      const ids = lineas ? lineas.split(',').map(Number) : null;
      const pago = await crearPago(token, idDireccion, ids);
      return { ok: true, ...pago };
    } catch (error) {
      return { ok: false, error: error.message };
    } finally {
      pagandoRef.current = false;
      setPagando(false);
    }
  }, [direccion, token, lineas]);

  return {
    ...carrito,
    resumen: resumenObras(carrito.items),
    direccion,
    errores,
    cambiar,
    estados,
    municipios,
    pagando,
    pagar,
  };
}

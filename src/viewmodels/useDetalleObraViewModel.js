import { useCallback, useEffect, useRef, useState } from 'react';
import { useRemoteData } from '../hooks/useRemoteData';
import { getObra } from '../models/obraService';
import { useAuth } from '../models/AuthContext';
import { agregarFavorito, esFavorito, quitarFavorito } from '../models/favoritoService';
import { agregarAlCarrito } from '../models/carritoService';
import { isAbortError } from '../models/api';
import { puedeTenerFavoritos } from '../utils/favoritos';
import { limitarCantidad, maximoCompra, textoExistencias } from '../utils/existencias';

/**
 * Detalle de obra (HU-02): pide la obra a la API, muestra sus existencias, lleva el estado
 * del favorito (HU-07), la cantidad elegida, y agrega al carrito o compra de inmediato (HU-08). Ambos se guardan en el backend, así que requieren
 * sesión de cliente.
 * @param {number|string} id id de la obra (parámetro de ruta)
 */
export function useDetalleObraViewModel(id) {
  const { data: obra, error, reload } = useRemoteData((signal) => getObra(id, { signal }), null);
  const { status, token, usuario } = useAuth();
  const autenticado = status === 'authenticated';
  const esCliente = autenticado && puedeTenerFavoritos(usuario);

  const [favorito, setFavorito] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const guardandoRef = useRef(false);

  const [agregando, setAgregando] = useState(false);
  const agregandoRef = useRef(false);
  const [comprando, setComprando] = useState(false);
  const [cantidadElegida, setCantidad] = useState(1);

  const existencias = obra?.existencias ?? null;
  const agotada = existencias === 0;
  const maximo = maximoCompra(existencias);
  // Si las existencias bajan (por ejemplo al recargar), la cantidad se ajusta sola.
  const cantidad = limitarCantidad(cantidadElegida, maximo);
  const aumentar = useCallback(() => setCantidad((c) => limitarCantidad(c + 1, maximo)), [maximo]);
  const disminuir = useCallback(() => setCantidad((c) => limitarCantidad(c - 1, maximo)), [maximo]);

  // Al abrir la obra con sesión de cliente se pregunta si ya está en favoritos.
  useEffect(() => {
    if (!esCliente || !token || !id) return undefined;
    const c = new AbortController();
    esFavorito(token, id, { signal: c.signal })
      .then((valor) => setFavorito(valor))
      .catch((e) => {
        if (!isAbortError(e)) setFavorito(false); // si falla, se muestra sin marcar
      });
    return () => c.abort();
  }, [esCliente, token, id]);

  /**
   * Agrega o quita la obra. Cambia el corazón de inmediato y lo regresa si el backend falla.
   * @returns {Promise<string|null>} mensaje de error para mostrar, o null si salió bien
   */
  const toggleFavorito = useCallback(async () => {
    if (!esCliente || guardandoRef.current) return null;
    guardandoRef.current = true;
    setGuardando(true);
    const antes = favorito;
    setFavorito(!antes);
    try {
      if (antes) {
        await quitarFavorito(token, id);
      } else {
        setFavorito(await agregarFavorito(token, id));
      }
      return null;
    } catch (e) {
      setFavorito(antes);
      return e.message;
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  }, [esCliente, favorito, token, id]);

  /**
   * Agrega la cantidad elegida al carrito (HU-08). Con `compra` marca "Comprar ahora".
   * @returns {Promise<string|null>} mensaje de error para mostrar, o null si salió bien
   */
  const agregar = useCallback(
    async (compra) => {
      if (!esCliente || agotada || agregandoRef.current) return null;
      agregandoRef.current = true;
      (compra ? setComprando : setAgregando)(true);
      try {
        await agregarAlCarrito(token, id, cantidad);
        return null;
      } catch (e) {
        return e.message;
      } finally {
        agregandoRef.current = false;
        (compra ? setComprando : setAgregando)(false);
      }
    },
    [esCliente, agotada, token, id, cantidad]
  );
  const agregarCarrito = useCallback(() => agregar(false), [agregar]);
  /** "Comprar ahora": deja la obra en el carrito con la cantidad elegida para pagarla sola. */
  const comprarAhora = useCallback(() => agregar(true), [agregar]);

  return {
    obra,
    error,
    reload,
    favorito,
    guardandoFavorito: guardando,
    // Sin sesión la pantalla pide iniciar sesión; con otra cuenta (artista) avisa.
    requiereSesion: !autenticado,
    puedeGuardarFavoritos: esCliente,
    toggleFavorito,
    agregandoCarrito: agregando,
    puedeComprar: esCliente,
    agregarCarrito,
    comprando,
    comprarAhora,
    existencias,
    textoExistencias: textoExistencias(existencias),
    agotada,
    cantidad,
    maximo,
    aumentar,
    disminuir,
  };
}

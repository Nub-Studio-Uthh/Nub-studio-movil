import { useCallback, useEffect, useRef, useState } from 'react';
import { useRemoteData } from '../hooks/useRemoteData';
import { getObra } from '../models/obraService';
import { useAuth } from '../models/AuthContext';
import { agregarFavorito, esFavorito, quitarFavorito } from '../models/favoritoService';
import { agregarAlCarrito } from '../models/carritoService';
import { isAbortError } from '../models/api';
import { puedeTenerFavoritos } from '../utils/favoritos';

/**
 * Detalle de obra (HU-02): pide la obra a la API, lleva el estado del favorito (HU-07)
 * y agrega la obra al carrito (HU-08). Ambos se guardan en el backend, así que requieren
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
   * Agrega la obra al carrito (HU-08).
   * @returns {Promise<string|null>} mensaje de error para mostrar, o null si salió bien
   */
  const agregarCarrito = useCallback(async () => {
    if (!esCliente || agregandoRef.current) return null;
    agregandoRef.current = true;
    setAgregando(true);
    try {
      await agregarAlCarrito(token, id);
      return null;
    } catch (e) {
      return e.message;
    } finally {
      agregandoRef.current = false;
      setAgregando(false);
    }
  }, [esCliente, token, id]);

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
  };
}

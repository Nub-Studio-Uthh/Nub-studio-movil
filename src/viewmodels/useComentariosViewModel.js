import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../models/AuthContext';
import { isAbortError } from '../models/api';
import { crearComentario, eliminarComentario, getComentarios } from '../models/comentarioService';
import {
  aceptaRespuestas,
  contarComentarios,
  idUsuarioDeToken,
  puedeComentar,
  textoComentarios,
  validarComentario,
} from '../utils/comentarios';

/**
 * Comentarios de una publicación (HU-05): los lista para cualquiera y, con sesión de
 * cliente o artista, permite comentar, responder y borrar los propios.
 * @param {number|null|undefined} idPost id_post (puede llegar después que la pantalla)
 */
export function useComentariosViewModel(idPost) {
  const { status, token, usuario } = useAuth();
  const autenticado = status === 'authenticated';
  const miId = usuario?.id_usuario ?? usuario?.id ?? idUsuarioDeToken(token);

  const [state, setState] = useState({ lista: [], isLoading: true, error: null });
  const [texto, setTexto] = useState('');
  const [respondiendoA, setRespondiendoA] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const enviandoRef = useRef(false);
  const controller = useRef(null);

  const cargar = useCallback(
    async ({ silencio = false } = {}) => {
      if (!idPost) return;
      controller.current?.abort();
      const c = new AbortController();
      controller.current = c;
      if (!silencio) setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const lista = await getComentarios(idPost, { signal: c.signal });
        setState({ lista, isLoading: false, error: null });
      } catch (error) {
        if (isAbortError(error)) return;
        setState((s) => ({ ...s, isLoading: false, error: error.message }));
      }
    },
    [idPost]
  );

  useEffect(() => {
    cargar();
    return () => controller.current?.abort();
  }, [cargar]);

  /**
   * Envía el comentario o la respuesta.
   * @returns {Promise<{ ok: true, pendiente: boolean } | { ok: false, error: string }>}
   */
  const enviar = useCallback(async () => {
    const invalido = validarComentario(texto);
    if (invalido) return { ok: false, error: invalido };
    if (!autenticado || !token || enviandoRef.current) return { ok: false, error: null };
    enviandoRef.current = true;
    setEnviando(true);
    try {
      const r = await crearComentario(token, idPost, texto.trim(), respondiendoA?.id ?? null);
      setTexto('');
      setRespondiendoA(null);
      if (!r.pendiente) await cargar({ silencio: true });
      return { ok: true, pendiente: r.pendiente };
    } catch (error) {
      return { ok: false, error: error.message };
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }, [texto, autenticado, token, idPost, respondiendoA, cargar]);

  /** @returns {Promise<string|null>} mensaje de error, o null si se borró */
  const eliminar = useCallback(
    async (comentario) => {
      if (!token) return null;
      try {
        await eliminarComentario(token, comentario.id);
        await cargar({ silencio: true });
        return null;
      } catch (error) {
        return error.message;
      }
    },
    [token, cargar]
  );

  const responder = useCallback((comentario) => {
    if (aceptaRespuestas(comentario)) setRespondiendoA(comentario);
  }, []);
  const cancelarRespuesta = useCallback(() => setRespondiendoA(null), []);
  const esMio = useCallback((c) => miId != null && c?.idUsuario === miId, [miId]);

  const total = contarComentarios(state.lista);

  return {
    comentarios: state.lista,
    isLoading: state.isLoading,
    error: state.error,
    recargar: cargar,
    total,
    titulo: textoComentarios(total),
    texto,
    setTexto,
    enviando,
    enviar,
    respondiendoA,
    responder,
    cancelarRespuesta,
    eliminar,
    esMio,
    // Sin sesión se invita a iniciar sesión; otras cuentas (admin) solo leen.
    requiereSesion: !autenticado,
    puedeEscribir: autenticado && puedeComentar(usuario),
  };
}

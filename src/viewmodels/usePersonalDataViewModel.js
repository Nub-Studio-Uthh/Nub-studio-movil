import { useCallback, useEffect, useRef, useState } from 'react';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { isAbortError } from '../models/api';
import { useAuth } from '../models/AuthContext';
import { actualizarPerfil, getPerfil } from '../models/perfilService';
import { puedeTenerPedidos } from '../utils/pedidos';
import { cambiosDePerfil, validarPerfil } from '../utils/perfil';

const SIN_DATOS = { nombre: '', correo: '', telefono: '', aceptaMarketing: false };
const CARGANDO = { perfil: SIN_DATOS, status: 'loading', error: null, errorStatus: null };

/**
 * Datos personales (derechos ARCO de Acceso, Rectificación y Oposición).
 * El cliente ve sus datos del backend, corrige nombre y teléfono, y decide si recibe marketing.
 * El switch se guarda al moverlo; si falla, regresa a como estaba.
 * Las cuentas de artista o administrador solo ven los datos de su sesión.
 */
export function usePersonalDataViewModel() {
  const { status: sesion, token, usuario, actualizarUsuario } = useAuth();
  const autenticado = sesion === 'authenticated';
  const esCliente = autenticado && puedeTenerPedidos(usuario);

  const [state, setState] = useState(CARGANDO);
  // Lo que la persona escribió y aún no se guarda; lo demás sale del perfil.
  const [edicion, setEdicion] = useState({});
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);
  const [cambiandoMarketing, setCambiandoMarketing] = useState(false);
  const [errorMarketing, setErrorMarketing] = useState(null);
  const controller = useRef(null);

  const { perfil } = state;
  const form = {
    nombre: edicion.nombre ?? perfil.nombre,
    telefono: edicion.telefono ?? perfil.telefono,
  };

  const cargar = useCallback(
    async ({ reiniciar = false } = {}) => {
      if (!esCliente || !token) return;
      controller.current?.abort();
      const c = new AbortController();
      controller.current = c;
      setState((s) => (reiniciar ? CARGANDO : s));
      try {
        const datos = await getPerfil(token, { signal: c.signal });
        setState({ perfil: datos, status: 'success', error: null, errorStatus: null });
      } catch (error) {
        if (isAbortError(error)) return;
        setState((s) => ({
          ...s,
          status: 'error',
          error: error.message,
          errorStatus: error.status,
        }));
      }
    },
    [esCliente, token]
  );

  useEffect(() => {
    cargar();
    return () => controller.current?.abort();
  }, [cargar]);

  const cambiar = useCallback(
    (campo) => (texto) => {
      setEdicion((e) => ({ ...e, [campo]: texto }));
      setErrores((e) => ({ ...e, [campo]: undefined }));
      setErrorGuardar(null);
      setGuardado(false);
    },
    []
  );

  const guardar = async () => {
    const nuevosErrores = validarPerfil(form);
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length) return;

    const cambios = cambiosDePerfil(form, perfil);
    if (!Object.keys(cambios).length) return;

    setGuardando(true);
    setErrorGuardar(null);
    setGuardado(false);
    try {
      const { nombre, telefono } = await actualizarPerfil(token, cambios);
      setState((s) => ({ ...s, perfil: { ...s.perfil, nombre, telefono } }));
      setEdicion({});
      if (cambios.nombre !== undefined) await actualizarUsuario({ nombre });
      setGuardado(true);
    } catch (error) {
      setErrorGuardar(error?.message || 'No pudimos guardar tus datos. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarMarketing = async (acepta) => {
    const aplicar = (aceptaMarketing) =>
      setState((s) => ({ ...s, perfil: { ...s.perfil, aceptaMarketing } }));

    setCambiandoMarketing(true);
    setErrorMarketing(null);
    aplicar(acepta);
    try {
      await actualizarPerfil(token, { aceptaMarketing: acepta });
    } catch (error) {
      aplicar(!acepta);
      setErrorMarketing(error?.message || 'No pudimos guardar tu preferencia.');
    } finally {
      setCambiandoMarketing(false);
    }
  };

  const isLoading = esCliente && state.status === 'loading';
  const showSkeleton = useDelayedLoading(isLoading);

  let vista = 'formulario';
  if (!autenticado) vista = 'sesion-vencida';
  else if (!esCliente) vista = 'solo-lectura';
  else if (state.status === 'error') {
    vista = state.errorStatus === 401 ? 'sesion-vencida' : 'error';
  }

  return {
    vista,
    showSkeleton,
    // Menos de 150 ms cargando: no se muestra nada para no parpadear.
    esperando: isLoading && !showSkeleton,
    error: state.error,
    // Reintentar regresa al skeleton.
    reload: useCallback(() => cargar({ reiniciar: true }), [cargar]),
    nombreSesion: usuario?.nombre,
    correoSesion: usuario?.correo,
    correo: perfil.correo,
    aceptaMarketing: perfil.aceptaMarketing,
    form,
    errores,
    cambiar,
    guardar,
    guardando,
    guardado,
    errorGuardar,
    hayCambios: Object.keys(cambiosDePerfil(form, perfil)).length > 0,
    cambiarMarketing,
    cambiandoMarketing,
    errorMarketing,
  };
}

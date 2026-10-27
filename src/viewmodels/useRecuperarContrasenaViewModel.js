import { useCallback, useState } from 'react';
import { useAuth } from '../models/AuthContext';
import {
  pedirCodigoRecuperacion,
  restablecerContrasena,
  validarCodigoRecuperacion,
} from '../models/authService';
import { esCorreoValido } from '../utils/validators';
import {
  esCodigoRecuperacion,
  normalizarCodigoRecuperacion,
  validarNuevaContrasena,
} from '../utils/recuperacion';

/**
 * "¿Olvidaste tu contraseña?" y "Cambiar contraseña" (HU-06), en tres pasos:
 * correo → código que llega por correo → contraseña nueva.
 * En modo 'cuenta' el correo es el de la sesión y no se puede cambiar.
 * @param {{ correo?: string, modo?: 'recuperar' | 'cuenta' }} [opciones]
 */
export function useRecuperarContrasenaViewModel({ correo: inicial = '', modo = 'recuperar' } = {}) {
  const { usuario } = useAuth();
  const desdeCuenta = modo === 'cuenta';
  const [paso, setPaso] = useState('correo'); // 'correo' | 'codigo' | 'nueva'
  const [correo, setCorreo] = useState(desdeCuenta ? (usuario?.correo ?? '') : inicial);
  const [correoOculto, setCorreoOculto] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const limpiarMensajes = useCallback(() => {
    setError(null);
    setInfo(null);
  }, []);

  /** Corre una llamada al backend mostrando "enviando" y el error, si lo hay. */
  const ejecutar = useCallback(
    async (accion) => {
      setEnviando(true);
      limpiarMensajes();
      try {
        return await accion();
      } catch (e) {
        setError(e.message);
        return false;
      } finally {
        setEnviando(false);
      }
    },
    [limpiarMensajes]
  );

  /** Paso 1: pide el código. */
  const enviarCodigo = useCallback(async () => {
    if (!esCorreoValido(correo)) {
      setErrores({ correo: 'Ingresa un correo válido.' });
      return false;
    }
    setErrores({});
    return ejecutar(async () => {
      const r = await pedirCodigoRecuperacion(correo);
      setCorreoOculto(r.correoOculto);
      setCodigo('');
      setPaso('codigo');
      return true;
    });
  }, [correo, ejecutar]);

  /** Paso 2: revisa el código. */
  const verificarCodigo = useCallback(async () => {
    if (!esCodigoRecuperacion(codigo)) {
      setErrores({ codigo: 'El código tiene 6 letras o números.' });
      return false;
    }
    setErrores({});
    return ejecutar(async () => {
      await validarCodigoRecuperacion({ correo, codigo });
      setPaso('nueva');
      return true;
    });
  }, [correo, codigo, ejecutar]);

  /** Vuelve a mandar el código al mismo correo. */
  const reenviar = useCallback(
    () =>
      ejecutar(async () => {
        await pedirCodigoRecuperacion(correo);
        setCodigo('');
        setInfo('Te enviamos un código nuevo.');
        return true;
      }),
    [correo, ejecutar]
  );

  /** Paso 3: guarda la contraseña nueva. */
  const guardar = useCallback(async () => {
    const faltan = validarNuevaContrasena({ nueva, confirmacion });
    setErrores(faltan);
    if (Object.keys(faltan).length) return false;
    return ejecutar(async () => {
      await restablecerContrasena({ correo, codigo, nueva });
      return true;
    });
  }, [correo, codigo, nueva, confirmacion, ejecutar]);

  /** Regresa al paso anterior (por ejemplo, para corregir el correo). */
  const atras = useCallback(() => {
    limpiarMensajes();
    setErrores({});
    setPaso((p) => (p === 'nueva' ? 'codigo' : 'correo'));
  }, [limpiarMensajes]);

  const cambiar = (setter, campo) => (valor) => {
    setter(valor);
    setErrores((e) => (e[campo] ? { ...e, [campo]: undefined } : e));
    setError(null);
  };

  return {
    paso,
    numeroPaso: { correo: 1, codigo: 2, nueva: 3 }[paso],
    desdeCuenta,
    correo,
    correoOculto,
    codigo,
    nueva,
    confirmacion,
    errores,
    error,
    info,
    enviando,
    cambiarCorreo: cambiar(setCorreo, 'correo'),
    cambiarCodigo: cambiar((v) => setCodigo(normalizarCodigoRecuperacion(v)), 'codigo'),
    cambiarNueva: cambiar(setNueva, 'nueva'),
    cambiarConfirmacion: cambiar(setConfirmacion, 'confirmacion'),
    enviarCodigo,
    verificarCodigo,
    reenviar,
    guardar,
    atras,
  };
}

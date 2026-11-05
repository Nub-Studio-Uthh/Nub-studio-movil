import { useState } from 'react';
import { useAuth } from '../models/AuthContext';
import { validarLogin } from '../utils/validators';

/**
 * Inicio de sesión (HU-06).
 * @param {string} [correoInicial] correo que llega por ruta (p. ej., después de verificar)
 */
export function useLoginViewModel(correoInicial = '') {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ correo: correoInicial, contrasena: '' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
    setErrorGeneral(null);
  };

  /**
   * Valida e inicia sesión. La pantalla navega según el resultado.
   * @returns {Promise<{ resultado: 'ok' } | { resultado: 'verificar', correo: string } | null>}
   */
  const ingresar = async () => {
    const nuevos = validarLogin(form);
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return null;

    setEnviando(true);
    try {
      await signIn(form);
      return { resultado: 'ok' };
    } catch (error) {
      setEnviando(false);
      // Cuenta creada pero sin verificar: se manda a poner el código del correo.
      if (error.data?.requiresVerification) {
        return { resultado: 'verificar', correo: form.correo.trim() };
      }
      setErrorGeneral(error.message);
      return null;
    }
  };

  return {
    form,
    errores,
    errorGeneral,
    enviando,
    puedeEnviar: !enviando && !!form.correo && !!form.contrasena,
    cambiar,
    ingresar,
  };
}

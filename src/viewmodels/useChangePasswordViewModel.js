import { useState } from 'react';
import { useAuth } from '../models/AuthContext';
import { validarCambioContrasena } from '../utils/validators';

const INICIAL = { actual: '', nueva: '', confirmacion: '' };

/** Cambiar contraseña (HU-06). */
export function useChangePasswordViewModel() {
  const { changePassword } = useAuth();
  const [form, setForm] = useState(INICIAL);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null); // { tipo: 'ok' | 'error', texto }
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
    setMensaje(null);
  };

  const guardar = async () => {
    const nuevos = validarCambioContrasena(form);
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    setEnviando(true);
    try {
      await changePassword({ actual: form.actual, nueva: form.nueva });
      setForm(INICIAL);
      setMensaje({ tipo: 'ok', texto: 'Tu contraseña se actualizó correctamente.' });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
      setEnviando(false);
    }
  };

  return { form, errores, mensaje, enviando, cambiar, guardar };
}

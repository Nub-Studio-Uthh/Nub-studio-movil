import { useState } from 'react';
import { useAuth } from '../models/AuthContext';
import { validarRegistro } from '../utils/validators';

const INICIAL = {
  nombre: '',
  correo: '',
  contrasena: '',
  confirmacion: '',
  aceptaTerminos: false,
};

/** Registro de cuenta (HU-06). */
export function useRegisterViewModel() {
  const { signUp } = useAuth();
  const [form, setForm] = useState(INICIAL);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
    setErrorGeneral(null);
  };

  const toggleTerminos = () => cambiar('aceptaTerminos')(!form.aceptaTerminos);

  /**
   * Valida y crea la cuenta.
   * @returns {Promise<string|null>} el correo registrado (para verificarlo) o null si falló
   */
  const registrar = async () => {
    const nuevos = validarRegistro(form);
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return null;

    setEnviando(true);
    try {
      const { correo } = await signUp(form);
      return correo;
    } catch (error) {
      if (error.status === 409) setErrores({ correo: error.message });
      else setErrorGeneral(error.message);
      return null;
    } finally {
      setEnviando(false);
    }
  };

  return { form, errores, errorGeneral, enviando, cambiar, toggleTerminos, registrar };
}

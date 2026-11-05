import { useState } from 'react';
import * as authService from '../models/authService';
import { esCodigoValido } from '../utils/validators';

/**
 * Verificación de correo con el código de 6 dígitos (HU-06).
 * @param {string} correo correo al que se mandó el código
 */
export function useVerifyEmailViewModel(correo) {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  // Solo se aceptan dígitos.
  const cambiarCodigo = (texto) => {
    setCodigo(texto.replace(/\D/g, ''));
    setError(null);
  };

  /** @returns {Promise<boolean>} true si el correo quedó verificado */
  const verificar = async () => {
    if (!esCodigoValido(codigo)) {
      setError('El código tiene 6 dígitos');
      return false;
    }
    setEnviando(true);
    setError(null);
    try {
      await authService.verificarCorreo({ correo, codigo });
      return true;
    } catch (e) {
      setError(e.message);
      setEnviando(false);
      return false;
    }
  };

  const reenviar = async () => {
    setReenviando(true);
    setError(null);
    setInfo(null);
    try {
      await authService.reenviarCodigo(correo);
      setInfo('Te enviamos un código nuevo.');
    } catch (e) {
      setError(e.message);
    } finally {
      setReenviando(false);
    }
  };

  return {
    codigo,
    error,
    info,
    enviando,
    reenviando,
    puedeVerificar: !enviando && codigo.length === 6,
    cambiarCodigo,
    verificar,
    reenviar,
  };
}

import { useCallback, useState } from 'react';
import { useAuth } from '../models/AuthContext';

/**
 * Eliminar mi cuenta (derecho ARCO de Cancelación, requisito de Google Play).
 * Pide la contraseña, llama al backend y, si sale bien, la sesión se cierra sola
 * (AuthContext la limpia). `eliminar` regresa true cuando la cuenta se eliminó.
 */
export function useEliminarCuentaViewModel() {
  const { eliminarCuenta } = useAuth();
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cambiarContrasena = useCallback((texto) => {
    setContrasena(texto);
    setError(null);
  }, []);

  const eliminar = useCallback(async () => {
    if (!contrasena) {
      setError('Escribe tu contraseña para confirmar.');
      return false;
    }
    setEliminando(true);
    setError(null);
    try {
      await eliminarCuenta(contrasena);
      return true;
    } catch (e) {
      setError(e?.message || 'No se pudo eliminar la cuenta. Intenta más tarde.');
      return false;
    } finally {
      setEliminando(false);
    }
  }, [contrasena, eliminarCuenta]);

  return { contrasena, cambiarContrasena, error, eliminando, eliminar };
}

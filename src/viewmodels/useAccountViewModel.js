import { useAuth } from '../models/AuthContext';
import { obtenerIniciales } from '../utils/usuario';

/** Mi cuenta (HU-06): datos de la sesión para el encabezado y cerrar sesión. */
export function useAccountViewModel() {
  const { status, usuario, signOut } = useAuth();
  const nombre = usuario?.nombre ?? '';

  return {
    autenticado: status === 'authenticated',
    nombre,
    correo: usuario?.correo ?? usuario?.email ?? '',
    iniciales: obtenerIniciales(nombre),
    cerrarSesion: signOut,
  };
}

import { useAuth } from '../models/AuthContext';

/** Datos personales (HU-06): solo lectura de la sesión actual. */
export function usePersonalDataViewModel() {
  const { usuario } = useAuth();
  return { nombre: usuario?.nombre, correo: usuario?.correo };
}

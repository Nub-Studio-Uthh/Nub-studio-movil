import { useEffect } from 'react';
import { useAuth } from '../models/AuthContext';

/** Si el backend rechaza el token en plena sesión, lleva a Iniciar sesión con un aviso. */
export function useSesionVencida(navigationRef) {
  const { sesionVencida } = useAuth();

  useEffect(() => {
    if (!sesionVencida || !navigationRef.isReady()) return;
    navigationRef.reset({
      index: 0,
      routes: [{ name: 'Login', params: { sesionVencida: true } }],
    });
  }, [navigationRef, sesionVencida]);
}

import { createContext, useContext, useEffect } from 'react';
import {
  Easing,
  cancelAnimation,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SHIMMER_MS } from '../../constants/animations';

const ShimmerContext = createContext(null);

/**
 * Un solo reloj de brillo por pantalla: todos los bloques comparten el mismo progreso,
 * así la banda recorre la pantalla completa en vez de parpadear bloque por bloque.
 */
export function ShimmerProvider({ children }) {
  const progress = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return undefined;
    progress.value = withRepeat(withTiming(1, { duration: SHIMMER_MS, easing: Easing.linear }), -1);
    return () => cancelAnimation(progress);
  }, [reduceMotion, progress]);

  return (
    <ShimmerContext.Provider value={{ progress, reduceMotion }}>{children}</ShimmerContext.Provider>
  );
}

export function useShimmer() {
  const ctx = useContext(ShimmerContext);
  if (!ctx) throw new Error('Los bloques de skeleton deben estar dentro de <ShimmerProvider>.');
  return ctx;
}

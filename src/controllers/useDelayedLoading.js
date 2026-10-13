import { useLayoutEffect, useRef, useState } from 'react';
import { SKELETON_DELAY_MS, SKELETON_MIN_MS } from '../constants/animations';

/**
 * Evita parpadeos: el skeleton aparece solo si la carga tarda más de `delay`
 * y, una vez visible, se queda al menos `minDuration`.
 * @param {boolean} isLoading
 * @returns {boolean} true mientras se debe mostrar el skeleton
 */
export function useDelayedLoading(
  isLoading,
  { delay = SKELETON_DELAY_MS, minDuration = SKELETON_MIN_MS } = {}
) {
  const [show, setShow] = useState(false);
  const shownAt = useRef(0);

  // useLayoutEffect: la limpieza corre en el mismo commit en que cambia isLoading,
  // así el temporizador de 150 ms no alcanza a dispararse después de que ya llegaron
  // los datos (con useEffect el skeleton podía aparecer encima del contenido).
  useLayoutEffect(() => {
    let timer;
    if (isLoading && !show) {
      timer = setTimeout(() => {
        shownAt.current = Date.now();
        setShow(true);
      }, delay);
    } else if (!isLoading && show) {
      const remaining = Math.max(0, minDuration - (Date.now() - shownAt.current));
      timer = setTimeout(() => setShow(false), remaining);
    }
    return () => clearTimeout(timer);
  }, [isLoading, show, delay, minDuration]);

  return show;
}

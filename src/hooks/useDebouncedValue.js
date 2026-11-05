import { useEffect, useState } from 'react';

/** Devuelve `value` solo después de `delay` ms sin cambios (búsqueda mientras se escribe). */
export function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

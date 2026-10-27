// Funciones puras de existencias y cantidad a comprar (HU-02 y HU-08).

/**
 * Texto de existencias para el detalle de una obra.
 * @param {number|null} n piezas disponibles (null = el backend no lo informó)
 */
export function textoExistencias(n) {
  if (n === null || n === undefined) return '';
  if (n <= 0) return 'Agotada';
  if (n === 1) return 'Última pieza disponible';
  return `${n} disponibles`;
}

/** Máximo que se puede elegir: las existencias, o 1 si no se conocen. */
export function maximoCompra(n) {
  return Number.isInteger(n) && n > 0 ? n : 1;
}

/** Deja la cantidad entre 1 y el máximo. */
export function limitarCantidad(cantidad, maximo) {
  const c = Math.trunc(Number(cantidad)) || 1;
  return Math.min(Math.max(1, c), Math.max(1, maximo));
}

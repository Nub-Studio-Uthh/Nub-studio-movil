// Funciones puras de los documentos legales.

/**
 * Parte un texto con **negritas** en trozos para dibujarlos con distinto estilo.
 * Ej: "**IMPORTANTE:** léelo" -> [{ texto: 'IMPORTANTE:', negrita: true }, { texto: ' léelo', negrita: false }]
 * @param {string} texto
 * @returns {{ texto: string, negrita: boolean }[]}
 */
export function partirNegritas(texto) {
  return String(texto ?? '')
    .split('**')
    .map((t, i) => ({ texto: t, negrita: i % 2 === 1 }))
    .filter((p) => p.texto !== '');
}

/**
 * Texto plano de un bloque (sin asteriscos), para lectores de pantalla y búsquedas.
 * @param {string} texto
 */
export function sinMarcas(texto) {
  return String(texto ?? '').replace(/\*\*/g, '');
}

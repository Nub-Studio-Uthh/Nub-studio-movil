/**
 * Medidas que dependen del ancho de la pantalla (docs/skeletons/README.md, sección 3.1).
 * Las usan el componente real y su skeleton, para que ambos midan siempre lo mismo.
 * Valores de referencia en una pantalla de 390: tarjeta 167, imagen 151×167 / 151×129,
 * banner 350×190, imagen del detalle 310×300.
 */
export const SCREEN_MARGIN = 20;
export const DETAIL_MARGIN = 24;
export const GRID_GAP = 16;
export const GRID_ROW_GAP = 20;
const MAX_CONTENT = 560;

// Alto fijo de la parte de texto de la tarjeta (paddings y separaciones) y de sus 3 líneas.
const CARD_FIXED = 36;
const CARD_TEXT_LINES = 58;

/**
 * @param {number} width ancho de la ventana
 * @param {number} [fontScale=1] escala de letra del sistema
 */
export function getLayout(width, fontScale = 1) {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 390;
  const scale = Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;

  const content = Math.min(safeWidth - 2 * SCREEN_MARGIN, MAX_CONTENT);
  const card = Math.floor((content - GRID_GAP) / 2);
  const cardImage = card - 16;
  const cardTextColumn = card - 16 - 6;
  const imageHeight = {
    inicio: Math.round((cardImage * 167) / 151),
    catalogo: Math.round((cardImage * 129) / 151),
  };
  const textBlock = CARD_FIXED + Math.round(CARD_TEXT_LINES * scale);
  const detailImage = safeWidth - 80;

  return {
    width: safeWidth,
    fontScale: scale,
    content,
    card: {
      width: card,
      imageWidth: cardImage,
      imageHeight,
      height: {
        inicio: imageHeight.inicio + textBlock,
        catalogo: imageHeight.catalogo + textBlock,
      },
      bars: {
        title: Math.round((cardTextColumn * 110) / 145),
        artist: Math.round((cardTextColumn * 80) / 145),
        price: Math.round((cardTextColumn * 56) / 145),
      },
    },
    banner: { width: content, height: Math.round((content * 190) / 350) },
    artistChipWidth: safeWidth - 2 * DETAIL_MARGIN,
    detailImage: { width: detailImage, height: Math.round((detailImage * 300) / 310) },
  };
}

/**
 * Cuántos elementos llenan el alto visible, con un mínimo.
 * @param {number} visibleHeight
 * @param {number} itemHeight
 * @param {number} gap
 * @param {number} minimum
 */
export function itemsToFill(visibleHeight, itemHeight, gap, minimum) {
  if (!(visibleHeight > 0) || !(itemHeight > 0)) return minimum;
  return Math.max(minimum, Math.ceil(visibleHeight / (itemHeight + gap)));
}

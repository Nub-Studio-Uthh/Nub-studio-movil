import { getLayout, itemsToFill } from '../../src/utils/layout';

// Reglas de medida de docs/skeletons/README.md (sección 3.1).
describe('getLayout', () => {
  it('reproduce las medidas de Figma en una pantalla de 390', () => {
    const l = getLayout(390);
    expect(l.content).toBe(350);
    expect(l.card.width).toBe(167);
    expect(l.card.imageWidth).toBe(151);
    expect(l.card.imageHeight).toEqual({ inicio: 167, catalogo: 129 });
    expect(l.card.height).toEqual({ inicio: 261, catalogo: 223 });
    expect(l.card.bars).toEqual({ title: 110, artist: 80, price: 56 });
    expect(l.banner).toEqual({ width: 350, height: 190 });
    expect(l.artistChipWidth).toBe(342);
    expect(l.detailImage).toEqual({ width: 310, height: 300 });
  });

  it.each([
    [360, 152, 244, 210, 174],
    [430, 187, 283, 240, 212],
  ])('ajusta las medidas a %i de ancho', (width, card, altoInicio, altoCatalogo, banner) => {
    const l = getLayout(width);
    expect(l.card.width).toBe(card);
    expect(l.card.height.inicio).toBe(altoInicio);
    expect(l.card.height.catalogo).toBe(altoCatalogo);
    expect(l.banner.height).toBe(banner);
  });

  it('crece el alto de la tarjeta con la letra del sistema', () => {
    expect(getLayout(390, 1.5).card.height.catalogo).toBe(129 + 36 + 87);
  });

  it('limita el contenido a 560 en tablet', () => {
    expect(getLayout(1024).content).toBe(560);
  });

  it('usa valores seguros si el ancho o la escala no son válidos', () => {
    expect(getLayout(undefined).card.width).toBe(167);
    expect(getLayout(390, 0).fontScale).toBe(1);
  });
});

describe('itemsToFill', () => {
  it('calcula cuántos elementos llenan el alto visible', () => {
    expect(itemsToFill(700, 223, 20, 2)).toBe(3);
  });

  it('respeta el mínimo', () => {
    expect(itemsToFill(100, 223, 20, 2)).toBe(2);
    expect(itemsToFill(0, 223, 20, 3)).toBe(3);
  });
});

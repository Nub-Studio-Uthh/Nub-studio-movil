import { LEGAL, OTRO_DOCUMENTO } from '../../src/constants/legal';
import { partirNegritas, sinMarcas } from '../../src/utils/legal';

const TIPOS = new Set(['p', 'h3', 'ul', 'ol', 'box', 'table', 'contact']);

describe('documentos legales (iguales a la web)', () => {
  it('parte el texto en trozos normales y en negritas', () => {
    expect(partirNegritas('**IMPORTANTE:** léelo')).toEqual([
      { texto: 'IMPORTANTE:', negrita: true },
      { texto: ' léelo', negrita: false },
    ]);
    expect(partirNegritas('sin marcas')).toEqual([{ texto: 'sin marcas', negrita: false }]);
    expect(partirNegritas(null)).toEqual([]);
    expect(sinMarcas('**RFC:** X')).toBe('RFC: X');
  });

  it('tiene los mismos documentos y secciones que la web', () => {
    expect(LEGAL.terminos.title).toBe('Términos y Condiciones');
    expect(LEGAL.privacidad.title).toBe('Aviso de Privacidad');
    expect(LEGAL.terminos.sections).toHaveLength(17);
    expect(LEGAL.privacidad.sections).toHaveLength(16);
    expect(OTRO_DOCUMENTO.terminos.tipo).toBe('privacidad');
    expect(OTRO_DOCUMENTO.privacidad.tipo).toBe('terminos');
  });

  it('cada sección tiene id único y solo bloques que la app sabe dibujar', () => {
    for (const doc of Object.values(LEGAL)) {
      const ids = doc.sections.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
      const bloques = [doc.intro, ...doc.sections.flatMap((s) => s.blocks)].filter(Boolean);
      for (const b of bloques) {
        expect(TIPOS.has(b.t)).toBe(true);
        if (b.t === 'table') b.rows.forEach((fila) => expect(fila).toHaveLength(b.head.length));
      }
    }
  });
});

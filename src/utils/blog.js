// Funciones puras del blog (HU-05): convertir datos de la API y leer el contenido HTML.

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * Fecha corta como en el diseño. Ej: "2026-09-20T15:54:07Z" -> "20 sep 2026"
 * @param {string|number|Date|null|undefined} valor
 * @returns {string} '' si la fecha no es válida
 */
export function formatearFecha(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  const d = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Convierte un post de /api/blog/posts al formato que usa la app.
 * @param {Record<string, any>} raw
 */
export function normalizarPost(raw) {
  const etiquetas = Array.isArray(raw?.etiquetas)
    ? raw.etiquetas.map((e) => (typeof e === 'string' ? e : e?.nombre)).filter(Boolean)
    : [];
  return {
    id: raw?.id_post,
    slug: raw?.slug ?? '',
    titulo: raw?.titulo ?? '',
    extracto: raw?.extracto ?? '',
    imagen: raw?.imagen_destacada ?? null,
    categoria: raw?.categoria_nombre ?? '',
    autor: raw?.autor_nombre || 'Equipo NU-B Studio',
    autorFoto: raw?.autor_foto ?? null,
    fecha: raw?.fecha_publicacion ?? raw?.fecha_creacion ?? null,
    comentarios: Number(raw?.total_comentarios) || 0,
    contenido: typeof raw?.contenido === 'string' ? raw.contenido : null,
    etiquetas,
  };
}

/** Iniciales para el avatar del autor. Ej: "Equipo NU-B Studio" -> "ES" */
export function iniciales(nombre) {
  const palabras = String(nombre ?? '')
    .trim()
    .split(/\s+/)
    .filter((p) => /[\p{L}\d]/u.test(p));
  if (!palabras.length) return 'NS';
  const primera = palabras[0][0];
  const ultima = palabras.length > 1 ? palabras[palabras.length - 1][0] : '';
  return (primera + ultima).toUpperCase();
}

// ── Contenido HTML ─────────────────────────────────────────────────────────────
// El editor de la web guarda el contenido en HTML. La app no usa un WebView: el HTML se
// convierte en bloques (títulos, párrafos, listas e imágenes) que se dibujan con componentes
// nativos. Así no se ejecuta código del contenido y el texto respeta la tipografía del UI Kit.

const ENTIDADES = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  aacute: 'á',
  eacute: 'é',
  iacute: 'í',
  oacute: 'ó',
  uacute: 'ú',
  Aacute: 'Á',
  Eacute: 'É',
  Iacute: 'Í',
  Oacute: 'Ó',
  Uacute: 'Ú',
  ntilde: 'ñ',
  Ntilde: 'Ñ',
  uuml: 'ü',
  Uuml: 'Ü',
  iexcl: '¡',
  iquest: '¿',
  laquo: '«',
  raquo: '»',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  middot: '·',
  deg: '°',
};

/** Reemplaza entidades HTML (&amp;, &aacute;, &#233;, &#xE9;) por su carácter. */
export function decodificarEntidades(texto) {
  return String(texto ?? '').replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entidad, codigo) => {
    if (codigo[0] === '#') {
      const n =
        codigo[1] === 'x' || codigo[1] === 'X'
          ? parseInt(codigo.slice(2), 16)
          : parseInt(codigo.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : entidad;
    }
    return ENTIDADES[codigo] ?? entidad;
  });
}

const BLOQUES = new Set([
  'p',
  'div',
  'section',
  'article',
  'blockquote',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'figure',
  'figcaption',
  'hr',
  'table',
  'tr',
]);
const NEGRITA = new Set(['b', 'strong']);
const CURSIVA = new Set(['i', 'em']);

const leerAtributo = (etiqueta, nombre) => {
  const m = etiqueta.match(
    new RegExp(`\\s${nombre}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')
  );
  return m ? decodificarEntidades(m[1] ?? m[2] ?? m[3] ?? '') : '';
};

// Texto con etiquetas escritas como texto (p. ej. "&lt;em&gt;") se limpia en una segunda pasada.
const limpiarTexto = (t) => decodificarEntidades(t).replace(/<\/?[a-z][^>]*>/gi, '');

/**
 * Convierte el HTML de un post en bloques para dibujarlos en la app.
 * @param {string|null|undefined} html
 * @returns {Array<
 *   | { tipo: 'titulo' | 'parrafo' | 'item' | 'cita', partes: { texto: string, negrita: boolean, cursiva: boolean }[] }
 *   | { tipo: 'imagen', uri: string, alt: string }
 * >}
 */
export function htmlABloques(html) {
  if (typeof html !== 'string' || !html.trim()) return [];
  const limpio = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|svg)[\s\S]*?<\/\1\s*>/gi, '');

  const bloques = [];
  let partes = [];
  let tipo = 'parrafo';
  let negrita = 0;
  let cursiva = 0;
  let cita = 0;

  const cerrar = () => {
    // Une partes seguidas con el mismo estilo y recorta los espacios de las orillas.
    const unidas = [];
    for (const p of partes) {
      const prev = unidas[unidas.length - 1];
      if (prev && prev.negrita === p.negrita && prev.cursiva === p.cursiva) prev.texto += p.texto;
      else unidas.push({ ...p });
    }
    while (unidas.length && !unidas[0].texto.trim()) unidas.shift();
    while (unidas.length && !unidas[unidas.length - 1].texto.trim()) unidas.pop();
    if (unidas.length) {
      unidas[0].texto = unidas[0].texto.replace(/^[ \t]+/, '');
      const ult = unidas[unidas.length - 1];
      ult.texto = ult.texto.replace(/[ \t]+$/, '');
      const t = tipo === 'parrafo' && cita > 0 ? 'cita' : tipo;
      bloques.push({ tipo: t, partes: unidas });
    }
    partes = [];
    tipo = 'parrafo';
  };

  for (const token of limpio.split(/(<[^>]*>)/)) {
    if (!token) continue;
    if (token[0] === '<') {
      const m = token.match(/^<\s*(\/)?\s*([a-z0-9]+)/i);
      if (!m) continue;
      const cierre = !!m[1];
      const nombre = m[2].toLowerCase();

      if (nombre === 'img') {
        const uri = leerAtributo(token, 'src');
        cerrar();
        if (uri) bloques.push({ tipo: 'imagen', uri, alt: leerAtributo(token, 'alt') });
      } else if (nombre === 'br') {
        partes.push({ texto: '\n', negrita: negrita > 0, cursiva: cursiva > 0 });
      } else if (NEGRITA.has(nombre)) {
        negrita = Math.max(0, negrita + (cierre ? -1 : 1));
      } else if (CURSIVA.has(nombre)) {
        cursiva = Math.max(0, cursiva + (cierre ? -1 : 1));
      } else if (BLOQUES.has(nombre)) {
        cerrar();
        if (nombre === 'blockquote') cita = Math.max(0, cita + (cierre ? -1 : 1));
        if (!cierre && /^h[1-6]$/.test(nombre)) tipo = 'titulo';
        if (!cierre && nombre === 'li') tipo = 'item';
      }
      continue;
    }
    const texto = limpiarTexto(token).replace(/[ \t\r\n\f]+/g, ' ');
    if (texto) partes.push({ texto, negrita: negrita > 0, cursiva: cursiva > 0 });
  }
  cerrar();
  return bloques;
}

/** Texto sin formato del contenido (para calcular el tiempo de lectura). */
export function textoPlano(html) {
  return htmlABloques(html)
    .filter((b) => b.tipo !== 'imagen')
    .map((b) => b.partes.map((p) => p.texto).join(''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Minutos de lectura a 200 palabras por minuto (mínimo 1). */
export function minutosLectura(html) {
  const palabras = textoPlano(html).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(palabras / 200));
}

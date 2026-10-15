import {
  decodificarEntidades,
  formatearFecha,
  htmlABloques,
  iniciales,
  minutosLectura,
  normalizarPost,
  textoPlano,
} from '../../src/utils/blog';

describe('formatearFecha (HU-05)', () => {
  it('muestra día, mes corto y año como en el diseño', () => {
    expect(formatearFecha(new Date(2026, 8, 20))).toBe('20 sep 2026');
    expect(formatearFecha(new Date(2026, 0, 3).toISOString())).toBe('3 ene 2026');
  });

  it('regresa vacío si no hay fecha o no es válida', () => {
    expect(formatearFecha(null)).toBe('');
    expect(formatearFecha(undefined)).toBe('');
    expect(formatearFecha('')).toBe('');
    expect(formatearFecha('no es fecha')).toBe('');
  });
});

describe('normalizarPost (HU-05)', () => {
  it('convierte un post de la lista de la API', () => {
    const post = normalizarPost({
      id_post: 2,
      titulo: 'El Anciano de los Días',
      slug: 'el-anciano-de-los-dias',
      extracto: 'Una obra de Blake',
      imagen_destacada: 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg',
      categoria_nombre: 'Pintura',
      autor_nombre: 'Administrador',
      autor_foto: null,
      fecha_publicacion: '2026-04-11T04:59:58.491Z',
      total_comentarios: '1',
    });
    expect(post).toMatchObject({
      id: 2,
      slug: 'el-anciano-de-los-dias',
      titulo: 'El Anciano de los Días',
      categoria: 'Pintura',
      autor: 'Administrador',
      fecha: '2026-04-11T04:59:58.491Z',
      comentarios: 1,
      contenido: null,
      etiquetas: [],
    });
  });

  it('usa valores seguros cuando faltan datos y lee el contenido y las etiquetas del detalle', () => {
    const post = normalizarPost({
      id_post: 5,
      fecha_creacion: '2026-01-01T00:00:00Z',
      contenido: '<p>Hola</p>',
      etiquetas: [{ nombre: 'Huapango' }, 'Xantolo', null],
    });
    expect(post.autor).toBe('Equipo NU-B Studio');
    expect(post.titulo).toBe('');
    expect(post.imagen).toBeNull();
    expect(post.fecha).toBe('2026-01-01T00:00:00Z');
    expect(post.comentarios).toBe(0);
    expect(post.contenido).toBe('<p>Hola</p>');
    expect(post.etiquetas).toEqual(['Huapango', 'Xantolo']);
    expect(normalizarPost(undefined).slug).toBe('');
  });
});

describe('iniciales', () => {
  it('toma la primera letra de la primera y la última palabra', () => {
    expect(iniciales('Equipo NU-B Studio')).toBe('ES');
    expect(iniciales('mariana')).toBe('M');
    expect(iniciales('')).toBe('NS');
    expect(iniciales(null)).toBe('NS');
  });
});

describe('decodificarEntidades', () => {
  it('reemplaza entidades con nombre y numéricas', () => {
    expect(decodificarEntidades('Caf&eacute; &amp; arte&nbsp;&#161;s&iacute;! &#x41;')).toBe(
      'Café & arte ¡sí! A'
    );
  });

  it('deja igual las entidades desconocidas o inválidas', () => {
    expect(decodificarEntidades('&desconocida; &#0;')).toBe('&desconocida; &#0;');
    expect(decodificarEntidades(undefined)).toBe('');
  });
});

describe('htmlABloques (HU-05: el contenido se muestra con imágenes y texto)', () => {
  it('separa títulos, párrafos e imágenes y respeta negritas y cursivas', () => {
    const html =
      '<h2>¿Qué es una <b>fête</b> galante?</h2>' +
      '<div>El término <em>fête galante</em> fue acuñado&nbsp;por la Academia.</div>' +
      '<p><img src="https://res.cloudinary.com/demo/image/upload/v1/x.jpg" alt="Arco de cempasúchil"></p>';

    expect(htmlABloques(html)).toEqual([
      {
        tipo: 'titulo',
        partes: [
          { texto: '¿Qué es una ', negrita: false, cursiva: false },
          { texto: 'fête', negrita: true, cursiva: false },
          { texto: ' galante?', negrita: false, cursiva: false },
        ],
      },
      {
        tipo: 'parrafo',
        partes: [
          { texto: 'El término ', negrita: false, cursiva: false },
          { texto: 'fête galante', negrita: false, cursiva: true },
          { texto: ' fue acuñado por la Academia.', negrita: false, cursiva: false },
        ],
      },
      {
        tipo: 'imagen',
        uri: 'https://res.cloudinary.com/demo/image/upload/v1/x.jpg',
        alt: 'Arco de cempasúchil',
      },
    ]);
  });

  it('convierte listas y citas, y conserva los saltos de línea', () => {
    const bloques = htmlABloques(
      '<ul><li>Huapango</li><li>Xantolo</li></ul><blockquote>Arte vivo</blockquote><p>Uno<br>dos</p>'
    );
    expect(bloques.map((b) => b.tipo)).toEqual(['item', 'item', 'cita', 'parrafo']);
    expect(bloques[3].partes[0].texto).toBe('Uno\ndos');
  });

  it('ignora scripts, estilos, comentarios y párrafos vacíos', () => {
    const bloques = htmlABloques(
      '<script>alert(1)</script><style>p{}</style><!-- nota --><p>  </p><div><span style="font-size: 15px;">Texto</span></div>'
    );
    expect(bloques).toEqual([
      { tipo: 'parrafo', partes: [{ texto: 'Texto', negrita: false, cursiva: false }] },
    ]);
  });

  it('quita etiquetas escritas como texto en el editor (&lt;em&gt;)', () => {
    const [b] = htmlABloques('<div>El término &lt;em&gt;fête&lt;/em&gt; galante</div>');
    expect(b.partes.map((p) => p.texto).join('')).toBe('El término fête galante');
  });

  it('lee el src con comillas simples o sin comillas y omite imágenes sin src', () => {
    expect(
      htmlABloques("<img src='https://a.com/1.jpg'><img src=https://a.com/2.jpg><img>")
    ).toEqual([
      { tipo: 'imagen', uri: 'https://a.com/1.jpg', alt: '' },
      { tipo: 'imagen', uri: 'https://a.com/2.jpg', alt: '' },
    ]);
  });

  it('regresa una lista vacía si no hay contenido', () => {
    expect(htmlABloques('')).toEqual([]);
    expect(htmlABloques(null)).toEqual([]);
    expect(htmlABloques('   ')).toEqual([]);
  });
});

describe('textoPlano y minutosLectura', () => {
  it('junta el texto sin etiquetas ni imágenes', () => {
    expect(textoPlano('<h2>Título</h2><p>Uno <b>dos</b></p><img src="https://a.com/x.jpg">')).toBe(
      'Título Uno dos'
    );
  });

  it('calcula los minutos a 200 palabras por minuto, con mínimo 1', () => {
    const palabras = (n) => `<p>${Array.from({ length: n }, () => 'arte').join(' ')}</p>`;
    expect(minutosLectura(palabras(50))).toBe(1);
    expect(minutosLectura(palabras(1000))).toBe(5);
    expect(minutosLectura(null)).toBe(1);
  });
});

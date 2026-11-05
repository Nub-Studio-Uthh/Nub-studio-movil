import {
  contarFiltros,
  FILTROS_INICIALES,
  hayFiltrosActivos,
  imagenSegura,
  leerPrecio,
  limpiarBusqueda,
  normalizarObra,
  parametrosObras,
  validarRangoPrecio,
} from '../../src/utils/obras';

const CLOUD = 'https://res.cloudinary.com/demo/image/upload/v1712345/nub_studio/obras/rojo.jpg';

describe('imagenSegura (HU-01)', () => {
  it('pide a Cloudinary una versión del ancho necesario', () => {
    expect(imagenSegura(CLOUD, 453)).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_500,c_limit,f_auto,q_auto/v1712345/nub_studio/obras/rojo.jpg'
    );
  });

  it('respeta una transformación que ya exista', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/w_800,c_fill/v1/x.jpg';
    expect(imagenSegura(url, 300)).toBe(url);
  });

  it('deja igual las imágenes https de otro servidor o sin ancho', () => {
    expect(imagenSegura('https://ejemplo.com/a.jpg', 300)).toBe('https://ejemplo.com/a.jpg');
    expect(imagenSegura(CLOUD)).toBe(CLOUD);
  });

  it('rechaza imágenes sin https', () => {
    expect(imagenSegura('http://ejemplo.com/a.jpg', 300)).toBeNull();
    expect(imagenSegura(null)).toBeNull();
  });
});

describe('normalizarObra', () => {
  it('convierte los precios que llegan como texto desde PostgreSQL', () => {
    const obra = normalizarObra({
      id_obra: 7,
      titulo: 'Huapango en rojo',
      slug: 'huapango-en-rojo',
      imagen_principal: CLOUD,
      artista_nombre: 'Rosa Hernández',
      artista_alias: null,
      categoria_nombre: 'Pintura',
      precio_minimo: '2300.00',
      precio_oferta: '1850.00',
      destacada: true,
    });
    expect(obra).toEqual({
      id: 7,
      slug: 'huapango-en-rojo',
      titulo: 'Huapango en rojo',
      imagen: CLOUD,
      artista: 'Rosa Hernández',
      categoria: 'Pintura',
      precio: 2300,
      precioOferta: 1850,
      destacada: true,
    });
  });

  it('prefiere el nombre artístico y usa precio_base si no hay tamaños', () => {
    const obra = normalizarObra({ artista_alias: 'Rosi', precio_base: '900', destacada: 'x' });
    expect(obra.artista).toBe('Rosi');
    expect(obra.precio).toBe(900);
    expect(obra.destacada).toBe(false);
  });

  it('ignora una oferta que no es menor al precio o que no es número', () => {
    expect(normalizarObra({ precio_minimo: '500', precio_oferta: '600' }).precioOferta).toBeNull();
    expect(normalizarObra({ precio_minimo: '500', precio_oferta: 'abc' }).precioOferta).toBeNull();
    expect(normalizarObra(null).precio).toBe(0);
  });
});

describe('limpiarBusqueda', () => {
  it('quita espacios de más', () => {
    expect(limpiarBusqueda('  huapango   rojo ')).toBe('huapango rojo');
  });

  it('descarta búsquedas muy cortas, largas o con caracteres no permitidos', () => {
    expect(limpiarBusqueda('a')).toBe('');
    expect(limpiarBusqueda('x'.repeat(101))).toBe('');
    expect(limpiarBusqueda("rojo'; DROP")).toBe('');
    expect(limpiarBusqueda(undefined)).toBe('');
  });
});

describe('parametrosObras', () => {
  it('combina categoría, precio, orden y búsqueda', () => {
    expect(
      parametrosObras(
        {
          categoria: { id: 3, nombre: 'Textil' },
          precioMin: 500,
          precioMax: 3000,
          ordenar: 'precio_asc',
          buscar: ' sierra ',
        },
        { page: 2, limit: 12 }
      )
    ).toEqual({
      page: 2,
      limit: 12,
      ordenar: 'precio_asc',
      categoria: 3,
      precio_min: 500,
      precio_max: 3000,
      buscar: 'sierra',
    });
  });

  it('sin filtros solo envía página, límite y orden', () => {
    expect(parametrosObras(FILTROS_INICIALES)).toEqual({
      page: 1,
      limit: 12,
      ordenar: 'recientes',
      categoria: undefined,
      precio_min: undefined,
      precio_max: undefined,
      buscar: undefined,
    });
  });

  it('cambia un orden desconocido por "recientes"', () => {
    expect(parametrosObras({ ordenar: 'admin' }).ordenar).toBe('recientes');
  });
});

describe('validarRangoPrecio', () => {
  it('acepta rangos válidos o vacíos', () => {
    expect(validarRangoPrecio(500, 3000)).toBeNull();
    expect(validarRangoPrecio(null, 3000)).toBeNull();
    expect(validarRangoPrecio(500, null)).toBeNull();
    expect(validarRangoPrecio(1000, 1000)).toBeNull();
  });

  it('rechaza máximo menor al mínimo y valores negativos', () => {
    expect(validarRangoPrecio(3000, 500)).toMatch(/máximo/);
    expect(validarRangoPrecio(-1, 500)).toMatch(/mínimo/);
    expect(validarRangoPrecio(0, -5)).toMatch(/máximo/);
  });
});

describe('contarFiltros y hayFiltrosActivos', () => {
  it('cuenta categoría y rango de precio', () => {
    expect(contarFiltros(FILTROS_INICIALES)).toBe(0);
    expect(contarFiltros({ categoria: { id: 1 } })).toBe(1);
    expect(contarFiltros({ categoria: { id: 1 }, precioMax: 3000 })).toBe(2);
  });

  it('considera la búsqueda como algo que se puede limpiar', () => {
    expect(hayFiltrosActivos(FILTROS_INICIALES)).toBe(false);
    expect(hayFiltrosActivos({ buscar: 'rojo' })).toBe(true);
    expect(hayFiltrosActivos({ precioMin: 0 })).toBe(true);
  });
});

describe('leerPrecio', () => {
  it('convierte el texto del campo en número entero', () => {
    expect(leerPrecio('$3,000')).toBe(3000);
    expect(leerPrecio('')).toBeNull();
    expect(leerPrecio(undefined)).toBeNull();
    expect(leerPrecio('99999999999')).toBe(9999999);
  });
});

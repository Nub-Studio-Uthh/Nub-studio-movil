import { normalizarColeccion, textoObras } from '../../src/utils/colecciones';

// Como responde GET /api/colecciones (lista): total_obras llega como texto (COUNT de Postgres).
const deLista = {
  id_coleccion: 4,
  nombre: '  La historia de un libro ',
  slug: 'la-historia-de-un-libro-1783614543226',
  historia: '  Libros ilustrados a mano.  ',
  imagen_portada: 'https://res.cloudinary.com/demo/image/upload/v1/portada.jpg',
  destacada: false,
  fecha_creacion: '2026-07-09T22:29:05.962Z',
  artista_alias: 'gus',
  artista_foto: 'https://res.cloudinary.com/demo/image/upload/v1/gus.jpg',
  total_obras: '3',
};

// Como responde GET /api/colecciones/slug/:slug (detalle), con sus obras.
const deDetalle = {
  id_coleccion: 4,
  nombre: 'La historia de un libro',
  slug: 'la-historia-de-un-libro-1783614543226',
  historia: null,
  imagen_portada: null,
  destacada: true,
  estado: 'publicada',
  id_artista: 22,
  artista_nombre: 'Gustavo Hernández',
  artista_alias: 'gus',
  artista_foto: null,
  artista_matricula: 'A-0022',
  obras: [
    {
      id_obra: 55,
      titulo: 'libro 2',
      slug: 'libro-2',
      imagen_principal: null,
      precio_base: '9550.00',
      precio_minimo: null,
    },
    {
      id_obra: 54,
      titulo: 'libro 1',
      slug: 'libro-1',
      imagen_principal: null,
      precio_base: '4950.00',
      precio_minimo: '1500.00',
    },
  ],
};

describe('normalizarColeccion (HU-04)', () => {
  it('convierte una colección de la lista y lee el total de obras como número', () => {
    expect(normalizarColeccion(deLista)).toEqual({
      id: 4,
      slug: 'la-historia-de-un-libro-1783614543226',
      nombre: 'La historia de un libro',
      historia: 'Libros ilustrados a mano.',
      portada: 'https://res.cloudinary.com/demo/image/upload/v1/portada.jpg',
      destacada: false,
      artista: 'gus',
      artistaId: null,
      artistaFoto: 'https://res.cloudinary.com/demo/image/upload/v1/gus.jpg',
      totalObras: 3,
      obras: [],
    });
  });

  it('en el detalle trae sus obras con el artista y el precio más bajo', () => {
    const c = normalizarColeccion(deDetalle);
    expect(c.artistaId).toBe(22);
    expect(c.historia).toBe('');
    expect(c.totalObras).toBe(2);
    expect(c.obras).toEqual([
      expect.objectContaining({ id: 55, titulo: 'libro 2', artista: 'gus', precio: 9550 }),
      expect.objectContaining({ id: 54, titulo: 'libro 1', artista: 'gus', precio: 1500 }),
    ]);
    // La matrícula del artista no pasa a la app.
    expect(JSON.stringify(c)).not.toMatch(/A-0022/);
  });

  it('usa el nombre completo si no hay alias y tolera datos vacíos', () => {
    expect(normalizarColeccion({ ...deDetalle, artista_alias: null }).artista).toBe(
      'Gustavo Hernández'
    );
    expect(normalizarColeccion({ ...deLista, total_obras: 'x' }).totalObras).toBeNull();
    expect(normalizarColeccion(undefined)).toMatchObject({
      id: null,
      nombre: '',
      artista: '',
      totalObras: null,
      obras: [],
    });
  });
});

describe('textoObras', () => {
  it('escribe el número de obras en singular o plural', () => {
    expect(textoObras(1)).toBe('1 obra');
    expect(textoObras(14)).toBe('14 obras');
  });

  it('regresa cadena vacía si no hay obras o el número no es válido', () => {
    expect(textoObras(0)).toBe('');
    expect(textoObras(null)).toBe('');
    expect(textoObras(2.5)).toBe('');
  });
});

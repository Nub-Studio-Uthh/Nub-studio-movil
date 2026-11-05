import { anioDe, esObraVisible, normalizarArtista } from '../../src/utils/artistas';

const raw = {
  id_artista: 4,
  nombre_completo: 'Rosa Hernández Cruz',
  nombre_artistico: 'Rosa Hernández',
  biografia: '  Pintora huasteca que retrata las fiestas.  ',
  foto_perfil: null,
  ciudad: 'Huejutla de Reyes',
  categoria_nombre: 'Pintura',
  fecha_aprobacion: '2018-05-02T10:00:00Z',
  // Datos privados que el endpoint también regresa y la app no debe conservar:
  correo: 'rosa@ejemplo.com',
  telefono: '7711234567',
  clabe: '012345678901234567',
  banco: 'Banco X',
  fotos_personales: [
    { url_foto: 'https://res.cloudinary.com/demo/image/upload/v1/rosa.jpg', es_principal: true },
  ],
  obras: [
    {
      id_obra: 1,
      titulo: 'Huapango en rojo',
      slug: 'huapango',
      estado: 'publicada',
      activa: true,
      precio_base: '2300.00',
      imagen_principal: null,
    },
    {
      id_obra: 2,
      titulo: 'Borrador',
      slug: 'borrador',
      estado: 'pendiente',
      activa: true,
      precio_base: '100',
    },
    {
      id_obra: 3,
      titulo: 'Retirada',
      slug: 'retirada',
      estado: 'publicada',
      activa: false,
      precio_base: '100',
    },
    {
      id_obra: 4,
      titulo: 'Rechazada',
      slug: 'rechazada',
      estado: 'rechazada',
      activa: true,
      precio_base: '100',
    },
  ],
};

describe('anioDe', () => {
  it('regresa el año de una fecha válida', () => {
    expect(anioDe('2018-05-02T10:00:00Z')).toBe(2018);
  });

  it('regresa null si no hay fecha o no es válida', () => {
    expect(anioDe(null)).toBeNull();
    expect(anioDe(undefined)).toBeNull();
    expect(anioDe('')).toBeNull();
    expect(anioDe('no es fecha')).toBeNull();
  });
});

describe('esObraVisible', () => {
  it('solo acepta obras publicadas y activas', () => {
    expect(esObraVisible({ estado: 'publicada', activa: true })).toBe(true);
    expect(esObraVisible({ estado: 'publicada' })).toBe(true);
    expect(esObraVisible({ estado: 'publicada', activa: false })).toBe(false);
    expect(esObraVisible({ estado: 'pendiente', activa: true })).toBe(false);
    expect(esObraVisible(null)).toBe(false);
  });
});

describe('normalizarArtista (HU-03)', () => {
  it('conserva solo los datos públicos y las obras publicadas', () => {
    const a = normalizarArtista(raw);
    expect(a).toEqual({
      id: 4,
      nombre: 'Rosa Hernández',
      biografia: 'Pintora huasteca que retrata las fiestas.',
      foto: 'https://res.cloudinary.com/demo/image/upload/v1/rosa.jpg',
      ciudad: 'Huejutla de Reyes',
      categoria: 'Pintura',
      desde: 2018,
      obras: [expect.objectContaining({ id: 1, titulo: 'Huapango en rojo', precio: 2300 })],
    });
    // Ningún dato privado pasa a la app.
    const texto = JSON.stringify(a);
    expect(texto).not.toMatch(/rosa@ejemplo|7711234567|012345678901234567|Banco X/);
  });

  it('pone el nombre del artista en cada obra para la tarjeta', () => {
    expect(normalizarArtista(raw).obras[0].artista).toBe('Rosa Hernández');
  });

  it('usa el nombre completo y la foto de perfil cuando existen, y valores seguros si faltan', () => {
    const a = normalizarArtista({
      id_artista: 9,
      nombre_completo: 'Pedro Martínez',
      foto_perfil: 'https://a.com/p.jpg',
      fecha_registro: '2024-01-10T00:00:00Z',
    });
    expect(a.nombre).toBe('Pedro Martínez');
    expect(a.foto).toBe('https://a.com/p.jpg');
    expect(a.desde).toBe(2024);
    expect(a.biografia).toBe('');
    expect(a.obras).toEqual([]);
    expect(normalizarArtista(undefined)).toMatchObject({ id: null, nombre: '', obras: [] });
  });
});

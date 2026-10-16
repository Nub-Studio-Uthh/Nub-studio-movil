import { normalizarFavorito, puedeTenerFavoritos, textoGuardadas } from '../../src/utils/favoritos';

// Como responde GET /api/favoritos.
const raw = {
  id_favorito: 9,
  id_obra: 36,
  titulo: 'Pencas',
  slug: 'pencas-1775520363753',
  imagen_principal: 'https://res.cloudinary.com/demo/image/upload/v1/pencas.jpg',
  precio_base: '2400.00',
  estado: 'publicada',
  artista_alias: 'Sxmu',
};

describe('normalizarFavorito (HU-07)', () => {
  it('convierte un favorito en una obra disponible para la lista', () => {
    expect(normalizarFavorito(raw)).toEqual(
      expect.objectContaining({
        id: 36,
        slug: 'pencas-1775520363753',
        titulo: 'Pencas',
        artista: 'Sxmu',
        precio: 2400,
        disponible: true,
      })
    );
  });

  it('marca como no disponible una obra que ya no está publicada', () => {
    expect(normalizarFavorito({ ...raw, estado: 'pendiente' }).disponible).toBe(false);
  });
});

describe('textoGuardadas', () => {
  it('escribe cuántas obras hay guardadas', () => {
    expect(textoGuardadas(1)).toBe('1 obra guardada');
    expect(textoGuardadas(3)).toBe('3 obras guardadas');
    expect(textoGuardadas(0)).toBe('');
  });
});

describe('puedeTenerFavoritos', () => {
  it('solo las cuentas de cliente tienen favoritos', () => {
    expect(puedeTenerFavoritos({ rol: 'cliente' })).toBe(true);
    expect(puedeTenerFavoritos({ rol: 'artista' })).toBe(false);
    expect(puedeTenerFavoritos({ rol: 'admin' })).toBe(false);
    // Sesiones guardadas antes de conocer el rol: se intenta y el backend decide.
    expect(puedeTenerFavoritos({ nombre: 'Ana' })).toBe(true);
  });
});

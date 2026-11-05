import { normalizarObraDetalle } from '../../src/utils/obraDetalle';

const BASE = {
  id_obra: 1,
  id_artista: 1,
  titulo: 'Garganta de Amul',
  descripcion: 'Fotografía de la cascada.',
  imagen_principal: 'https://res.cloudinary.com/x/image/upload/v1/principal.jpg',
  precio_base: '1800.00',
  artista_nombre: 'Itzel Hernández Cruz',
  artista_alias: 'Itzel Lente',
  artista_foto: null,
  historia: 'Tomada en una lancha.',
  anio_creacion: 2023,
  dimensiones_ancho: '60.00',
  dimensiones_alto: '80.00',
  dimensiones_unidad: 'cm',
  permite_marco: true,
  con_certificado: false,
  imagenes: [
    { url_imagen: 'https://res.cloudinary.com/x/image/upload/v1/b.jpg', orden: 1 },
    { url_imagen: 'https://res.cloudinary.com/x/image/upload/v1/a.jpg', orden: 0 },
  ],
};

describe('normalizarObraDetalle', () => {
  it('convierte los campos principales', () => {
    const r = normalizarObraDetalle(BASE);
    expect(r.titulo).toBe('Garganta de Amul');
    expect(r.descripcion).toBe('Fotografía de la cascada.');
    expect(r.precio).toBe(1800);
  });

  it('ordena las imágenes por orden', () => {
    const { imagenes } = normalizarObraDetalle(BASE);
    expect(imagenes).toHaveLength(2);
    expect(imagenes[0]).toContain('/a.jpg');
  });

  it('usa la imagen principal si no hay lista de imágenes', () => {
    expect(normalizarObraDetalle({ ...BASE, imagenes: [] }).imagenes).toEqual([
      BASE.imagen_principal,
    ]);
  });

  it('prefiere el alias del artista', () => {
    const { artista } = normalizarObraDetalle(BASE);
    expect(artista.nombre).toBe('Itzel Lente');
    expect(artista.id).toBe(1);
  });

  it('muestra las etiquetas Destacada y Pieza única según el backend', () => {
    const r = normalizarObraDetalle({ ...BASE, destacada: true, es_original: true });
    expect(r.etiquetas).toEqual([
      { label: 'Destacada', tone: 'destacada' },
      { label: 'Pieza única', tone: 'exito' },
    ]);
  });

  it('no pone etiquetas si el backend no las marca', () => {
    expect(
      normalizarObraDetalle({ ...BASE, destacada: false, es_original: false }).etiquetas
    ).toEqual([]);
  });

  it('convierte los datos de la ficha de la obra', () => {
    const r = normalizarObraDetalle(BASE);
    expect(r.historia).toBe('Tomada en una lancha.');
    expect(r.anio).toBe(2023);
    expect(r.dimensiones).toBe('60 × 80 cm');
    expect(r.permiteMarco).toBe(true);
    expect(r.conCertificado).toBe(false);
  });

  it('deja en null lo que el backend no manda', () => {
    const r = normalizarObraDetalle({
      ...BASE,
      anio_creacion: null,
      dimensiones_ancho: null,
      dimensiones_alto: null,
      permite_marco: null,
      con_certificado: undefined,
    });
    expect(r.anio).toBeNull();
    expect(r.dimensiones).toBeNull();
    expect(r.permiteMarco).toBeNull();
    expect(r.conCertificado).toBeNull();
  });

  it('no falla con datos vacíos', () => {
    const r = normalizarObraDetalle(undefined);
    expect(r.precio).toBe(0);
    expect(r.imagenes).toEqual([]);
    expect(r.etiquetas).toEqual([]);
    expect(r.dimensiones).toBeNull();
  });
});

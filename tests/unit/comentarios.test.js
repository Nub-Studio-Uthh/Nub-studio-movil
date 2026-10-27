import {
  MAX_COMENTARIO,
  aceptaRespuestas,
  contarComentarios,
  idUsuarioDeToken,
  normalizarComentario,
  puedeComentar,
  textoComentarios,
  validarComentario,
} from '../../src/utils/comentarios';

// Token falso con el mismo formato que un JWT: encabezado.datos.firma (datos en base64url).
const tokenCon = (payload) =>
  `x.${globalThis.btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.firma`;

describe('comentarios del blog (HU-05)', () => {
  it('normaliza un comentario con sus respuestas anidadas', () => {
    const c = normalizarComentario({
      id_comentario: 5,
      id_usuario: 9,
      nivel: 0,
      contenido: '¡Qué bonito!',
      autor_nombre: 'Ana López',
      usuario_rol: 'cliente',
      fecha_creacion: '2026-10-20T10:00:00Z',
      respuestas: [
        { id_comentario: 6, padre_id: 5, nivel: 1, autor_nombre: 'gus', usuario_rol: 'artista' },
      ],
    });
    expect(c).toMatchObject({ id: 5, idUsuario: 9, autor: 'Ana López', esArtista: false });
    expect(c.respuestas[0]).toMatchObject({ id: 6, padreId: 5, nivel: 1, esArtista: true });
  });

  it('usa valores seguros si faltan datos', () => {
    expect(normalizarComentario(null)).toMatchObject({
      id: null,
      contenido: '',
      autor: 'Usuario de NU-B Studio',
      respuestas: [],
    });
  });

  it('cuenta comentarios y respuestas', () => {
    const arbol = [{ respuestas: [{ respuestas: [{ respuestas: [] }] }] }, { respuestas: [] }];
    expect(contarComentarios(arbol)).toBe(4);
    expect(contarComentarios(null)).toBe(0);
    expect(textoComentarios(0)).toBe('Sin comentarios');
    expect(textoComentarios(1)).toBe('1 comentario');
    expect(textoComentarios(4)).toBe('4 comentarios');
  });

  it('valida que el comentario no esté vacío ni sea demasiado largo', () => {
    expect(validarComentario('   ')).toBe('Escribe tu comentario.');
    expect(validarComentario('a'.repeat(MAX_COMENTARIO + 1))).toMatch(/2000/);
    expect(validarComentario(' Me encantó ')).toBeNull();
  });

  it('solo clientes y artistas pueden comentar', () => {
    expect(puedeComentar({ rol: 'cliente' })).toBe(true);
    expect(puedeComentar({ rol: 'artista' })).toBe(true);
    expect(puedeComentar({ rol: 'admin' })).toBe(false);
  });

  it('no permite responder más allá del tercer nivel', () => {
    expect(aceptaRespuestas({ nivel: 0 })).toBe(true);
    expect(aceptaRespuestas({ nivel: 1 })).toBe(true);
    expect(aceptaRespuestas({ nivel: 2 })).toBe(false);
  });

  it('lee el id de usuario del token y tolera tokens inválidos', () => {
    expect(idUsuarioDeToken(tokenCon({ id_usuario: 42, rol: 'cliente' }))).toBe(42);
    expect(idUsuarioDeToken(tokenCon({ rol: 'cliente' }))).toBeNull();
    expect(idUsuarioDeToken('no-es-un-token')).toBeNull();
    expect(idUsuarioDeToken(null)).toBeNull();
  });
});

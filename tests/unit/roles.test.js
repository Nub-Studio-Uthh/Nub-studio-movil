import { esRolPermitido } from '../../src/utils/roles';

describe('esRolPermitido (#148)', () => {
  it('permite al cliente', () => {
    expect(esRolPermitido({ rol: 'cliente' })).toBe(true);
  });

  it.each(['artista', 'admin'])('no permite al rol %s', (rol) => {
    expect(esRolPermitido({ rol })).toBe(false);
  });

  it.each([null, undefined, {}])('una sesión sin rol (%p) se trata como de cliente', (usuario) => {
    expect(esRolPermitido(usuario)).toBe(true);
  });
});

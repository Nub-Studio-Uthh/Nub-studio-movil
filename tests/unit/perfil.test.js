import { cambiosDePerfil, normalizarPerfil, validarPerfil } from '../../src/utils/perfil';

describe('utils/perfil', () => {
  it('normaliza la respuesta del backend', () => {
    expect(
      normalizarPerfil({
        nombre: 'Ana López',
        correo: 'ana@correo.mx',
        telefono: null,
        acepta_marketing: true,
      })
    ).toEqual({
      nombre: 'Ana López',
      correo: 'ana@correo.mx',
      telefono: '',
      aceptaMarketing: true,
    });
  });

  it('sin respuesta deja el marketing apagado', () => {
    expect(normalizarPerfil(null).aceptaMarketing).toBe(false);
  });

  it.each([
    [{ nombre: 'Ana López Núñez', telefono: '' }, {}],
    [{ nombre: 'Ana', telefono: '7711234567' }, {}],
    [{ nombre: 'An', telefono: '' }, { nombre: 'Escribe entre 3 y 100 caracteres' }],
    [{ nombre: 'Ana 123', telefono: '' }, { nombre: 'Solo se permiten letras y espacios' }],
    [{ nombre: 'Ana López', telefono: '12345' }, { telefono: 'Escribe 10 números' }],
    [{ nombre: 'Ana López', telefono: '77112345ab' }, { telefono: 'Escribe 10 números' }],
  ])('valida %j', (form, esperado) => {
    expect(validarPerfil(form)).toEqual(esperado);
  });

  it('solo incluye los datos que cambiaron', () => {
    const perfil = { nombre: 'Ana', telefono: '7711234567' };
    expect(cambiosDePerfil({ nombre: ' Ana ', telefono: '7711234567' }, perfil)).toEqual({});
    expect(cambiosDePerfil({ nombre: 'Ana Ruiz', telefono: '7711234567' }, perfil)).toEqual({
      nombre: 'Ana Ruiz',
    });
    expect(cambiosDePerfil({ nombre: 'Ana', telefono: '' }, perfil)).toEqual({ telefono: '' });
  });
});

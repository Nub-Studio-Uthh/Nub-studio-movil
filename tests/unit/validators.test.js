import { esContrasenaValida, esCorreoValido, validarRegistro } from '../../src/utils/validators';

describe('Validaciones de registro e inicio de sesión (HU-06)', () => {
  it('acepta correos con formato válido', () => {
    expect(esCorreoValido('gustavo@correo.com')).toBe(true);
  });

  it('rechaza correos inválidos', () => {
    expect(esCorreoValido('tu@correo')).toBe(false);
    expect(esCorreoValido('')).toBe(false);
  });

  it('pide contraseñas de al menos 8 caracteres', () => {
    expect(esContrasenaValida('1234567')).toBe(false);
    expect(esContrasenaValida('12345678')).toBe(true);
  });

  it('no regresa errores con un registro correcto', () => {
    const errores = validarRegistro({
      nombre: 'Luis Gustavo',
      correo: 'gustavo@correo.com',
      contrasena: 'secreta123',
      confirmacion: 'secreta123',
      aceptaTerminos: true,
    });
    expect(errores).toEqual({});
  });

  it('detecta contraseñas que no coinciden y términos sin aceptar', () => {
    const errores = validarRegistro({
      nombre: 'Luis',
      correo: 'gustavo@correo.com',
      contrasena: 'secreta123',
      confirmacion: 'otra12345',
      aceptaTerminos: false,
    });
    expect(errores.confirmacion).toBe('Las contraseñas no coinciden');
    expect(errores.terminos).toBeDefined();
  });
});

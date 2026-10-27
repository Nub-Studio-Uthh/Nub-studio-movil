import {
  esCodigoValido,
  mensajeContrasenaInsegura,
  validarLogin,
  validarRegistro,
} from '../../src/utils/validators';

describe('mensajeContrasenaInsegura', () => {
  it.each([
    ['Ab1@', 'Mínimo 8 caracteres'],
    ['abcdefg1@', 'Agrega al menos una mayúscula'],
    ['ABCDEFG1@', 'Agrega al menos una minúscula'],
    ['Abcdefgh@', 'Agrega al menos un número'],
    ['Abcdefg12', 'Agrega un carácter especial (@$!%*?&#)'],
  ])('%s -> %s', (pass, msg) => expect(mensajeContrasenaInsegura(pass)).toBe(msg));

  it('acepta una contraseña segura', () => {
    expect(mensajeContrasenaInsegura('Abcdef1@')).toBeNull();
  });
});

describe('esCodigoValido', () => {
  it('acepta 6 dígitos y rechaza lo demás', () => {
    expect(esCodigoValido('123456')).toBe(true);
    expect(esCodigoValido('12345')).toBe(false);
    expect(esCodigoValido('12a456')).toBe(false);
    expect(esCodigoValido(undefined)).toBe(false);
  });
});

describe('validarRegistro', () => {
  const base = {
    nombre: 'Ana Pérez',
    correo: 'a@b.com',
    contrasena: 'Abcdef1@',
    confirmacion: 'Abcdef1@',
    aceptaTerminos: true,
  };
  it('acepta datos válidos', () => expect(validarRegistro(base)).toEqual({}));
  it('exige el nombre', () => {
    expect(validarRegistro({ ...base, nombre: '  ' }).nombre).toBe('Este campo es obligatorio');
  });
  it('rechaza números en el nombre', () => {
    expect(validarRegistro({ ...base, nombre: 'Ana2' }).nombre).toBeDefined();
  });
  it('rechaza correo inválido', () => {
    expect(validarRegistro({ ...base, correo: 'nope' }).correo).toBeDefined();
  });
  it('rechaza contraseñas distintas y términos sin aceptar', () => {
    const r = validarRegistro({ ...base, confirmacion: 'otra', aceptaTerminos: false });
    expect(r.confirmacion).toBeDefined();
    expect(r.terminos).toBeDefined();
  });
});

describe('validarLogin', () => {
  it('acepta credenciales completas', () => {
    expect(validarLogin({ correo: 'a@b.com', contrasena: 'x' })).toEqual({});
  });
  it('marca correo inválido y contraseña vacía', () => {
    expect(validarLogin({ correo: 'nope', contrasena: '' })).toEqual({
      correo: 'Ingresa un correo válido',
      contrasena: 'Ingresa tu contraseña',
    });
  });
});

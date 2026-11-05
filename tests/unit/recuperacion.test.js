import {
  esCodigoRecuperacion,
  faltaEnContrasena,
  normalizarCodigoRecuperacion,
  validarNuevaContrasena,
} from '../../src/utils/recuperacion';

describe('recuperación de contraseña (HU-06)', () => {
  it('normaliza el código a 6 letras o números en mayúsculas', () => {
    expect(normalizarCodigoRecuperacion(' vm3-2v8x9 ')).toBe('VM32V8');
    expect(normalizarCodigoRecuperacion(null)).toBe('');
    expect(esCodigoRecuperacion('VM32V8')).toBe(true);
    expect(esCodigoRecuperacion('123456')).toBe(true);
    expect(esCodigoRecuperacion('VM32')).toBe(false);
  });

  it('pide las mismas reglas de contraseña que el backend', () => {
    expect(faltaEnContrasena('Corta1!')).toBe('Mínimo 8 caracteres.');
    expect(faltaEnContrasena('sinmayuscula1!')).toMatch(/mayúscula/);
    expect(faltaEnContrasena('SINMINUSCULA1!')).toMatch(/minúscula/);
    expect(faltaEnContrasena('SinNumero!!')).toMatch(/número/);
    expect(faltaEnContrasena('SinEspecial12')).toMatch(/especial/);
    expect(faltaEnContrasena('Aaaaa1234._')).toMatch(/repitas/);
    expect(faltaEnContrasena('Clave123456!')).toMatch(/secuencias/);
    expect(faltaEnContrasena('Huapango.26')).toBeNull();
    expect(faltaEnContrasena('Huasteca_2026')).toBeNull();
  });

  it('valida la contraseña nueva y su confirmación', () => {
    expect(validarNuevaContrasena({ nueva: 'Huapango.26', confirmacion: 'Huapango.26' })).toEqual(
      {}
    );
    expect(validarNuevaContrasena({ nueva: 'Huapango.26', confirmacion: 'otra' })).toEqual({
      confirmacion: 'Las contraseñas no coinciden.',
    });
    expect(validarNuevaContrasena({ nueva: 'corta', confirmacion: 'corta' }).nueva).toBeDefined();
  });
});

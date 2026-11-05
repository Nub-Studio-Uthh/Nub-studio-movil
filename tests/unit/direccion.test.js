import {
  DIRECCION_VACIA,
  cuerpoDireccion,
  filtrarPorNombre,
  firmaDireccion,
  normalizarLugar,
  urlDePago,
  validarDireccion,
} from '../../src/utils/direccion';

const COMPLETA = {
  ...DIRECCION_VACIA,
  calle: ' Av. Juárez ',
  numeroExterior: '12',
  colonia: 'Centro',
  estado: { id: 13, nombre: 'Hidalgo' },
  municipio: { id: 28, nombre: 'Huejutla de Reyes' },
  codigoPostal: '43000',
};

describe('dirección de envío y pago (HU-09)', () => {
  it('marca los campos obligatorios que faltan', () => {
    expect(validarDireccion(DIRECCION_VACIA)).toEqual({
      calle: 'Escribe la calle.',
      numeroExterior: 'Escribe el número exterior.',
      colonia: 'Escribe la colonia.',
      estado: 'Elige el estado.',
      municipio: 'Elige el municipio.',
      codigoPostal: 'El código postal tiene 5 números.',
    });
  });

  it('acepta una dirección completa y valida largos y código postal', () => {
    expect(validarDireccion(COMPLETA)).toEqual({});
    expect(validarDireccion({ ...COMPLETA, codigoPostal: '4300' }).codigoPostal).toBeDefined();
    expect(validarDireccion({ ...COMPLETA, numeroInterior: 'x'.repeat(21) }).numeroInterior).toBe(
      'Máximo 20 caracteres.'
    );
    expect(validarDireccion({ ...COMPLETA, calle: 'x'.repeat(256) }).calle).toMatch(/larga/);
  });

  it('arma el cuerpo que espera el backend', () => {
    expect(cuerpoDireccion(COMPLETA)).toEqual({
      calle: 'Av. Juárez',
      numero_exterior: '12',
      numero_interior: null,
      colonia: 'Centro',
      id_estado: 13,
      id_municipio: 28,
      codigo_postal: '43000',
      referencias: null,
    });
    expect(firmaDireccion(COMPLETA)).toBe(firmaDireccion({ ...COMPLETA }));
    expect(firmaDireccion(COMPLETA)).not.toBe(firmaDireccion({ ...COMPLETA, colonia: 'Otra' }));
  });

  it('normaliza estados y municipios', () => {
    expect(normalizarLugar({ id_estado: '13', nombre: 'Hidalgo' }, 'id_estado')).toEqual({
      id: 13,
      nombre: 'Hidalgo',
    });
    expect(normalizarLugar(null, 'id_estado')).toEqual({ id: null, nombre: '' });
  });

  it('solo acepta enlaces de pago https', () => {
    expect(
      urlDePago({ init_point: 'https://www.mercadopago.com.mx/checkout/v1/redirect?x=1' })
    ).toMatch(/^https:/);
    expect(urlDePago({ sandbox_init_point: 'https://sandbox.mercadopago.com.mx/x' })).toMatch(
      /sandbox/
    );
    expect(urlDePago({ init_point: 'http://inseguro.com' })).toBeNull();
    expect(urlDePago(null)).toBeNull();
  });

  it('busca sin importar acentos ni mayúsculas', () => {
    const lista = [
      { id: 1, nombre: 'Huejutla de Reyes' },
      { id: 2, nombre: 'Pachuca de Soto' },
      { id: 3, nombre: 'Tlanchinol' },
    ];
    expect(filtrarPorNombre(lista, 'HUÉJUTLA')).toEqual([lista[0]]);
    expect(filtrarPorNombre(lista, '  ')).toBe(lista);
  });
});

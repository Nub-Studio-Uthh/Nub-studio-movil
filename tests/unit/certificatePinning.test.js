// Certificate Pinning (#159): XML que genera el config plugin y su uso en app.config.js.
const { crearXml, validar } = require('../../plugins/withCertificatePinning');
const appJson = require('../../app.json');

const OPCIONES = {
  dominio: 'nub-studio-back.onrender.com',
  expiracion: '2027-12-31',
  pines: [
    'mEflZT5enoR1FuXLgYYGqnVEoZvmf9c2bVBpiOjYQ0c=',
    'hxqRlPTu1bMS/0DITB1SSu0vd4u/8l8TjPgfaAp63Gc=',
  ],
};

const PLUGIN = './plugins/withCertificatePinning';
const opcionesDe = (config) => config.plugins.find((p) => Array.isArray(p) && p[0] === PLUGIN)[1];

function cargarConfig(permitirHttp) {
  const anterior = process.env.PERMITIR_HTTP;
  if (permitirHttp) process.env.PERMITIR_HTTP = 'true';
  else delete process.env.PERMITIR_HTTP;
  let config;
  jest.isolateModules(() => {
    config = require('../../app.config.js')({ config: appJson.expo });
  });
  if (anterior === undefined) delete process.env.PERMITIR_HTTP;
  else process.env.PERMITIR_HTTP = anterior;
  return config;
}

describe('withCertificatePinning: XML', () => {
  it('fija los pines solo para el dominio del backend, sin subdominios', () => {
    const xml = crearXml(OPCIONES);
    expect(xml).toContain(
      '<domain includeSubdomains="false">nub-studio-back.onrender.com</domain>'
    );
    expect(xml).toContain('<pin-set expiration="2027-12-31">');
    for (const pin of OPCIONES.pines) expect(xml).toContain(`<pin digest="SHA-256">${pin}</pin>`);
  });

  it('en Release bloquea HTTP en toda la app', () => {
    const xml = crearXml(OPCIONES);
    expect(xml).toContain('<base-config cleartextTrafficPermitted="false" />');
    expect(xml).toContain('<domain-config cleartextTrafficPermitted="false">');
  });

  it('con permitirHttp deja HTTP para el backend local, pero nunca hacia Render', () => {
    const xml = crearXml({ ...OPCIONES, permitirHttp: true });
    expect(xml).toContain('<base-config cleartextTrafficPermitted="true" />');
    expect(xml).toContain('<domain-config cleartextTrafficPermitted="false">');
  });
});

describe('withCertificatePinning: validación', () => {
  it('acepta las opciones correctas', () => {
    expect(() => validar(OPCIONES)).not.toThrow();
  });

  it.each([
    [{ dominio: 'https://nub-studio-back.onrender.com' }, /dominio/],
    [{ pines: [OPCIONES.pines[0]] }, /al menos 2 pines/],
    [{ pines: [OPCIONES.pines[0], 'no-es-un-pin'] }, /pin inválido/],
    [{ expiracion: '31/12/2027' }, /expiracion/],
  ])('rechaza %j', (cambio, mensaje) => {
    expect(() => validar({ ...OPCIONES, ...cambio })).toThrow(mensaje);
  });

  it('los pines de app.json son válidos', () => {
    expect(() => validar(opcionesDe(appJson.expo))).not.toThrow();
  });
});

describe('app.config.js con el pinning', () => {
  it('la app normal no permite HTTP', () => {
    const opciones = opcionesDe(cargarConfig(false));
    expect(opciones.permitirHttp).toBeUndefined();
  });

  it('el APK de aceptación permite HTTP sin quitar los pines ni duplicar plugins', () => {
    const config = cargarConfig(true);
    const opciones = opcionesDe(config);
    expect(opciones.permitirHttp).toBe(true);
    expect(opciones.pines).toEqual(opcionesDe(appJson.expo).pines);
    const nombres = config.plugins.map((p) => (Array.isArray(p) ? p[0] : p));
    expect(new Set(nombres).size).toBe(nombres.length);
    const buildProperties = config.plugins.find((p) => p[0] === 'expo-build-properties')[1];
    expect(buildProperties.android).toMatchObject({
      enableMinifyInReleaseBuilds: true,
      usesCleartextTraffic: true,
    });
  });
});

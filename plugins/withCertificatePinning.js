// CERTIFICATE PINNING — issue #159
// Genera la configuración de seguridad de red de Android (network_security_config.xml)
// con los pines SHA-256 del backend y la registra en el AndroidManifest.
//
// Android aplica esta configuración por debajo de OkHttp, el cliente HTTP de React Native,
// así que cubre todas las peticiones de la app. Expo Go la ignora: solo aplica a los APK/AAB.
//
// Release bloquea HTTP sin cifrar. Debug lo permite porque necesita hablar con Metro, y el
// APK de pruebas de aceptación (permitirHttp) también, para usar el backend local.
// En los tres casos el pinning hacia el backend es el mismo.
const fs = require('fs');
const path = require('path');
const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

const ARCHIVO = 'network_security_config';
const PIN_BASE64 = /^[A-Za-z0-9+/]{43}=$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function validar({ dominio, pines, expiracion }) {
  if (!dominio || /[:/]/.test(dominio)) {
    throw new Error('withCertificatePinning: "dominio" va sin https:// ni rutas.');
  }
  if (!Array.isArray(pines) || pines.length < 2) {
    throw new Error(
      'withCertificatePinning: se necesitan al menos 2 pines (principal y respaldo).'
    );
  }
  const invalido = pines.find((pin) => !PIN_BASE64.test(pin));
  if (invalido) throw new Error(`withCertificatePinning: pin inválido "${invalido}".`);
  if (!FECHA.test(expiracion ?? '')) {
    throw new Error('withCertificatePinning: "expiracion" debe ser AAAA-MM-DD.');
  }
}

/** XML de la configuración de seguridad de red. */
function crearXml({ dominio, pines, expiracion, permitirHttp }) {
  const lineasPines = pines.map((pin) => `      <pin digest="SHA-256">${pin}</pin>`).join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- Generado por plugins/withCertificatePinning.js. No se edita a mano. -->
<network-security-config>
  <base-config cleartextTrafficPermitted="${permitirHttp ? 'true' : 'false'}" />
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="false">${dominio}</domain>
    <pin-set expiration="${expiracion}">
${lineasPines}
    </pin-set>
  </domain-config>
</network-security-config>
`;
}

function escribir(carpetaAndroid, variante, contenido) {
  const carpeta = path.join(carpetaAndroid, 'app', 'src', variante, 'res', 'xml');
  fs.mkdirSync(carpeta, { recursive: true });
  fs.writeFileSync(path.join(carpeta, `${ARCHIVO}.xml`), contenido);
}

/**
 * @param {object} config
 * @param {{ dominio: string, pines: string[], expiracion: string, permitirHttp?: boolean }} opciones
 */
function withCertificatePinning(config, opciones) {
  validar(opciones);

  config = withDangerousMod(config, [
    'android',
    (cfg) => {
      const android = cfg.modRequest.platformProjectRoot;
      escribir(android, 'main', crearXml(opciones));
      escribir(android, 'debug', crearXml({ ...opciones, permitirHttp: true }));
      return cfg;
    },
  ]);

  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    app.$['android:networkSecurityConfig'] = `@xml/${ARCHIVO}`;
    return cfg;
  });
}

module.exports = withCertificatePinning;
module.exports.crearXml = crearXml;
module.exports.validar = validar;

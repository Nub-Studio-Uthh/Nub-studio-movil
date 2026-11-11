// CONFIGURACIÓN DINÁMICA DE EXPO — issue #90
// Expo lee primero app.json y le pasa su contenido aquí como `config`.
//
// Solo el APK de las pruebas de aceptación (PERMITIR_HTTP=true) permite tráfico
// HTTP sin cifrar, porque el backend del entorno temporal corre en
// http://localhost:4000. La app normal y los builds de EAS siguen bloqueando HTTP
// (Android 9 o superior lo bloquea por defecto).
//
// La opción se agrega a los plugins que ya trae app.json, en lugar de duplicarlos, para que
// el APK de prueba también salga con R8 (#140) y con el pinning hacia Render (#159).
// Con network_security_config, Android ignora usesCleartextTraffic: por eso el plugin
// de pinning también recibe permitirHttp.
const nombre = (plugin) => (Array.isArray(plugin) ? plugin[0] : plugin);

/** Cambia las opciones de un plugin de la lista sin duplicarlo. */
function conOpciones(plugins, plugin, cambiar) {
  return plugins.map((p) => {
    if (nombre(p) !== plugin) return p;
    const opciones = (Array.isArray(p) && p[1]) || {};
    return [plugin, cambiar(opciones)];
  });
}

module.exports = ({ config }) => {
  if (process.env.PERMITIR_HTTP !== 'true') return config;

  let plugins = config.plugins ?? [];
  plugins = conOpciones(plugins, 'expo-build-properties', (o) => ({
    ...o,
    android: { ...o.android, usesCleartextTraffic: true },
  }));
  plugins = conOpciones(plugins, './plugins/withCertificatePinning', (o) => ({
    ...o,
    permitirHttp: true,
  }));

  return { ...config, plugins };
};

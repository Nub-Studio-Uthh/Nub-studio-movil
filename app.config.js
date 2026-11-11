// CONFIGURACIÓN DINÁMICA DE EXPO — issue #90
// Expo lee primero app.json y le pasa su contenido aquí como `config`.
//
// Solo el APK de las pruebas de aceptación (PERMITIR_HTTP=true) permite tráfico
// HTTP sin cifrar, porque el backend del entorno temporal corre en
// http://localhost:4000. La app normal y los builds de EAS siguen bloqueando HTTP
// (Android 9 o superior lo bloquea por defecto).
//
// La opción se agrega al expo-build-properties que ya trae app.json (R8, issue #140),
// en lugar de un segundo plugin, para que el APK de prueba también salga con R8.
const PLUGIN = 'expo-build-properties';
const nombre = (plugin) => (Array.isArray(plugin) ? plugin[0] : plugin);

module.exports = ({ config }) => {
  if (process.env.PERMITIR_HTTP !== 'true') return config;

  const plugins = config.plugins ?? [];
  const actual = plugins.find((p) => nombre(p) === PLUGIN);
  const opciones = (Array.isArray(actual) && actual[1]) || {};
  const conHttp = [
    PLUGIN,
    { ...opciones, android: { ...opciones.android, usesCleartextTraffic: true } },
  ];

  return {
    ...config,
    plugins: [...plugins.filter((p) => nombre(p) !== PLUGIN), conHttp],
  };
};

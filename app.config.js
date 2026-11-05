// CONFIGURACIÓN DINÁMICA DE EXPO — issue #90
// Expo lee primero app.json y le pasa su contenido aquí como `config`.
//
// Solo el APK de las pruebas de aceptación (PERMITIR_HTTP=true) permite tráfico
// HTTP sin cifrar, porque el backend del entorno temporal corre en
// http://localhost:4000. La app normal y los builds de EAS siguen bloqueando HTTP
// (Android 9 o superior lo bloquea por defecto).
module.exports = ({ config }) => {
  if (process.env.PERMITIR_HTTP !== 'true') return config;
  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ['expo-build-properties', { android: { usesCleartextTraffic: true } }],
    ],
  };
};

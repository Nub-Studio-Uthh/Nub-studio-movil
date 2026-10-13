/* global jest */
// Simulaciones para probar componentes sin módulos nativos.

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  // La simulación oficial no trae este hook.
  useReducedMotion: () => false,
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => insets,
    SafeAreaInsetsContext: React.createContext(insets),
  };
});

// Íconos: un componente vacío con el nombre del ícono, para no depender de SVG.
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    { __esModule: true },
    {
      get: (target, name) => {
        if (name in target) return target[name];
        const Icono = () => <View testID={`icono-${String(name)}`} />;
        return Icono;
      },
    }
  );
});

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: (props) => <View {...props} /> };
});

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: (props) => <View testID="imagen" {...props} /> };
});

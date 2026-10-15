import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider, useAuth } from './src/models/AuthContext';
import { CatalogFiltersProvider } from './src/models/CatalogFiltersContext';
import { colors } from './src/constants/colors';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.bgScreen,
    card: colors.bgScreen,
    text: colors.textPrimary,
    border: colors.borderDefault,
  },
};

function AppContent() {
  const { status } = useAuth();

  // El splash sigue visible hasta saber si hay una sesión guardada.
  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync();
  }, [status]);

  return (
    <NavigationContainer theme={theme}>
      <StatusBar style="dark" />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  // Si las fuentes fallan, la app sigue con la fuente del sistema.
  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CatalogFiltersProvider>
          <AppContent />
        </CatalogFiltersProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

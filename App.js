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
import { CatalogFiltersProvider } from './src/context/CatalogFiltersContext';
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

export default function App() {
  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // Si las fuentes fallan, la app sigue con la fuente del sistema.
  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <CatalogFiltersProvider>
        <NavigationContainer theme={theme}>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </CatalogFiltersProvider>
    </SafeAreaProvider>
  );
}

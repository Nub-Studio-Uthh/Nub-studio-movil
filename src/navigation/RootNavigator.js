import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { ComingSoonScreen } from '../views/screens/common/ComingSoonScreen';
import { LegalScreen } from '../views/screens/common/LegalScreen';
import { FiltersScreen } from '../views/screens/catalog/FiltersScreen';
import { DetalleObraScreen } from '../views/screens/catalog/DetalleObraScreen';
import { PerfilArtistaScreen } from '../views/screens/artist/PerfilArtistaScreen';
import { LoginScreen } from '../views/screens/auth/LoginScreen';
import { RegisterScreen } from '../views/screens/auth/RegisterScreen';
import { VerifyEmailScreen } from '../views/screens/auth/VerifyEmailScreen';
import { ChangePasswordScreen } from '../views/screens/profile/ChangePasswordScreen';
import { PersonalDataScreen } from '../views/screens/profile/PersonalDataScreen';
import { useAuth } from '../models/AuthContext';

const Stack = createNativeStackNavigator();

/**
 * Navegación raíz. Con sesión guardada abre en las pestañas; sin sesión abre en Login,
 * desde donde se puede "Explorar sin cuenta" (Inicio y Catálogo son públicos, HU-01).
 */
export function RootNavigator() {
  const { status } = useAuth();

  // Mientras se revisa el token guardado no se pinta nada (el splash sigue visible).
  if (status === 'loading') return null;

  return (
    <Stack.Navigator
      initialRouteName={status === 'authenticated' ? 'Tabs' : 'Login'}
      screenOptions={{ headerShown: false }}
    >
      {/* HU-06: cuenta */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
      <Stack.Screen name="CambiarContrasena" component={ChangePasswordScreen} />
      <Stack.Screen name="DatosPersonales" component={PersonalDataScreen} />

      <Stack.Screen name="Tabs" component={TabNavigator} />

      {/* Catálogo */}
      <Stack.Screen name="DetalleObra" component={DetalleObraScreen} />

      {/* Destinos de otras historias de usuario, temporales hasta programarlas */}
      <Stack.Screen
        name="Pedidos"
        component={ComingSoonScreen}
        initialParams={{ titulo: 'Mis pedidos' }}
      />
      {/* HU-03: se abre desde la tarjeta del artista en el detalle de obra */}
      <Stack.Screen name="PerfilArtista" component={PerfilArtistaScreen} />
      <Stack.Screen
        name="Filtros"
        component={FiltersScreen}
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: 'fitToContents',
          sheetCornerRadius: 28,
          sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen
        name="Colecciones"
        component={ComingSoonScreen}
        initialParams={{ titulo: 'Colecciones' }}
      />
      <Stack.Screen
        name="Blog"
        component={ComingSoonScreen}
        initialParams={{ titulo: 'El blog' }}
      />
    </Stack.Navigator>
  );
}

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { LegalScreen } from '../views/screens/common/LegalScreen';
import { FiltersScreen } from '../views/screens/catalog/FiltersScreen';
import { DetalleObraScreen } from '../views/screens/catalog/DetalleObraScreen';
import { PerfilArtistaScreen } from '../views/screens/artist/PerfilArtistaScreen';
import { LoginScreen } from '../views/screens/auth/LoginScreen';
import { RegisterScreen } from '../views/screens/auth/RegisterScreen';
import { VerifyEmailScreen } from '../views/screens/auth/VerifyEmailScreen';
import { RecuperarContrasenaScreen } from '../views/screens/auth/RecuperarContrasenaScreen';
import { PersonalDataScreen } from '../views/screens/profile/PersonalDataScreen';
import { EliminarCuentaScreen } from '../views/screens/profile/EliminarCuentaScreen';
import { BlogScreen } from '../views/screens/blog/BlogScreen';
import { PostScreen } from '../views/screens/blog/PostScreen';
import { ColeccionesScreen } from '../views/screens/coleccion/ColeccionesScreen';
import { ColeccionScreen } from '../views/screens/coleccion/ColeccionScreen';
import { useAuth } from '../models/AuthContext';
import { FinalizarCompraScreen } from '../views/screens/cart/FinalizarCompraScreen';
import { PedidosScreen } from '../views/screens/pedidos/PedidosScreen';
import { DetallePedidoScreen } from '../views/screens/pedidos/DetallePedidoScreen';

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
      {/* HU-06: recuperar la contraseña (desde Iniciar sesión) y cambiarla (desde Cuenta).
          El backend solo cambia contraseñas con un código enviado al correo. */}
      <Stack.Screen name="RecuperarContrasena" component={RecuperarContrasenaScreen} />
      <Stack.Screen
        name="CambiarContrasena"
        component={RecuperarContrasenaScreen}
        initialParams={{ modo: 'cuenta' }}
      />
      <Stack.Screen name="DatosPersonales" component={PersonalDataScreen} />
      {/* ARCO: Cancelación (requisito de Google Play) */}
      <Stack.Screen name="EliminarCuenta" component={EliminarCuentaScreen} />

      <Stack.Screen name="Tabs" component={TabNavigator} />

      {/* Catálogo */}
      <Stack.Screen name="DetalleObra" component={DetalleObraScreen} />
      {/* HU-09: el carrito (HU-08) abre esta pantalla con "Pagar" */}
      <Stack.Screen name="FinalizarCompra" component={FinalizarCompraScreen} />
      {/* HU-05: blog (se abre desde el botón del libro en Inicio) */}
      <Stack.Screen name="Blog" component={BlogScreen} />
      <Stack.Screen name="Publicacion" component={PostScreen} />

      {/* HU-10: mis pedidos (desde Cuenta) y su detalle */}
      <Stack.Screen name="Pedidos" component={PedidosScreen} />
      <Stack.Screen name="DetallePedido" component={DetallePedidoScreen} />

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

      {/* HU-04: colecciones (desde "Ver todas" y los chips de Inicio) */}
      <Stack.Screen name="Colecciones" component={ColeccionesScreen} />
      <Stack.Screen name="Coleccion" component={ColeccionScreen} />
    </Stack.Navigator>
  );
}

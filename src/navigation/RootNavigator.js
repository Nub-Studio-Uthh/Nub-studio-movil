import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { ComingSoonScreen } from '../screens/common/ComingSoonScreen';
import { FiltersScreen } from '../screens/catalog/FiltersScreen';
import { DetalleObraScreen } from '../screens/catalog/DetalleObraScreen';

const Stack = createNativeStackNavigator();

/**
 * Navegación raíz. La app abre directo en las pestañas (Inicio es público, HU-01);
 * Login se agregará en HU-06.
 */
export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      {/* Destinos de otras historias de usuario, temporales hasta programarlas */}
      <Stack.Screen name="DetalleObra" component={DetalleObraScreen} />
      <Stack.Screen
        name="PerfilArtista"
        component={ComingSoonScreen}
        initialParams={{ titulo: 'El perfil del artista' }}
      />
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

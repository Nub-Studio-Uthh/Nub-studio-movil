import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { ComingSoonScreen } from '../screens/common/ComingSoonScreen';

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
      <Stack.Screen
        name="DetalleObra"
        component={ComingSoonScreen}
        initialParams={{ titulo: 'El detalle de la obra' }}
      />
      {/* Fase 3 de HU-01: se reemplaza por la hoja de filtros */}
      <Stack.Screen
        name="Filtros"
        component={ComingSoonScreen}
        initialParams={{ titulo: 'Filtros' }}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="Colecciones"
        component={ComingSoonScreen}
        initialParams={{ titulo: 'Colecciones' }}
      />
    </Stack.Navigator>
  );
}

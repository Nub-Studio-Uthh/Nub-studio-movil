import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, LayoutGrid, Heart, ShoppingCart, User } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { type } from '../constants/typography';
import { CatalogScreen } from '../views/screens/catalog/CatalogScreen';
import { HomeScreen } from '../views/screens/catalog/HomeScreen';
import { AccountScreen } from '../views/screens/profile/AccountScreen';
import { FavoritosScreen } from '../views/screens/favoritos/FavoritosScreen';
import { CarritoScreen } from '../views/screens/cart/CarritoScreen';

const Tab = createBottomTabNavigator();

// Pestañas del UI Kit (sección 4). El Carrito va al centro, donde el pulgar llega más fácil,
// porque es la acción principal de compra; Favoritos queda junto a Cuenta.
const TABS = [
  { name: 'Inicio', label: 'Inicio', Icon: Home, component: HomeScreen },
  { name: 'Catalogo', label: 'Catálogo', Icon: LayoutGrid, component: CatalogScreen },
  { name: 'Carrito', label: 'Carrito', Icon: ShoppingCart, component: CarritoScreen },
  { name: 'Favoritos', label: 'Favoritos', Icon: Heart, component: FavoritosScreen },
  { name: 'Cuenta', label: 'Cuenta', Icon: User, component: AccountScreen },
];

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: type.tab,
        tabBarStyle: {
          backgroundColor: colors.bgScreen,
          borderTopColor: colors.borderDefault,
          borderTopWidth: 1,
        },
      }}
    >
      {TABS.map(({ name, label, Icon, component }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          initialParams={{ titulo: label }}
          options={{
            title: label,
            tabBarButtonTestID: `tab-${name.toLowerCase()}`,
            // Como en el prototipo: ícono inactivo en negro y texto en gris; activo en naranja.
            tabBarIcon: ({ focused }) => (
              <Icon
                size={20}
                color={focused ? colors.primary : colors.textPrimary}
                strokeWidth={focused ? 2 : 1.5}
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

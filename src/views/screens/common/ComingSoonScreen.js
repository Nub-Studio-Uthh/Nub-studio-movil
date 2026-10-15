import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hammer } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { EmptyState } from '../../components/states/EmptyState';

/** Pantalla temporal para secciones de historias de usuario que aún no se programan. */
export function ComingSoonScreen({ route }) {
  const insets = useSafeAreaInsets();
  const titulo = route?.params?.titulo ?? route?.name ?? 'Esta sección';
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <EmptyState
        Icon={Hammer}
        title={`${titulo} estará disponible pronto`}
        message="Estamos trabajando en esta sección de la app."
        testID="proximamente"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen, justifyContent: 'center' },
});

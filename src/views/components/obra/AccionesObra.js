import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { space } from '../../../constants/spacing';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';

/**
 * Barra fija inferior del detalle: favorito y "Agregar al carrito".
 * Solo avisa con callbacks; la pantalla decide qué hacer.
 * guardando: mientras se guarda el favorito el botón no responde, para no mandar dos veces.
 * @param {{ favorito?: boolean, guardando?: boolean, onToggleFavorito?: () => void,
 *   onAgregar?: () => void }} props
 */
export function AccionesObra({ favorito = false, guardando = false, onToggleFavorito, onAgregar }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
      <IconButton
        icon={
          <Heart
            size={22}
            color={favorito ? colors.favorite : colors.textPrimary}
            fill={favorito ? colors.favorite : 'transparent'}
          />
        }
        label={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        onPress={guardando ? undefined : onToggleFavorito}
        size={48}
        round
        testID="detalle-favorito"
      />
      <Button
        label="Agregar al carrito"
        onPress={onAgregar}
        testID="detalle-agregar-carrito"
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingTop: space.md,
    paddingHorizontal: space.lg,
    backgroundColor: colors.bgScreen,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
  },
  cta: { flex: 1 },
});

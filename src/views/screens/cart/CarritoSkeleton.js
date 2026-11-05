import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/spacing';
import { SCREEN_MARGIN, itemsToFill } from '../../../constants/layout';
import { SkeletonBlock, SkeletonContainer, SkeletonLine } from '../../components/skeleton';
import { ALTO_TARJETA, IMAGEN } from '../../components/carrito/CarritoItem';

const SEPARACION = 16;

/** Tarjeta del carrito en carga: mide lo mismo que CarritoItem. */
function SkeletonTarjeta() {
  return (
    <View style={styles.card}>
      <SkeletonBlock width={IMAGEN} height={IMAGEN} radius={radius.image} />
      <View style={styles.texts}>
        <SkeletonLine boxHeight={19} width="80%" height={12} />
        <SkeletonLine boxHeight={16} width="50%" height={10} />
        <SkeletonLine boxHeight={29} width={72} height={16} />
      </View>
    </View>
  );
}

/** Carrito en carga: las tarjetas que llenan la pantalla (mínimo 2). */
export function CarritoSkeleton({ topOffset = 220 }) {
  const { height } = useWindowDimensions();
  const tarjetas = itemsToFill(height - topOffset, ALTO_TARJETA, SEPARACION, 2);
  return (
    <SkeletonContainer label="Cargando tu carrito" style={styles.box}>
      <View style={styles.list}>
        {Array.from({ length: tarjetas }, (_, i) => (
          <SkeletonTarjeta key={i} />
        ))}
      </View>
    </SkeletonContainer>
  );
}

const styles = StyleSheet.create({
  box: { paddingHorizontal: SCREEN_MARGIN },
  list: { gap: SEPARACION },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 7,
    minHeight: ALTO_TARJETA,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgScreen,
  },
  texts: { flex: 1, gap: 4 },
});

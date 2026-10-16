import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/spacing';
import { SCREEN_MARGIN, itemsToFill } from '../../../constants/layout';
import { SkeletonBlock, SkeletonContainer, SkeletonLine } from '../../components/skeleton';
import { ALTO_TARJETA, IMAGEN } from '../../components/favorito/FavoritoCard';

const SEPARACION = 16;

/** Tarjeta de favorito en carga: mide lo mismo que FavoritoCard. */
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

/** Favoritos en carga: las tarjetas que llenan la pantalla (mínimo 3). */
export function FavoritosSkeleton({ topOffset = 160 }) {
  const { height } = useWindowDimensions();
  const tarjetas = itemsToFill(height - topOffset, ALTO_TARJETA, SEPARACION, 3);
  return (
    <SkeletonContainer label="Cargando tus favoritos" style={styles.box}>
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

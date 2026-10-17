import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/spacing';
import { SCREEN_MARGIN, itemsToFill } from '../../../constants/layout';
import { SkeletonBlock, SkeletonContainer, SkeletonLine } from '../../components/skeleton';
import { ALTO_TARJETA } from '../../components/pedido/PedidoCard';

const SEPARACION = 16;

/** Tarjeta de pedido en carga: mide lo mismo que PedidoCard. */
function SkeletonTarjeta() {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <SkeletonBlock width={44} height={44} radius={radius.icon} />
        <View style={styles.textos}>
          <SkeletonLine boxHeight={19} width="55%" height={12} />
          <SkeletonLine boxHeight={16} width="40%" height={10} />
        </View>
      </View>
      <View style={styles.bottom}>
        <SkeletonBlock width={72} height={20} radius={radius.badge} />
        <SkeletonLine boxHeight={23} width={64} height={14} />
      </View>
    </View>
  );
}

/** Mis pedidos en carga: las tarjetas que llenan la pantalla (mínimo 3). */
export function PedidosSkeleton({ topOffset = 140 }) {
  const { height } = useWindowDimensions();
  const tarjetas = itemsToFill(height - topOffset, ALTO_TARJETA, SEPARACION, 3);
  return (
    <SkeletonContainer label="Cargando tus pedidos" style={styles.box}>
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
    gap: 14,
    padding: 16,
    minHeight: ALTO_TARJETA,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgScreen,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textos: { flex: 1, gap: 4 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

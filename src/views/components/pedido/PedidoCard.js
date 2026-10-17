import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Package } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { cardShadow, radius } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { formatearPrecio } from '../../../utils/formatters';
import { estadoPedido, resumenPedido } from '../../../utils/pedidos';
import { EstadoPedido } from './EstadoPedido';

export const ALTO_TARJETA = 110;

/**
 * Pedido en la lista de Mis pedidos (HU-10): número, fecha y cantidad de obras, estatus y total.
 * @param {{ pedido: ReturnType<typeof import('../../../utils/pedidos').normalizarPedidos>[number],
 *   onPress?: (pedido) => void, testID?: string }} props
 */
function PedidoCardBase({ pedido, onPress, testID }) {
  const leido = [
    `Pedido ${pedido.codigo}`,
    estadoPedido(pedido.estado).label,
    resumenPedido(pedido),
    formatearPrecio(pedido.total),
  ].join(', ');

  return (
    <Pressable
      onPress={() => onPress?.(pedido)}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={leido}
      accessibilityHint="Abre el detalle del pedido"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.icono}>
          <Package size={22} color={colors.textPrimary} strokeWidth={1.5} />
        </View>
        <View style={styles.textos}>
          <Text style={[type.cardTitle, styles.titulo]} numberOfLines={1}>
            Pedido {pedido.codigo}
          </Text>
          <Text style={[type.meta, styles.resumen]} numberOfLines={1}>
            {resumenPedido(pedido)}
          </Text>
        </View>
      </View>
      <View style={styles.bottom}>
        <EstadoPedido estado={pedido.estado} />
        <Text style={[type.price, styles.total]}>
          {formatearPrecio(pedido.total, { moneda: false })}
        </Text>
      </View>
    </Pressable>
  );
}

export const PedidoCard = memo(PedidoCardBase);

const styles = StyleSheet.create({
  card: {
    gap: 14,
    padding: 16,
    minHeight: ALTO_TARJETA,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgScreen,
    ...cardShadow,
  },
  pressed: { opacity: 0.9 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icono: {
    width: 44,
    height: 44,
    borderRadius: radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSurface,
  },
  textos: { flex: 1, gap: 2 },
  titulo: { color: colors.textPrimary },
  resumen: { color: colors.textSecondary },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  total: { color: colors.textPrimary },
});

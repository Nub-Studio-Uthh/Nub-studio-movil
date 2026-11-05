import { StyleSheet, Text, View } from 'react-native';
import { colors, tint } from '../../../constants/colors';
import { radius } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { estadoPedido } from '../../../utils/pedidos';

const TONOS = {
  warning: colors.warning,
  success: colors.success,
  info: colors.info,
  tertiary: colors.tertiary,
  error: colors.error,
  neutral: colors.textSecondary,
};

/**
 * Badge con el estatus del pedido (pagado, enviado, pendiente…), con el estilo del UI Kit.
 * @param {{ estado: string, style?: object }} props
 */
export function EstadoPedido({ estado, style }) {
  const { label, tono } = estadoPedido(estado);
  const color = TONOS[tono] ?? TONOS.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: tint(color) }, style]}>
      <Text style={[type.badge, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: 20,
    paddingHorizontal: 12,
    borderRadius: radius.badge,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
});

import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { type } from '../../constants/typography';
import { formatearPrecio } from '../../utils/formatters';

/**
 * Precio de una obra. Con oferta: precio de oferta en naranja y el normal tachado.
 * @param {{ precio: number, precioOferta?: number|null, style?: object }} props
 */
export function PriceTag({ precio, precioOferta, style }) {
  const enOferta = typeof precioOferta === 'number' && precioOferta < precio;
  const actual = enOferta ? precioOferta : precio;
  return (
    <View style={[styles.row, style]}>
      <Text style={[type.price, { color: enOferta ? colors.primary : colors.textPrimary }]}>
        {formatearPrecio(actual, { moneda: false })}
      </Text>
      {enOferta ? (
        <Text
          style={[type.caption, styles.before]}
          accessibilityLabel={`Antes ${formatearPrecio(precio)}`}
        >
          {formatearPrecio(precio, { moneda: false })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  before: { color: colors.textMuted, textDecorationLine: 'line-through' },
});

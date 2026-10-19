import { PixelRatio, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { imagenSegura } from '../../../utils/obras';
import { formatearPrecio } from '../../../utils/formatters';

const IMAGEN = 64;

/**
 * Obra dentro del detalle de un pedido: imagen, título, artista, precio por pieza,
 * cantidad y total de la línea. Solo consulta.
 * @param {{ item: ReturnType<typeof import('../../../utils/pedidos').normalizarPedidos>[number]['items'][number],
 *   testID?: string }} props
 */
export function ItemPedido({ item, testID }) {
  const uri = imagenSegura(item.imagen, IMAGEN * PixelRatio.get());
  const leido = [
    item.titulo,
    item.artista ? `de ${item.artista}` : null,
    `${item.cantidad} ${item.cantidad === 1 ? 'pieza' : 'piezas'}`,
    formatearPrecio(item.total),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.row} testID={testID} accessible accessibilityLabel={leido}>
      <View style={styles.image}>
        {uri ? (
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            recyclingKey={String(item.id)}
            accessibilityIgnoresInvertColors
          />
        ) : null}
      </View>
      <View style={styles.textos}>
        <Text style={[type.cardTitle, styles.titulo]} numberOfLines={2}>
          {item.titulo}
        </Text>
        {item.artista ? (
          <Text style={[type.meta, styles.artista]} numberOfLines={1}>
            {item.artista}
          </Text>
        ) : null}
        <Text style={[type.caption, styles.unitario]}>
          {formatearPrecio(item.precioUnitario, { moneda: false })} c/u
          {item.cantidad > 1 ? `  ·  x${item.cantidad}` : ''}
        </Text>
      </View>
      <Text style={[type.price, styles.total]}>
        {formatearPrecio(item.total, { moneda: false })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  image: {
    width: IMAGEN,
    height: IMAGEN,
    borderRadius: radius.image,
    overflow: 'hidden',
    backgroundColor: colors.skeletonBase,
  },
  textos: { flex: 1, gap: 2 },
  titulo: { color: colors.textPrimary },
  artista: { color: colors.textSecondary },
  unitario: { color: colors.textMuted },
  total: { color: colors.textPrimary },
});

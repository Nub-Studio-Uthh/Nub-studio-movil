import { memo } from 'react';
import { PixelRatio, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Trash2 } from 'lucide-react-native';
import { colors, tint } from '../../../constants/colors';
import { cardShadow, radius } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { imagenSegura } from '../../../utils/obras';
import { formatearPrecio } from '../../../utils/formatters';
import { PriceTag } from '../ui/PriceTag';

export const IMAGEN = 88;
export const ALTO_TARJETA = IMAGEN + 16;

/**
 * Obra en el carrito (HU-08), como en el prototipo: imagen, título, artista, precio y la
 * papelera para quitarla. Tocar la tarjeta abre el detalle de la obra.
 * @param {{ item: ReturnType<typeof import('../../../utils/carrito').normalizarItemCarrito>,
 *   onPress?: (item) => void, onQuitar?: (item) => void, testID?: string }} props
 */
function CarritoItemBase({ item, onPress, onQuitar, testID }) {
  const uri = imagenSegura(item.imagen, IMAGEN * PixelRatio.get());
  const leido = [
    item.titulo,
    item.artista ? `de ${item.artista}` : null,
    item.cantidad > 1 ? `${item.cantidad} piezas` : null,
    formatearPrecio(item.precio),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => onPress?.(item)}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={leido}
        accessibilityHint="Abre el detalle de la obra"
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <View style={styles.image}>
          {uri ? (
            <Image
              source={{ uri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              recyclingKey={String(item.idCarrito)}
              accessibilityIgnoresInvertColors
            />
          ) : null}
        </View>
        <View style={styles.texts}>
          <Text style={[type.cardTitle, styles.title]} numberOfLines={2}>
            {item.titulo}
          </Text>
          {item.artista ? (
            <Text style={[type.meta, styles.artista]} numberOfLines={1}>
              {item.artista}
            </Text>
          ) : null}
          <View style={styles.precioRow}>
            <PriceTag precio={item.precioLista} precioOferta={item.precioOferta} />
            {item.cantidad > 1 ? (
              <Text style={[type.metaBold, styles.cantidad]}>x{item.cantidad}</Text>
            ) : null}
          </View>
        </View>
      </Pressable>
      <Pressable
        onPress={() => onQuitar?.(item)}
        testID={testID ? `${testID}-quitar` : undefined}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={`Quitar ${item.titulo} del carrito`}
        style={({ pressed }) => [styles.quitar, pressed && styles.pressed]}
      >
        <Trash2 size={20} color={colors.error} strokeWidth={1.75} />
      </Pressable>
    </View>
  );
}

export const CarritoItem = memo(CarritoItemBase);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 7,
    paddingRight: 12,
    minHeight: ALTO_TARJETA,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgScreen,
    ...cardShadow,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  pressed: { opacity: 0.85 },
  image: {
    width: IMAGEN,
    height: IMAGEN,
    borderRadius: radius.image,
    overflow: 'hidden',
    backgroundColor: colors.skeletonBase,
  },
  texts: { flex: 1, gap: 4, paddingVertical: 4 },
  title: { color: colors.textPrimary },
  artista: { color: colors.textSecondary },
  precioRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 },
  cantidad: { color: colors.textSecondary },
  quitar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    backgroundColor: tint(colors.error, 0.1),
  },
});

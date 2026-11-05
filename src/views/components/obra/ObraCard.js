import { memo } from 'react';
import { PixelRatio, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../../constants/colors';
import { cardShadow, radius } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { useLayout } from '../../../constants/layout';
import { imagenSegura } from '../../../utils/obras';
import { formatearPrecio } from '../../../utils/formatters';
import { Badge } from '../ui/Badge';
import { PriceTag } from '../ui/PriceTag';

/**
 * Tarjeta de obra (Inicio y Catálogo). Mide lo mismo que SkeletonObraCard:
 * ambas usan useLayout(). El borde de 1 cuenta dentro, por eso el padding es 7.
 * @param {{ obra: ReturnType<typeof import('../../../utils/obras').normalizarObra>,
 *   variant?: 'inicio'|'catalogo', onPress?: (obra) => void, testID?: string }} props
 */
function ObraCardBase({ obra, variant = 'catalogo', onPress, testID }) {
  const { card } = useLayout();
  const uri = imagenSegura(obra.imagen, card.imageWidth * PixelRatio.get());
  const badge = obra.precioOferta
    ? { label: 'Oferta', tone: 'oferta' }
    : obra.destacada
      ? { label: 'Destacada', tone: 'destacada' }
      : null;
  const precioLeido = formatearPrecio(obra.precioOferta ?? obra.precio);

  return (
    <Pressable
      onPress={() => onPress?.(obra)}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${obra.titulo}, de ${obra.artista}, ${precioLeido}`}
      accessibilityHint="Abre el detalle de la obra"
      style={({ pressed }) => [styles.card, { width: card.width }, pressed && styles.pressed]}
    >
      <View style={[styles.image, { width: card.imageWidth, height: card.imageHeight[variant] }]}>
        {uri ? (
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            recyclingKey={String(obra.id)}
            accessibilityIgnoresInvertColors
          />
        ) : null}
        {badge ? (
          <Badge label={badge.label} tone={badge.tone} onImage style={styles.badge} />
        ) : null}
      </View>
      <View style={styles.texts}>
        <View style={styles.top}>
          <Text style={[type.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {obra.titulo}
          </Text>
          <Text style={[type.meta, { color: colors.textSecondary }]} numberOfLines={1}>
            {obra.artista}
          </Text>
        </View>
        <PriceTag precio={obra.precio} precioOferta={obra.precioOferta} />
      </View>
    </Pressable>
  );
}

export const ObraCard = memo(ObraCardBase);

const styles = StyleSheet.create({
  card: {
    paddingTop: 7,
    paddingHorizontal: 7,
    paddingBottom: 12,
    gap: 7,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgScreen,
    ...cardShadow,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  image: { borderRadius: radius.image, overflow: 'hidden', backgroundColor: colors.skeletonBase },
  badge: { position: 'absolute', top: 6, left: 6 },
  texts: { paddingLeft: 6, gap: 6 },
  top: { gap: 2 },
});

import { memo } from 'react';
import { PixelRatio, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Heart } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { cardShadow, radius } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { imagenSegura } from '../../../utils/obras';
import { formatearPrecio } from '../../../utils/formatters';
import { Badge } from '../ui/Badge';
import { IconButton } from '../ui/IconButton';
import { PriceTag } from '../ui/PriceTag';

export const IMAGEN = 100;
export const ALTO_TARJETA = IMAGEN + 16;

/**
 * Obra guardada en Favoritos (HU-07), como en el prototipo: imagen, título, artista, precio
 * y el corazón para quitarla. Si la obra ya no está publicada se marca "No disponible".
 * @param {{ obra: ReturnType<typeof import('../../../utils/favoritos').normalizarFavorito>,
 *   onPress?: (obra) => void, onQuitar?: (obra) => void, testID?: string }} props
 */
function FavoritoCardBase({ obra, onPress, onQuitar, testID }) {
  const uri = imagenSegura(obra.imagen, IMAGEN * PixelRatio.get());
  const leido = [
    obra.titulo,
    obra.artista ? `de ${obra.artista}` : null,
    obra.disponible ? formatearPrecio(obra.precio) : 'no disponible',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => onPress?.(obra)}
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
              recyclingKey={String(obra.id)}
              accessibilityIgnoresInvertColors
            />
          ) : null}
        </View>
        <View style={styles.texts}>
          <Text style={[type.cardTitle, styles.title]} numberOfLines={2}>
            {obra.titulo}
          </Text>
          {obra.artista ? (
            <Text style={[type.meta, styles.artista]} numberOfLines={1}>
              {obra.artista}
            </Text>
          ) : null}
          {obra.disponible ? (
            <PriceTag precio={obra.precio} precioOferta={obra.precioOferta} style={styles.precio} />
          ) : (
            <Badge label="No disponible" tone="agotada" style={styles.precio} />
          )}
        </View>
      </Pressable>
      <IconButton
        icon={<Heart size={22} color={colors.favorite} fill={colors.favorite} />}
        label={`Quitar ${obra.titulo} de favoritos`}
        onPress={() => onQuitar?.(obra)}
        round
        testID={testID ? `${testID}-quitar` : undefined}
      />
    </View>
  );
}

export const FavoritoCard = memo(FavoritoCardBase);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 7,
    paddingRight: 10,
    minHeight: ALTO_TARJETA,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgScreen,
    ...cardShadow,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  pressed: { opacity: 0.9 },
  image: {
    width: IMAGEN,
    height: IMAGEN,
    borderRadius: radius.image,
    overflow: 'hidden',
    backgroundColor: colors.skeletonBase,
  },
  texts: { flex: 1, gap: 4, paddingVertical: 6 },
  title: { color: colors.textPrimary },
  artista: { color: colors.textSecondary },
  precio: { marginTop: 6 },
});

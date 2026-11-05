import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../constants/colors';
import { cardShadow, radius } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { formatearFecha } from '../../../utils/blog';
import { Badge } from '../ui/Badge';
import { PostImagen } from './PostImagen';

export const MINI_ANCHO = 240;
const MINI_IMAGEN = 130;

/**
 * Tarjeta compacta de publicación para la sección "Del blog" de Inicio (HU-05).
 * @param {{ post: object, onPress?: (post) => void, testID?: string }} props
 */
function PostMiniBase({ post, onPress, testID }) {
  const fecha = formatearFecha(post.fecha);
  return (
    <Pressable
      onPress={() => onPress?.(post)}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={[post.titulo, post.categoria, fecha].filter(Boolean).join(', ')}
      accessibilityHint="Abre la publicación"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <PostImagen
        uri={post.imagen}
        width={MINI_ANCHO - 14}
        height={MINI_IMAGEN}
        recyclingKey={String(post.id)}
      >
        {post.categoria ? (
          <Badge label={post.categoria} tone="oferta" onImage style={styles.badge} />
        ) : null}
      </PostImagen>
      <View style={styles.textos}>
        <Text style={[type.cardTitle, styles.titulo]} numberOfLines={2}>
          {post.titulo}
        </Text>
        {fecha ? <Text style={[type.meta, styles.muted]}>{fecha}</Text> : null}
      </View>
    </Pressable>
  );
}

export const PostMini = memo(PostMiniBase);

const styles = StyleSheet.create({
  card: {
    width: MINI_ANCHO,
    padding: 7,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgScreen,
    ...cardShadow,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  badge: { position: 'absolute', top: 10, left: 8 },
  textos: { paddingHorizontal: 6, paddingTop: 10, paddingBottom: 4, gap: 4 },
  titulo: { color: colors.textPrimary },
  muted: { color: colors.textMuted },
});

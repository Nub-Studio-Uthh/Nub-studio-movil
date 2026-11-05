import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, ChevronRight } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { cardShadow, radius } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { useLayout } from '../../../constants/layout';
import { formatearFecha } from '../../../utils/blog';
import { Badge } from '../ui/Badge';
import { PostImagen } from './PostImagen';

export const THUMB = 80;
export const IMAGEN_DESTACADA = 170 / 334; // alto / ancho de la imagen en el prototipo

/**
 * Tarjeta de publicación (HU-05).
 * - "destacada": la más reciente, con imagen grande, categoría, fecha, título y extracto.
 * - "fila": las demás, con miniatura, título y fecha.
 * @param {{ post: ReturnType<typeof import('../../../utils/blog').normalizarPost>,
 *   variant?: 'destacada'|'fila', onPress?: (post) => void, testID?: string }} props
 */
function PostCardBase({ post, variant = 'fila', onPress, testID }) {
  const { content } = useLayout();
  const fecha = formatearFecha(post.fecha);
  const leido = [post.titulo, post.categoria, fecha].filter(Boolean).join(', ');

  const comun = {
    onPress: () => onPress?.(post),
    testID,
    accessibilityRole: 'button',
    accessibilityLabel: leido,
    accessibilityHint: 'Abre la publicación',
  };

  if (variant === 'destacada') {
    const ancho = content - 16 - 2;
    return (
      <Pressable {...comun} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <PostImagen
          uri={post.imagen}
          width={ancho}
          height={Math.round(ancho * IMAGEN_DESTACADA)}
          recyclingKey={String(post.id)}
        >
          {post.categoria ? (
            <Badge label={post.categoria} tone="oferta" onImage style={styles.badge} />
          ) : null}
        </PostImagen>
        <View style={styles.texts}>
          {fecha ? (
            <View style={styles.meta}>
              <CalendarDays size={14} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={[type.meta, styles.muted]}>{fecha}</Text>
            </View>
          ) : null}
          <Text style={[type.section, styles.title]} numberOfLines={3}>
            {post.titulo}
          </Text>
          {post.extracto ? (
            <Text style={[type.bodySmall, styles.secondary]} numberOfLines={2}>
              {post.extracto}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      {...comun}
      style={({ pressed }) => [styles.card, styles.row, pressed && styles.pressed]}
    >
      <PostImagen uri={post.imagen} width={THUMB} height={THUMB} recyclingKey={String(post.id)} />
      <View style={styles.rowTexts}>
        <Text style={[type.cardTitle, styles.title]} numberOfLines={2}>
          {post.titulo}
        </Text>
        {fecha ? <Text style={[type.meta, styles.muted]}>{fecha}</Text> : null}
      </View>
      <ChevronRight size={20} color={colors.textMuted} strokeWidth={1.5} />
    </Pressable>
  );
}

export const PostCard = memo(PostCardBase);

const styles = StyleSheet.create({
  card: {
    padding: 7,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgScreen,
    ...cardShadow,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  badge: { position: 'absolute', top: 12, left: 8 },
  texts: { paddingHorizontal: 9, paddingTop: 12, paddingBottom: 6, gap: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { color: colors.textPrimary },
  muted: { color: colors.textMuted },
  secondary: { color: colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingRight: 16 },
  rowTexts: { flex: 1, gap: 4 },
});

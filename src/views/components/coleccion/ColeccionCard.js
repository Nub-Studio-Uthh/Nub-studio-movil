import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { cardShadow, radius } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { textoObras } from '../../../utils/colecciones';
import { Badge } from '../ui/Badge';
import { PostImagen } from '../blog/PostImagen';

export const PORTADA = 120;
export const ALTO_TARJETA = PORTADA + 16;

/**
 * Tarjeta de colección (HU-04), como en el prototipo: portada cuadrada, nombre, una línea
 * de su historia (o el artista si no tiene) y el número de obras.
 * Sin portada se muestra el degradado de marca.
 * @param {{ coleccion: ReturnType<typeof import('../../../utils/colecciones').normalizarColeccion>,
 *   onPress?: (coleccion) => void, testID?: string }} props
 */
function ColeccionCardBase({ coleccion, onPress, testID }) {
  const obras = textoObras(coleccion.totalObras);
  const subtitulo = coleccion.historia || (coleccion.artista ? `De ${coleccion.artista}` : '');
  const leido = [
    coleccion.nombre,
    coleccion.artista ? `de ${coleccion.artista}` : null,
    obras || null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={() => onPress?.(coleccion)}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={leido}
      accessibilityHint="Abre la colección con sus obras"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <PostImagen
        uri={coleccion.portada}
        width={PORTADA}
        height={PORTADA}
        recyclingKey={String(coleccion.id ?? coleccion.slug)}
      />
      <View style={styles.texts}>
        <Text style={[type.section, styles.title]} numberOfLines={2}>
          {coleccion.nombre}
        </Text>
        {subtitulo ? (
          <Text style={[type.bodySmall, styles.subtitle]} numberOfLines={2}>
            {subtitulo}
          </Text>
        ) : null}
        {obras ? <Badge label={obras} style={styles.badge} /> : null}
      </View>
      <ChevronRight size={20} color={colors.textMuted} strokeWidth={1.5} />
    </Pressable>
  );
}

export const ColeccionCard = memo(ColeccionCardBase);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 7,
    paddingRight: 14,
    minHeight: ALTO_TARJETA,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgScreen,
    ...cardShadow,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  texts: { flex: 1, gap: 6, paddingVertical: 8 },
  title: { color: colors.textPrimary },
  subtitle: { color: colors.textSecondary },
  badge: { marginTop: 4 },
});

import { PixelRatio, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { MIN_TOUCH, radius, space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { imagenSegura } from '../../../utils/obras';

const AVATAR = 44;

const iniciales = (nombre = '') =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

/**
 * Tarjeta del artista dentro del detalle de obra. Al tocarla va a su perfil.
 * @param {{ nombre: string, avatar?: string|null, onPress?: () => void }} props
 */
export function ArtistaCard({ nombre, avatar, onPress }) {
  const uri = avatar ? imagenSegura(avatar, AVATAR * PixelRatio.get()) : null;

  return (
    <Pressable
      onPress={onPress}
      testID="artista-card"
      accessibilityRole="button"
      accessibilityLabel={`Artista ${nombre}`}
      accessibilityHint="Abre el perfil del artista"
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.avatar}>
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Text style={[type.metaBold, { color: colors.textOnDark }]}>{iniciales(nombre)}</Text>
        )}
      </View>
      <Text style={[type.cardTitle, styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
        {nombre}
      </Text>
      <View style={styles.link}>
        <Text style={[type.metaBold, { color: colors.primary }]}>Ver perfil</Text>
        <ChevronRight size={16} color={colors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: MIN_TOUCH + space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radius.avatar,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { flex: 1 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});

import { StyleSheet, Text, View } from 'react-native';
import { colors, tint } from '../../constants/colors';
import { radius } from '../../constants/spacing';
import { type } from '../../constants/typography';

const TONES = {
  destacada: colors.tertiary,
  oferta: colors.primary,
  agotada: colors.textSecondary,
  exito: colors.success,
};

/**
 * Badge de estado del UI Kit (20 de alto, mayúsculas).
 * onImage: fondo blanco al 95 %, para ponerlo sobre la foto de una obra.
 */
export function Badge({ label, tone = 'destacada', onImage = false, style }) {
  const color = TONES[tone] ?? TONES.destacada;
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: onImage ? 'rgba(255,255,255,0.95)' : tint(color) },
        style,
      ]}
    >
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

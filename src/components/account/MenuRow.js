import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, ExternalLink } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { radius, space } from '../../constants/spacing';
import { type } from '../../constants/typography';

/** Fila del menú de Mi cuenta. `external` cambia la flecha por el ícono de enlace externo. */
export function MenuRow({ Icon, label, onPress, external, testID }) {
  const Trailing = external ? ExternalLink : ChevronRight;
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
    >
      <Icon size={18} color={colors.textPrimary} strokeWidth={1.5} />
      <Text style={[type.cardTitle, styles.label]}>{label}</Text>
      <View>
        <Trailing size={16} color={colors.textMuted} strokeWidth={1.5} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.input,
    backgroundColor: colors.bgScreen,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  label: { flex: 1, color: colors.textPrimary },
});

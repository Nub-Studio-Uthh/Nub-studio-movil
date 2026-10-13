import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/spacing';
import { type } from '../../constants/typography';

const VARIANTS = {
  primary: { bg: colors.primary, fg: colors.textOnDark, border: null },
  dark: { bg: colors.textPrimary, fg: colors.textOnDark, border: null },
  ghost: { bg: 'transparent', fg: colors.textPrimary, border: colors.borderDefault },
};

/**
 * Botón pill del UI Kit. El texto se muestra en mayúsculas.
 * @param {{ label: string, onPress?: () => void, variant?: 'primary'|'dark'|'ghost',
 *   disabled?: boolean, testID?: string, style?: object, compact?: boolean }} props
 */
export function Button({ label, onPress, variant = 'primary', disabled, testID, style, compact }) {
  const v = VARIANTS[variant] ?? VARIANTS.primary;
  const bg = disabled ? colors.borderDefault : v.bg;
  const fg = disabled ? colors.textMuted : v.fg;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        { backgroundColor: bg, opacity: pressed ? 0.85 : 1 },
        v.border && !disabled && { borderWidth: 1, borderColor: v.border },
        style,
      ]}
    >
      <Text style={[type.button, { color: fg }]}>{label.toUpperCase()}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: { minHeight: 44, paddingVertical: 12, paddingHorizontal: 16 },
});

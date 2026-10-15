import { Pressable, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { MIN_TOUCH, radius } from '../../../constants/spacing';

/**
 * Botón de solo ícono. size es el lado visible (40 o 48); la zona táctil mínima es 44.
 * @param {{ icon: React.ReactNode, label: string, onPress?: () => void, size?: number,
 *   variant?: 'surface'|'dark', round?: boolean, testID?: string, badge?: React.ReactNode }} props
 */
export function IconButton({
  icon,
  label,
  onPress,
  size = 40,
  variant = 'surface',
  round,
  testID,
  badge,
}) {
  const slop = Math.max(0, (MIN_TOUCH - size) / 2);
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      hitSlop={slop}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: round ? size / 2 : radius.input,
          backgroundColor: variant === 'dark' ? colors.textPrimary : colors.bgSurface,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {icon}
      {badge}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});

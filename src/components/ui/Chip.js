import { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/spacing';
import { type } from '../../constants/typography';

/**
 * Chip de 36 de alto (colecciones, categorías). Seleccionado: fondo oscuro.
 * La zona táctil llega a 44 con hitSlop.
 */
function ChipBase({ label, selected = false, onPress, testID }) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      hitSlop={{ top: 4, bottom: 4 }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.selected : styles.idle,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={[type.metaBold, { color: selected ? colors.textOnDark : colors.textPrimary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export const Chip = memo(ChipBase);

const styles = StyleSheet.create({
  chip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: radius.chip,
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.textPrimary },
  idle: { backgroundColor: colors.bgScreen, borderWidth: 1, borderColor: colors.borderDefault },
});

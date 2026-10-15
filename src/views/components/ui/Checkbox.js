import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';

/** Casilla con texto. `children` puede ser texto o <Text> anidados (enlaces). */
export function Checkbox({ checked, onToggle, children, accessibilityLabel, error, testID }) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onToggle}
        testID={testID}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={accessibilityLabel}
        style={styles.row}
      >
        <View style={[styles.box, checked && styles.boxOn, !!error && styles.boxError]}>
          {checked ? <Check size={14} color={colors.textOnDark} strokeWidth={3} /> : null}
        </View>
        <Text style={[type.caption, styles.label]}>{children}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  boxError: { borderColor: colors.error },
  label: { flex: 1, color: colors.textSecondary, lineHeight: 16 },
  error: { ...type.caption, color: colors.error },
});

import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/spacing';
import { type } from '../../constants/typography';
import { leerPrecio } from '../../utils/obras';

/** Campo numérico de precio con "$" y separador de miles. */
export function PriceInput({ label, value, onChange, placeholder, invalid, testID }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, invalid && styles.invalid]}>
        <Text style={[type.body, { color: colors.textMuted }]}>$</Text>
        <TextInput
          value={value === null ? '' : value.toLocaleString('en-US')}
          onChangeText={(t) => onChange(leerPrecio(t))}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={9}
          accessibilityLabel={label}
          testID={testID}
          style={[type.body, styles.input]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: 6 },
  label: { ...type.caption, color: colors.textSecondary },
  box: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgInput,
  },
  invalid: { borderColor: 'rgba(196,48,74,0.5)', backgroundColor: 'rgba(196,48,74,0.03)' },
  input: { flex: 1, color: colors.textPrimary, paddingVertical: 0 },
});

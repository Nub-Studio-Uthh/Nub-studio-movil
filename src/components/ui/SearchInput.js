import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/spacing';
import { type } from '../../constants/typography';

// El backend acepta de 2 a 100 caracteres para buscar.
export const SEARCH_MAX_LENGTH = 100;

/** Campo de búsqueda del UI Kit (48 de alto, fondo bg-input). */
export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Buscar obras, artistas...',
  testID,
}) {
  return (
    <View style={styles.box}>
      <Search size={16} color={colors.textMuted} strokeWidth={1.5} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        maxLength={SEARCH_MAX_LENGTH}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        testID={testID}
        accessibilityLabel="Buscar obras o artistas"
        style={[type.body, styles.input]}
      />
      {value ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={14}
          accessibilityRole="button"
          accessibilityLabel="Borrar búsqueda"
        >
          <X size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: radius.input,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  input: { flex: 1, color: colors.textPrimary, paddingVertical: 0 },
});

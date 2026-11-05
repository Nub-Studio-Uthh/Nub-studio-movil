import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { radius, space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';

/**
 * Campo de formulario del UI Kit: label arriba, ayuda o error abajo y ojito si es contraseña.
 * Borde naranja con foco, rojo con error.
 */
export function TextField({
  label,
  value,
  onChangeText,
  error,
  hint,
  secure,
  testID,
  ref,
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const oculto = secure && !visible;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <View style={[styles.box, focused && styles.boxFocus, !!error && styles.boxError]}>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={oculto}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          testID={testID}
          accessibilityLabel={label}
          style={[type.body, styles.input]}
          {...inputProps}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secure ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={14}
            accessibilityRole="button"
            accessibilityLabel={oculto ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            testID={testID ? `${testID}-toggle` : undefined}
          >
            {oculto ? (
              <Eye size={18} color={colors.textMuted} strokeWidth={1.5} />
            ) : (
              <EyeOff size={18} color={colors.textMuted} strokeWidth={1.5} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  label: { ...type.metaBold, fontSize: 11, letterSpacing: 0.5, color: colors.textSecondary },
  box: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.input,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  boxFocus: { borderColor: colors.primary },
  boxError: { borderColor: colors.error },
  input: { flex: 1, color: colors.textPrimary, paddingVertical: 0 },
  error: { ...type.caption, color: colors.error },
  hint: { ...type.caption, color: colors.textMuted },
});

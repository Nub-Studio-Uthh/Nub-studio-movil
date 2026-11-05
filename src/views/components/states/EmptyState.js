import { StyleSheet, Text, View } from 'react-native';
import { colors, tint } from '../../../constants/colors';
import { type } from '../../../constants/typography';
import { Button } from '../ui/Button';

/**
 * Estado vacío / error (docs/skeletons/README.md, sección 7): ícono en círculo de 72,
 * título, texto de apoyo y un botón.
 * @param {{ Icon?: React.ComponentType<any>, iconColor?: string, tone?: 'neutral'|'primary'|'error',
 *   title: string, message?: string, actionLabel?: string, onAction?: () => void,
 *   actionVariant?: 'primary'|'ghost', testID?: string, style?: object }} props
 */
export function EmptyState({
  Icon,
  tone = 'neutral',
  title,
  message,
  actionLabel,
  onAction,
  actionVariant = 'primary',
  testID,
  style,
}) {
  const palette = {
    neutral: { bg: colors.bgSurface, fg: colors.textSecondary },
    primary: { bg: tint(colors.primary), fg: colors.primary },
    error: { bg: tint(colors.error), fg: colors.error },
  }[tone];

  return (
    <View style={[styles.box, style]} testID={testID}>
      {Icon ? (
        <View style={[styles.circle, { backgroundColor: palette.bg }]}>
          <Icon size={32} color={palette.fg} strokeWidth={1.5} />
        </View>
      ) : null}
      <Text style={[styles.title, { color: colors.textPrimary }]} accessibilityRole="header">
        {title}
      </Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant={actionVariant}
          style={styles.button}
          testID={testID ? `${testID}-accion` : undefined}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 32 },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...type.section, fontSize: 17, lineHeight: 22, textAlign: 'center' },
  message: { ...type.bodySmall, color: colors.textSecondary, textAlign: 'center', maxWidth: 280 },
  button: { marginTop: 8 },
});

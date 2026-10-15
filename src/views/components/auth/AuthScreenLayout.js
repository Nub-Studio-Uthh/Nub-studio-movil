import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { IconButton } from '../ui/IconButton';
import { NubLogo } from '../ui/NubLogo';
import { colors } from '../../../constants/colors';
import { SCREEN_MARGIN } from '../../../constants/layout';
import { space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';

export function AuthScreenLayout({ title, subtitle, onBack, footer, children }) {
  const insets = useSafeAreaInsets();
  const conHeader = !!onBack;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          !conHeader && styles.centrado,
          {
            paddingTop: insets.top + (conHeader ? space.md : space.xxl),
            paddingBottom: insets.bottom + space.xl,
          },
        ]}
      >
        {conHeader ? (
          <View style={styles.headerRow}>
            <IconButton
              icon={<ArrowLeft size={20} color={colors.textPrimary} />}
              label="Volver"
              onPress={onBack}
              round
              testID="layout-volver"
            />
            <Text style={styles.headerTitle} accessibilityRole="header">
              {title.toUpperCase()}
            </Text>
          </View>
        ) : (
          <>
            <NubLogo />
            <Text style={styles.title} accessibilityRole="header">
              {title.toUpperCase()}
            </Text>
          </>
        )}

        {subtitle ? (
          <Text style={[type.bodySmall, styles.subtitle, !conHeader && styles.subtitleCentro]}>
            {subtitle}
          </Text>
        ) : null}

        <View style={styles.form}>{children}</View>

        {footer ? <Text style={styles.footer}>{footer}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen },
  content: { paddingHorizontal: SCREEN_MARGIN },
  centrado: { alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  headerTitle: { ...type.section, letterSpacing: 0.5, color: colors.textPrimary },
  title: {
    ...type.screenTitle,
    fontSize: 24,
    lineHeight: 30,
    color: colors.textPrimary,
    marginTop: space.xl,
    textAlign: 'center',
  },
  subtitle: { color: colors.textSecondary, marginTop: space.lg },
  subtitleCentro: { textAlign: 'center', marginTop: space.sm },
  form: { alignSelf: 'stretch', gap: space.lg, marginTop: space.xl },
  footer: {
    ...type.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: space.xxl,
  },
});

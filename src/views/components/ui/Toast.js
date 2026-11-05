import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { colors } from '../../../constants/colors';
import { radius, space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { FADE_MS, TOAST_MS } from '../../../constants/animations';

/**
 * Aviso flotante y breve, como "Agregado a favoritos" en Instagram o Facebook.
 * Aparece abajo, se queda unos 2 segundos y se oculta solo; no bloquea la pantalla.
 * Cada aviso nuevo debe traer un `id` distinto para volver a mostrarse.
 * @param {{ toast: { id: number, texto: string, icono?: React.ReactNode } | null,
 *   onHide?: () => void, bottom?: number }} props
 */
export function Toast({ toast, onHide, bottom = space.xl }) {
  useEffect(() => {
    if (!toast) return undefined;
    AccessibilityInfo.announceForAccessibility?.(toast.texto);
    const timer = setTimeout(() => onHide?.(), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast, onHide]);

  if (!toast) return null;

  return (
    <Animated.View
      key={toast.id}
      entering={FadeInDown.duration(FADE_MS)}
      exiting={FadeOutDown.duration(FADE_MS)}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      testID="toast"
      style={[styles.toast, { bottom }]}
    >
      {toast.icono}
      <Text style={[type.bodySmall, styles.texto]}>{toast.texto}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.bgDark,
    shadowColor: colors.bgDark,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  texto: { color: colors.textOnDark },
});

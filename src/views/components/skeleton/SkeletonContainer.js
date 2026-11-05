import { useEffect } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { ShimmerProvider } from './ShimmerProvider';

/**
 * Envuelve el skeleton de una pantalla: un solo shimmer, anuncia "Cargando…" una vez
 * y oculta los bloques al lector de pantalla.
 */
export function SkeletonContainer({ label, children, style }) {
  useEffect(() => {
    if (label) AccessibilityInfo.announceForAccessibility(label);
  }, [label]);

  return (
    <ShimmerProvider>
      <View accessible accessibilityLabel={label} accessibilityState={{ busy: true }} style={style}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {children}
        </View>
      </View>
    </ShimmerProvider>
  );
}

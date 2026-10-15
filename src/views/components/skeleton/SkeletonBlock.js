import { useRef } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../constants/colors';
import { useShimmer } from './ShimmerProvider';

const BAND = 160;
const RADIUS = { rect: 14, pill: 100, circle: 999 };

/**
 * Bloque base de todos los skeletons.
 * @param {{ width: number|string, height: number, shape?: 'rect'|'pill'|'circle',
 *   radius?: number, tone?: 'light'|'dark', style?: object }} props
 */
export function SkeletonBlock({ width, height, shape = 'rect', radius, tone = 'light', style }) {
  const { progress, reduceMotion } = useShimmer();
  const { width: screenWidth } = useWindowDimensions();
  const ref = useRef(null);
  const pageX = useSharedValue(0);

  // La misma banda cruza toda la pantalla; cada bloque resta su posición X.
  const bandStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * (screenWidth + BAND) - BAND - pageX.value }],
  }));

  const dark = tone === 'dark';
  const base = dark ? colors.skeletonBaseDark : colors.skeletonBase;
  const highlight = dark ? colors.skeletonHighlightDark : colors.skeletonHighlight;

  return (
    <View
      ref={ref}
      onLayout={() =>
        ref.current?.measureInWindow((x) => {
          pageX.value = x;
        })
      }
      style={[
        {
          width,
          height,
          borderRadius: radius ?? RADIUS[shape],
          backgroundColor: base,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {!reduceMotion && (
        <Animated.View style={[styles.band, bandStyle]}>
          <LinearGradient
            colors={['transparent', highlight, 'transparent']}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 1, y: 0.7 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

/**
 * Barra de texto centrada en una caja del alto de la línea real.
 * boxHeight y height son los valores de Figma; se escalan con la letra del sistema.
 */
export function SkeletonLine({ boxHeight, width, height, style }) {
  const { fontScale } = useWindowDimensions();
  return (
    <View style={[{ height: boxHeight * fontScale, justifyContent: 'center' }, style]}>
      <SkeletonBlock shape="pill" width={width} height={height * fontScale} style={styles.fit} />
    </View>
  );
}

const styles = StyleSheet.create({
  band: { position: 'absolute', top: 0, bottom: 0, left: 0, width: BAND },
  fit: { maxWidth: '100%' },
});

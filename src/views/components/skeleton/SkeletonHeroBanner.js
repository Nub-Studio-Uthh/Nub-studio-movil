import { StyleSheet, View } from 'react-native';
import { radius } from '../../../constants/spacing';
import { useLayout } from '../../../constants/layout';
import { SkeletonBlock } from './SkeletonBlock';
import { DOTS_GAP } from '../obra/HeroCarousel';

/** Carrusel de destacadas en carga: mismo tamaño que HeroCarousel (useLayout). */
export function SkeletonHeroBanner() {
  const { banner } = useLayout();
  return (
    <View>
      <View>
        <SkeletonBlock width={banner.width} height={banner.height} radius={radius.card} />
        <View style={[styles.overlay, styles.badge]} />
        <View style={[styles.overlay, styles.title]} />
        <View style={[styles.overlay, styles.meta]} />
      </View>
      <View style={styles.dots}>
        <SkeletonBlock shape="circle" width={8} height={8} />
        <SkeletonBlock shape="circle" width={6} height={6} />
        <SkeletonBlock shape="circle" width={6} height={6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.6)' },
  badge: { top: 10, left: 19, width: 89, height: 20 },
  title: { left: 21, bottom: 42, width: '55%', height: 20 },
  meta: { left: 19, bottom: 22, width: '43%', height: 10 },
  dots: {
    marginTop: DOTS_GAP,
    height: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
});

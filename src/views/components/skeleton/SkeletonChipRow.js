import { ScrollView, StyleSheet } from 'react-native';
import { radius } from '../../../constants/spacing';
import { SkeletonBlock } from './SkeletonBlock';

export const CHIPS_COLECCIONES = [138, 93, 93];
export const CHIPS_CATEGORIAS = [70, 85, 78, 100];

/** Fila de chips en carga (36 de alto, separación 8). */
export function SkeletonChipRow({ widths = CHIPS_COLECCIONES, style }) {
  return (
    <ScrollView
      horizontal
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, style]}
    >
      {widths.map((w, i) => (
        <SkeletonBlock key={i} shape="pill" width={w} height={36} radius={radius.chip} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8 },
});

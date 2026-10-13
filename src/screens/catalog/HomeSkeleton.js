import { StyleSheet, View } from 'react-native';
import { GRID_GAP } from '../../constants/layout';
import {
  CHIPS_COLECCIONES,
  SkeletonChipRow,
  SkeletonContainer,
  SkeletonHeroBanner,
  SkeletonObraCard,
} from '../../components/skeleton';
import { HomeSection } from './HomeSection';

/**
 * Inicio en carga: banner, chips de colecciones y 2 tarjetas.
 * Los títulos de sección son reales (no vienen del backend).
 */
export function HomeSkeleton({ onVerColecciones, onVerCatalogo }) {
  return (
    <SkeletonContainer label="Cargando obras destacadas">
      <SkeletonHeroBanner />
      <HomeSection title="Colecciones" actionLabel="Ver todas" onAction={onVerColecciones}>
        <SkeletonChipRow widths={CHIPS_COLECCIONES} />
      </HomeSection>
      <HomeSection title="Recién agregadas" actionLabel="Ver catálogo" onAction={onVerCatalogo}>
        <View style={styles.cards}>
          <SkeletonObraCard variant="inicio" />
          <SkeletonObraCard variant="inicio" />
        </View>
      </HomeSection>
    </SkeletonContainer>
  );
}

const styles = StyleSheet.create({
  cards: { flexDirection: 'row', gap: GRID_GAP },
});

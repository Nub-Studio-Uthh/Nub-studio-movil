import { StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  GRID_GAP,
  GRID_ROW_GAP,
  SCREEN_MARGIN,
  itemsToFill,
  useLayout,
} from '../../../constants/layout';
import {
  CHIPS_CATEGORIAS,
  SkeletonChipRow,
  SkeletonContainer,
  SkeletonLine,
  SkeletonObraCard,
} from '../../components/skeleton';
import { CatalogListHeader } from '../../components/catalog/CatalogListHeader';

/**
 * Catálogo en carga: chips, conteo y las tarjetas que llenan la pantalla (mínimo 4).
 * El título, el buscador, el filtro y el orden son reales y van fuera de este componente.
 */
export function CatalogSkeleton({ sort, topOffset = 260 }) {
  const { card } = useLayout();
  const { height } = useWindowDimensions();
  const filas = itemsToFill(height - topOffset, card.height.catalogo, GRID_ROW_GAP, 2);

  return (
    <SkeletonContainer label="Cargando obras" style={styles.screen}>
      <CatalogListHeader
        chips={
          <SkeletonChipRow widths={CHIPS_CATEGORIAS} style={{ paddingHorizontal: SCREEN_MARGIN }} />
        }
        count={<SkeletonLine boxHeight={16} width={52} height={10} />}
        sort={sort}
      />
      <View style={styles.grid}>
        {Array.from({ length: filas * 2 }, (_, i) => (
          <SkeletonObraCard key={i} variant="catalogo" />
        ))}
      </View>
    </SkeletonContainer>
  );
}

/** Dos tarjetas al final de la lista mientras llega la siguiente página. */
export function CatalogPagingSkeleton() {
  return (
    <SkeletonContainer label="Cargando más obras" style={styles.paging}>
      <View style={styles.grid}>
        <SkeletonObraCard variant="catalogo" />
        <SkeletonObraCard variant="catalogo" />
      </View>
    </SkeletonContainer>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: SCREEN_MARGIN },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: GRID_GAP, rowGap: GRID_ROW_GAP },
  paging: { paddingTop: GRID_ROW_GAP },
});

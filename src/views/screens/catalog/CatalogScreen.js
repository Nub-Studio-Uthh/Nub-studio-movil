import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SearchX, SlidersHorizontal } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { type } from '../../../constants/typography';
import { CARD_SPRING_MS, FADE_MS, STAGGER_MS } from '../../../constants/animations';
import { GRID_GAP, GRID_ROW_GAP, SCREEN_MARGIN } from '../../../constants/layout';
import { useCatalogViewModel } from '../../../viewmodels/useCatalogViewModel';
import { ObraCard } from '../../components/obra/ObraCard';
import { CategoryChips } from '../../components/catalog/CategoryChips';
import { CatalogListHeader } from '../../components/catalog/CatalogListHeader';
import { SortSelector } from '../../components/catalog/SortSelector';
import { SearchInput } from '../../components/ui/SearchInput';
import { IconButton } from '../../components/ui/IconButton';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import { CHIPS_CATEGORIAS, ShimmerProvider, SkeletonChipRow } from '../../components/skeleton';
import { CatalogPagingSkeleton, CatalogSkeleton } from './CatalogSkeleton';

const ANIMADAS = 4; // solo entran animadas las primeras tarjetas visibles

export function CatalogScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    filtros,
    obras,
    categorias,
    showSkeleton,
    texto,
    setTexto,
    limpiar,
    cambiarOrden,
    elegirCategoria,
    nFiltros,
    hayFiltros,
  } = useCatalogViewModel();

  const abrirObra = useCallback(
    (obra) => navigation.navigate('DetalleObra', { id: obra.id, slug: obra.slug }),
    [navigation]
  );

  const sort = <SortSelector value={filtros.ordenar} onChange={cambiarOrden} />;

  const renderItem = useCallback(
    ({ item, index }) => {
      const card = (
        <ObraCard
          obra={item}
          variant="catalogo"
          onPress={abrirObra}
          testID={`obra-card-${index}`}
        />
      );
      if (index >= ANIMADAS) return card;
      return (
        <Animated.View
          entering={FadeInDown.springify()
            .duration(CARD_SPRING_MS)
            .delay(index * STAGGER_MS)}
        >
          {card}
        </Animated.View>
      );
    },
    [abrirObra]
  );

  const header = (
    <CatalogListHeader
      chips={
        categorias.isLoading ? (
          <ShimmerProvider>
            <SkeletonChipRow widths={CHIPS_CATEGORIAS} style={styles.chipsPadding} />
          </ShimmerProvider>
        ) : (
          <CategoryChips
            categorias={categorias.data}
            seleccionada={filtros.categoria}
            onSelect={elegirCategoria}
            contentStyle={styles.chipsPadding}
          />
        )
      }
      count={
        <Text style={[type.metaBold, { color: colors.textSecondary }]} testID="total-obras">
          {obras.total === 1 ? '1 obra' : `${obras.total} obras`}
        </Text>
      }
      sort={sort}
    />
  );

  let body;
  if (showSkeleton) {
    body = <CatalogSkeleton sort={sort} />;
  } else if (obras.isLoading) {
    body = null; // menos de 150 ms: solo el encabezado real, sin parpadeo
  } else if (obras.status === 'error') {
    body = (
      <ErrorState
        title="No pudimos cargar las obras"
        message={obras.error}
        onRetry={obras.reload}
        style={styles.state}
      />
    );
  } else {
    body = (
      <Animated.View entering={FadeIn.duration(FADE_MS)} style={styles.flex}>
        <FlatList
          testID="catalogo-lista"
          data={obras.items}
          keyExtractor={(o) => String(o.id)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.column}
          ItemSeparatorComponent={RowGap}
          ListHeaderComponent={header}
          ListEmptyComponent={
            hayFiltros ? (
              <EmptyState
                Icon={SearchX}
                title="No hay obras con esos filtros"
                message="Prueba con otra categoría, cambia la búsqueda o ajusta el rango de precio."
                actionLabel="Limpiar filtros"
                actionVariant="ghost"
                onAction={limpiar}
                testID="catalogo-vacio"
              />
            ) : (
              <EmptyState
                Icon={SearchX}
                title="Aún no hay obras publicadas"
                message="Vuelve pronto para descubrir nuevas piezas."
                testID="catalogo-vacio"
              />
            )
          }
          ListFooterComponent={
            <Footer
              loadingMore={obras.loadingMore}
              loadMoreError={obras.loadMoreError}
              onRetry={obras.retryMore}
              fin={!obras.hasMore && obras.items.length > 0}
              total={obras.total}
              mostradas={obras.items.length}
              hayMas={obras.hasMore}
              onVerMas={obras.loadMore}
            />
          }
          onEndReached={obras.loadMore}
          onEndReachedThreshold={0.6}
          refreshControl={
            <RefreshControl
              refreshing={obras.refreshing}
              onRefresh={obras.refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          removeClippedSubviews
        />
      </Animated.View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={[type.screenTitle, styles.title]} accessibilityRole="header">
          Catálogo
        </Text>
        <View style={styles.searchRow}>
          <SearchInput value={texto} onChangeText={setTexto} testID="buscar-obras" />
          <IconButton
            size={48}
            variant="dark"
            label={nFiltros ? `Filtros, ${nFiltros} activos` : 'Filtros'}
            onPress={() => navigation.navigate('Filtros')}
            testID="abrir-filtros"
            icon={<SlidersHorizontal size={20} color={colors.textOnDark} />}
            badge={
              nFiltros ? (
                <View style={styles.badge}>
                  <Text style={[type.badge, styles.badgeText]}>{nFiltros}</Text>
                </View>
              ) : null
            }
          />
        </View>
      </View>
      <View style={styles.flex}>{body}</View>
    </View>
  );
}

function RowGap() {
  return <View style={{ height: GRID_ROW_GAP }} />;
}

// Pie de la lista: al bajar se cargan solas las siguientes obras (12 por página). Para que se
// note que hay más, se muestra "Mostrando 12 de 17" y un botón "Ver más obras".
function Footer({ loadingMore, loadMoreError, onRetry, fin, total, mostradas, hayMas, onVerMas }) {
  if (loadingMore) return <CatalogPagingSkeleton />;
  if (loadMoreError) {
    return (
      <View style={styles.pagingError} testID="error-paginacion">
        <Text style={[type.bodySmall, styles.pagingErrorText]}>
          No se pudieron cargar más obras.
        </Text>
        <Button label="Reintentar" variant="ghost" compact onPress={onRetry} />
      </View>
    );
  }
  if (hayMas && mostradas > 0) {
    return (
      <View style={styles.mas} testID="paginacion">
        <Text style={[type.caption, styles.finTexto]}>
          Mostrando {mostradas} de {total} obras
        </Text>
        <Button label="Ver más obras" variant="ghost" compact onPress={onVerMas} testID="ver-mas" />
      </View>
    );
  }
  if (fin) {
    return (
      <Text style={[type.caption, styles.finTexto]} testID="fin-catalogo">
        {total === 1 ? 'Esta es la única obra' : `Ya viste las ${total} obras`}
      </Text>
    );
  }
  return <View style={{ height: 24 }} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen },
  flex: { flex: 1 },
  header: { paddingHorizontal: SCREEN_MARGIN, paddingBottom: 16, gap: 16 },
  title: { color: colors.textPrimary, textAlign: 'center' },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.textOnDark, letterSpacing: 0 },
  chipsPadding: { paddingHorizontal: SCREEN_MARGIN },
  list: { paddingHorizontal: SCREEN_MARGIN, paddingBottom: 24, flexGrow: 1 },
  column: { gap: GRID_GAP },
  state: { flex: 1, justifyContent: 'center' },
  pagingError: {
    marginTop: GRID_ROW_GAP,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingLeft: 16,
    borderRadius: 20,
    backgroundColor: colors.bgSurface,
  },
  finTexto: { color: colors.textMuted, textAlign: 'center', paddingTop: 16, paddingBottom: 24 },
  mas: { alignItems: 'center', gap: 4, paddingBottom: 24 },
  pagingErrorText: { flex: 1, color: colors.textSecondary },
});

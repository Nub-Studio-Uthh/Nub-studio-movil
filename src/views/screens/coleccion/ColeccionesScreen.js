import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Layers } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { type } from '../../../constants/typography';
import { CARD_SPRING_MS, FADE_MS, STAGGER_MS } from '../../../constants/animations';
import { SCREEN_MARGIN } from '../../../constants/layout';
import { useColeccionesViewModel } from '../../../viewmodels/useColeccionesViewModel';
import { ColeccionCard } from '../../components/coleccion/ColeccionCard';
import { IconButton } from '../../components/ui/IconButton';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import { ColeccionesSkeleton } from './ColeccionesSkeleton';

const ANIMADAS = 5; // solo entran animadas las primeras tarjetas visibles
const SEPARACION = 16;

/**
 * Colecciones (HU-04): colecciones temáticas publicadas, como en el prototipo.
 * Cada tarjeta abre el detalle con su historia y sus obras. Pública: no requiere sesión.
 */
export function ColeccionesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const vm = useColeccionesViewModel();

  const abrir = useCallback(
    (coleccion) => navigation.navigate('Coleccion', { slug: coleccion.slug, coleccion }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item, index }) => {
      const card = (
        <ColeccionCard coleccion={item} onPress={abrir} testID={`coleccion-tarjeta-${index}`} />
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
    [abrir]
  );

  let body;
  if (vm.showSkeleton) {
    body = <ColeccionesSkeleton />;
  } else if (vm.esperando) {
    body = null; // menos de 150 ms: sin skeleton para no parpadear
  } else if (vm.status === 'error') {
    body = (
      <ErrorState
        title="No pudimos cargar las colecciones"
        message={vm.error}
        onRetry={vm.reload}
        style={styles.state}
      />
    );
  } else {
    body = (
      <Animated.View entering={FadeIn.duration(FADE_MS)} style={styles.flex}>
        <FlatList
          data={vm.colecciones}
          keyExtractor={(c) => String(c.id ?? c.slug)}
          renderItem={renderItem}
          ItemSeparatorComponent={Separador}
          ListEmptyComponent={
            <EmptyState
              Icon={Layers}
              title="Aún no hay colecciones"
              message="Pronto los artistas agruparán sus obras por tema, técnica o región."
              testID="colecciones-vacio"
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={vm.refreshing}
              onRefresh={vm.refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={[styles.list, { paddingBottom: 32 + insets.bottom }]}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          removeClippedSubviews
          testID="colecciones-lista"
        />
      </Animated.View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <IconButton
          label="Regresar"
          round
          onPress={() => navigation.goBack()}
          icon={<ArrowLeft size={20} color={colors.textPrimary} strokeWidth={1.5} />}
          testID="colecciones-regresar"
        />
        <Text style={[type.screenTitle, styles.title]} accessibilityRole="header">
          Colecciones
        </Text>
      </View>
      <View style={styles.flex}>{body}</View>
    </View>
  );
}

function Separador() {
  return <View style={{ height: SEPARACION }} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: SCREEN_MARGIN,
    paddingBottom: 20,
  },
  title: { flex: 1, color: colors.textPrimary },
  list: { paddingHorizontal: SCREEN_MARGIN, paddingBottom: 32, flexGrow: 1 },
  state: { flex: 1, justifyContent: 'center' },
});

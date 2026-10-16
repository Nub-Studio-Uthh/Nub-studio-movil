import { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, ImageOff, UserX } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { type } from '../../../constants/typography';
import { CARD_SPRING_MS, FADE_MS, STAGGER_MS } from '../../../constants/animations';
import { GRID_GAP, GRID_ROW_GAP, SCREEN_MARGIN } from '../../../constants/layout';
import { usePerfilArtistaViewModel } from '../../../viewmodels/usePerfilArtistaViewModel';
import { ArtistaHeader } from '../../components/artist/ArtistaHeader';
import { ObraCard } from '../../components/obra/ObraCard';
import { IconButton } from '../../components/ui/IconButton';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import { PerfilArtistaSkeleton } from './PerfilArtistaSkeleton';

const ANIMADAS = 4; // solo entran animadas las primeras tarjetas visibles

/**
 * Perfil de artista (HU-03). Recibe { id } por parámetro de ruta (desde el detalle de obra).
 * Muestra los datos públicos del artista y sus obras publicadas; cada obra abre su detalle.
 */
export function PerfilArtistaScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { id } = route?.params ?? {};
  const {
    artista,
    obras,
    iniciales,
    totalObras,
    totalColecciones,
    esperando,
    showSkeleton,
    error,
    noEncontrado,
    reload,
  } = usePerfilArtistaViewModel(id);

  const abrirObra = useCallback(
    (obra) => navigation.navigate('DetalleObra', { id: obra.id, slug: obra.slug }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item, index }) => {
      const card = (
        <ObraCard
          obra={item}
          variant="catalogo"
          onPress={abrirObra}
          testID={`perfil-obra-${index}`}
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

  let body;
  if (showSkeleton) {
    body = <PerfilArtistaSkeleton />;
  } else if (esperando) {
    body = null; // menos de 150 ms: sin skeleton para no parpadear
  } else if (noEncontrado) {
    body = (
      <EmptyState
        Icon={UserX}
        title="Este artista no está disponible"
        message="Es posible que ya no forme parte de NU-B Studio."
        actionLabel="Regresar"
        actionVariant="ghost"
        onAction={() => navigation.goBack()}
        testID="perfil-no-encontrado"
        style={styles.state}
      />
    );
  } else if (error || !artista) {
    body = (
      <ErrorState
        title="No pudimos cargar el perfil"
        message={error}
        onRetry={reload}
        style={styles.state}
      />
    );
  } else {
    body = (
      <Animated.View entering={FadeIn.duration(FADE_MS)} style={styles.flex}>
        <FlatList
          data={obras}
          keyExtractor={(o) => String(o.id)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.column}
          ItemSeparatorComponent={RowGap}
          ListHeaderComponent={
            <View>
              <ArtistaHeader
                artista={artista}
                iniciales={iniciales}
                totalObras={totalObras}
                totalColecciones={totalColecciones}
              />
              <Text style={[type.section, styles.seccion]} accessibilityRole="header">
                Sus obras
              </Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              Icon={ImageOff}
              title="Aún no tiene obras publicadas"
              message="Vuelve pronto para descubrir su trabajo."
              testID="perfil-sin-obras"
            />
          }
          contentContainerStyle={styles.list}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          removeClippedSubviews
          testID="perfil-lista"
        />
      </Animated.View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topRow}>
        <IconButton
          label="Regresar"
          round
          onPress={() => navigation.goBack()}
          icon={<ArrowLeft size={20} color={colors.textPrimary} strokeWidth={1.5} />}
          testID="perfil-regresar"
        />
      </View>
      <View style={styles.flex}>{body}</View>
    </View>
  );
}

function RowGap() {
  return <View style={{ height: GRID_ROW_GAP }} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen },
  flex: { flex: 1 },
  topRow: { paddingHorizontal: SCREEN_MARGIN, paddingBottom: 8, flexDirection: 'row' },
  list: { paddingHorizontal: SCREEN_MARGIN, paddingBottom: 32, flexGrow: 1 },
  column: { gap: GRID_GAP },
  seccion: { color: colors.textPrimary, marginTop: 28, marginBottom: 12 },
  state: { flex: 1, justifyContent: 'center' },
});

import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BookOpen, Search, SearchX } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { fonts, type } from '../../../constants/typography';
import { CARD_SPRING_MS, FADE_MS, STAGGER_MS } from '../../../constants/animations';
import { GRID_GAP, SCREEN_MARGIN } from '../../../constants/layout';
import { useHomeViewModel } from '../../../viewmodels/useHomeViewModel';
import { HeroCarousel } from '../../components/obra/HeroCarousel';
import { ObraCard } from '../../components/obra/ObraCard';
import { Chip } from '../../components/ui/Chip';
import { IconButton } from '../../components/ui/IconButton';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import { HomeSection } from './HomeSection';
import { HomeSkeleton } from './HomeSkeleton';

/**
 * Inicio (HU-01): obras destacadas, colecciones y obras recientes, con acceso al catálogo.
 * Pública: no requiere sesión.
 */
export function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    destacadas,
    recientes,
    colecciones,
    showSkeleton,
    esperando,
    refrescando,
    fallaronTodas,
    sinObras,
    recargarTodo,
    refrescar,
  } = useHomeViewModel();

  const abrirObra = useCallback(
    (obra) => navigation.navigate('DetalleObra', { id: obra.id, slug: obra.slug }),
    [navigation]
  );
  const verCatalogo = useCallback(() => navigation.navigate('Catalogo'), [navigation]);
  const verColecciones = useCallback(() => navigation.navigate('Colecciones'), [navigation]);

  let body;
  if (showSkeleton) {
    body = <HomeSkeleton onVerColecciones={verColecciones} onVerCatalogo={verCatalogo} />;
  } else if (esperando) {
    body = null; // menos de 150 ms: sin skeleton para no parpadear
  } else if (fallaronTodas) {
    body = (
      <ErrorState
        title="No pudimos cargar el inicio"
        message={destacadas.error}
        onRetry={recargarTodo}
      />
    );
  } else if (sinObras) {
    body = (
      <EmptyState
        Icon={SearchX}
        title="Aún no hay obras publicadas"
        message="Vuelve pronto para descubrir nuevas piezas de arte huasteco."
        testID="inicio-vacio"
      />
    );
  } else {
    body = (
      <Animated.View entering={FadeIn.duration(FADE_MS)}>
        {destacadas.data.length ? (
          <HeroCarousel obras={destacadas.data} onPress={abrirObra} />
        ) : null}

        {colecciones.data.length ? (
          <HomeSection
            title="Colecciones"
            actionLabel="Ver todas"
            onAction={verColecciones}
            actionTestID="ver-colecciones"
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              style={styles.bleed}
            >
              {colecciones.data.map((c) => (
                <Chip
                  key={c.id}
                  label={c.nombre}
                  onPress={() => navigation.navigate('Coleccion', { slug: c.slug })}
                  testID={`coleccion-${c.slug || c.id}`}
                />
              ))}
            </ScrollView>
          </HomeSection>
        ) : null}

        <HomeSection
          title="Recién agregadas"
          actionLabel="Ver catálogo"
          onAction={verCatalogo}
          actionTestID="ver-catalogo"
          gap={11}
        >
          {recientes.error ? (
            <ErrorState
              title="No pudimos cargar las obras recientes"
              onRetry={recientes.reload}
              testID="error-recientes"
            />
          ) : (
            <View style={styles.cards}>
              {recientes.data.map((obra, index) => (
                <Animated.View
                  key={obra.id}
                  entering={FadeInDown.springify()
                    .duration(CARD_SPRING_MS)
                    .delay(index * STAGGER_MS)}
                >
                  <ObraCard
                    obra={obra}
                    variant="inicio"
                    onPress={abrirObra}
                    testID={`reciente-${index}`}
                  />
                </Animated.View>
              ))}
            </View>
          )}
        </HomeSection>
      </Animated.View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={refrescar}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.topRow}>
        <IconButton
          label="Blog"
          onPress={() => navigation.navigate('Blog')}
          icon={<BookOpen size={20} color={colors.textPrimary} strokeWidth={1.5} />}
          testID="abrir-blog"
        />
        <Text style={styles.greeting}>¡Hola!</Text>
        <IconButton
          label="Buscar en el catálogo"
          onPress={verCatalogo}
          icon={<Search size={20} color={colors.textPrimary} strokeWidth={1.5} />}
          testID="buscar-inicio"
        />
      </View>
      <Text style={[type.hero, styles.hero]} accessibilityRole="header">
        Descubre arte huasteco
      </Text>
      <View style={styles.body}>{body}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen },
  content: { paddingHorizontal: SCREEN_MARGIN, paddingBottom: 24, flexGrow: 1 },
  topRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: { fontFamily: fonts.numeric, fontSize: 16, color: colors.textSecondary },
  hero: { color: colors.textPrimary, textAlign: 'center', marginTop: 1 },
  body: { marginTop: 21, flexGrow: 1 },
  bleed: { marginHorizontal: -SCREEN_MARGIN },
  chips: { gap: 8, paddingHorizontal: SCREEN_MARGIN },
  cards: { flexDirection: 'row', gap: GRID_GAP },
});

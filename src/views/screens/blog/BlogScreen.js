import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, BookOpen } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { type } from '../../../constants/typography';
import { CARD_SPRING_MS, FADE_MS, STAGGER_MS } from '../../../constants/animations';
import { SCREEN_MARGIN } from '../../../constants/layout';
import { useBlogViewModel } from '../../../viewmodels/useBlogViewModel';
import { PostCard } from '../../components/blog/PostCard';
import { IconButton } from '../../components/ui/IconButton';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import { BlogSkeleton, SkeletonFila } from './BlogSkeleton';
import { SkeletonContainer } from '../../components/skeleton';

const ANIMADAS = 4; // solo entran animadas las primeras tarjetas visibles
const SEPARACION = 16;

/**
 * Blog (HU-05): publicaciones de la más reciente a la más antigua. La primera se muestra
 * grande y las demás en filas, como en el prototipo. Pública: no requiere sesión.
 */
export function BlogScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const posts = useBlogViewModel();
  const { showSkeleton } = posts;

  const abrirPost = useCallback(
    (post) => navigation.navigate('Publicacion', { slug: post.slug, post }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item, index }) => {
      const card = (
        <PostCard
          post={item}
          variant={index === 0 ? 'destacada' : 'fila'}
          onPress={abrirPost}
          testID={`blog-post-${index}`}
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
    [abrirPost]
  );

  let body;
  if (showSkeleton) {
    body = <BlogSkeleton />;
  } else if (posts.esperando) {
    body = null; // menos de 150 ms: sin skeleton para no parpadear
  } else if (posts.status === 'error') {
    body = (
      <ErrorState
        title="No pudimos cargar el blog"
        message={posts.error}
        onRetry={posts.reload}
        style={styles.state}
      />
    );
  } else {
    body = (
      <Animated.View entering={FadeIn.duration(FADE_MS)} style={styles.flex}>
        <FlatList
          data={posts.posts}
          keyExtractor={(p) => String(p.id)}
          renderItem={renderItem}
          ItemSeparatorComponent={Separador}
          ListEmptyComponent={
            <EmptyState
              Icon={BookOpen}
              title="Aún no hay publicaciones"
              message="Pronto compartiremos historias sobre el arte huasteco, sus artistas y sus tradiciones."
              testID="blog-vacio"
            />
          }
          ListFooterComponent={
            <Footer
              loadingMore={posts.loadingMore}
              loadMoreError={posts.loadMoreError}
              onRetry={posts.retryMore}
            />
          }
          onEndReached={posts.loadMore}
          onEndReachedThreshold={0.6}
          refreshControl={
            <RefreshControl
              refreshing={posts.refreshing}
              onRefresh={posts.refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={styles.list}
          initialNumToRender={5}
          maxToRenderPerBatch={6}
          windowSize={7}
          removeClippedSubviews
          testID="blog-lista"
        />
      </Animated.View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <IconButton
          label="Regresar"
          onPress={() => navigation.goBack()}
          icon={<ArrowLeft size={20} color={colors.textPrimary} strokeWidth={1.5} />}
          testID="blog-regresar"
        />
        <Text style={[type.screenTitle, styles.title]} accessibilityRole="header">
          Blog
        </Text>
        <Text style={[type.body, styles.subtitle]}>Historias del arte huasteco</Text>
      </View>
      <View style={styles.flex}>{body}</View>
    </View>
  );
}

function Separador() {
  return <View style={{ height: SEPARACION }} />;
}

function Footer({ loadingMore, loadMoreError, onRetry }) {
  if (loadingMore) {
    return (
      <SkeletonContainer label="Cargando más publicaciones" style={styles.paging}>
        <SkeletonFila />
      </SkeletonContainer>
    );
  }
  if (loadMoreError) {
    return (
      <View style={styles.pagingError} testID="error-paginacion">
        <Text style={[type.bodySmall, styles.pagingErrorText]}>
          No se pudieron cargar más publicaciones.
        </Text>
        <Button label="Reintentar" variant="ghost" compact onPress={onRetry} />
      </View>
    );
  }
  return <View style={{ height: 24 }} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen },
  flex: { flex: 1 },
  header: { paddingHorizontal: SCREEN_MARGIN, paddingBottom: 16 },
  title: { color: colors.textPrimary, marginTop: 12 },
  subtitle: { color: colors.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: SCREEN_MARGIN, paddingBottom: 24, flexGrow: 1 },
  state: { flex: 1, justifyContent: 'center' },
  paging: { paddingTop: SEPARACION },
  pagingError: {
    marginTop: SEPARACION,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingLeft: 16,
    borderRadius: 20,
    backgroundColor: colors.bgSurface,
  },
  pagingErrorText: { flex: 1, color: colors.textSecondary },
});

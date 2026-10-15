import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ArrowLeft, FileX } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { fonts, type } from '../../../constants/typography';
import { radius } from '../../../constants/spacing';
import { FADE_MS } from '../../../constants/animations';
import { DETAIL_MARGIN } from '../../../constants/layout';
import { usePostViewModel } from '../../../viewmodels/usePostViewModel';
import { PostImagen } from '../../components/blog/PostImagen';
import { ContenidoPost } from '../../components/blog/ContenidoPost';
import { Badge } from '../../components/ui/Badge';
import { IconButton } from '../../components/ui/IconButton';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import { SkeletonContainer, SkeletonLine } from '../../components/skeleton';

const HERO = 300 / 844; // alto de la imagen / alto de la pantalla en el prototipo
const LINEAS_CARGA = ['100%', '96%', '100%', '88%', '70%', '100%', '92%', '60%'];

/**
 * Publicación (HU-05): imagen, categoría, título, autor, fecha, tiempo de lectura
 * y el contenido con sus imágenes. Mientras carga se muestra lo que ya venía de la lista.
 */
export function PostScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const slug = route?.params?.slug ?? '';
  const previa = route?.params?.post ?? null;
  const {
    post: datos,
    contenido,
    error,
    noEncontrado,
    showSkeleton,
    sinDatos,
    iniciales,
    meta,
    reload,
  } = usePostViewModel(slug, previa);
  const contenidoAncho = width - 2 * DETAIL_MARGIN;

  const regresar = (
    <IconButton
      label="Regresar"
      round
      onPress={() => navigation.goBack()}
      icon={<ArrowLeft size={20} color={colors.textPrimary} strokeWidth={1.5} />}
      testID="post-regresar"
    />
  );

  if (sinDatos) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <View style={[styles.floating, { top: insets.top + 8 }]}>{regresar}</View>
        {noEncontrado ? (
          <EmptyState
            Icon={FileX}
            title="Esta publicación ya no está disponible"
            message="Es posible que se haya retirado del blog."
            actionLabel="Ver el blog"
            actionVariant="ghost"
            onAction={() => navigation.goBack()}
            testID="post-no-encontrado"
          />
        ) : (
          <ErrorState title="No pudimos cargar la publicación" message={error} onRetry={reload} />
        )}
      </View>
    );
  }

  let cuerpo;
  if (contenido) {
    cuerpo = (
      <Animated.View entering={FadeIn.duration(FADE_MS)}>
        <ContenidoPost html={contenido} width={contenidoAncho} />
      </Animated.View>
    );
  } else if (error && noEncontrado) {
    cuerpo = (
      <EmptyState
        Icon={FileX}
        title="Esta publicación ya no está disponible"
        message="Es posible que se haya retirado del blog."
        testID="post-no-encontrado"
      />
    );
  } else if (error) {
    cuerpo = <ErrorState title="No pudimos cargar el texto" message={error} onRetry={reload} />;
  } else if (showSkeleton) {
    cuerpo = (
      <SkeletonContainer label="Cargando publicación" style={styles.lineas}>
        {LINEAS_CARGA.map((w, i) => (
          <SkeletonLine key={i} boxHeight={24} width={w} height={12} />
        ))}
      </SkeletonContainer>
    );
  } else {
    cuerpo = null;
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} testID="post-scroll">
        <PostImagen
          uri={datos?.imagen}
          width={width}
          height={Math.round(height * HERO) + 28}
          radius={0}
          recyclingKey={String(datos?.id ?? slug)}
        />
        <View style={styles.sheet}>
          {datos?.categoria ? <Badge label={datos.categoria} tone="oferta" /> : null}
          <Text style={styles.title} accessibilityRole="header" testID="post-titulo">
            {datos?.titulo}
          </Text>
          <View style={styles.autor}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{iniciales}</Text>
            </View>
            <View style={styles.autorTexts}>
              <Text style={[type.cardTitle, styles.autorNombre]} numberOfLines={1}>
                {datos?.autor}
              </Text>
              {meta ? (
                <Text style={[type.meta, styles.muted]} testID="post-meta">
                  {meta}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.cuerpo}>{cuerpo}</View>
        </View>
      </ScrollView>
      <View style={[styles.floating, { top: insets.top + 8 }]}>{regresar}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen },
  center: { justifyContent: 'center' },
  scroll: { paddingBottom: 40 },
  floating: { position: 'absolute', left: 16 },
  sheet: {
    marginTop: -28,
    borderTopLeftRadius: radius.cardLarge,
    borderTopRightRadius: radius.cardLarge,
    backgroundColor: colors.bgScreen,
    paddingHorizontal: DETAIL_MARGIN,
    paddingTop: 24,
    gap: 14,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  autor: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.avatar,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bold, fontSize: 14, color: colors.textOnDark },
  autorTexts: { flex: 1, gap: 2 },
  autorNombre: { color: colors.textPrimary },
  muted: { color: colors.textMuted },
  cuerpo: { marginTop: 10 },
  lineas: { gap: 4 },
});

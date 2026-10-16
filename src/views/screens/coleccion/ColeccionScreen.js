import { useCallback } from 'react';
import {
  FlatList,
  PixelRatio,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { ArrowLeft, ChevronRight, ImageOff, Layers } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { fonts, type } from '../../../constants/typography';
import { radius } from '../../../constants/spacing';
import { CARD_SPRING_MS, FADE_MS, STAGGER_MS } from '../../../constants/animations';
import { GRID_GAP, GRID_ROW_GAP, SCREEN_MARGIN } from '../../../constants/layout';
import { imagenSegura } from '../../../utils/obras';
import { useColeccionViewModel } from '../../../viewmodels/useColeccionViewModel';
import { PostImagen } from '../../components/blog/PostImagen';
import { ObraCard } from '../../components/obra/ObraCard';
import { Badge } from '../../components/ui/Badge';
import { IconButton } from '../../components/ui/IconButton';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import { ColeccionSkeleton, ObrasColeccionSkeleton } from './ColeccionesSkeleton';

const PORTADA = 0.62; // alto / ancho de la portada
const AVATAR = 40;
const ANIMADAS = 4; // solo entran animadas las primeras tarjetas visibles

/**
 * Detalle de colección (HU-04): portada, nombre, artista, su historia y sus obras
 * publicadas en cuadrícula de 2; cada obra abre su detalle y el artista abre su perfil.
 * Recibe { slug, coleccion? } por parámetro de ruta (desde Colecciones o Inicio).
 */
export function ColeccionScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const slug = route?.params?.slug ?? '';
  const previa = route?.params?.coleccion ?? null;
  const vm = useColeccionViewModel(slug, previa);
  const { coleccion } = vm;
  const portadaAlto = Math.round(width * PORTADA) + 28;

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
          testID={`coleccion-obra-${index}`}
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

  const regresar = (
    <IconButton
      label="Regresar"
      round
      onPress={() => navigation.goBack()}
      icon={<ArrowLeft size={20} color={colors.textPrimary} strokeWidth={1.5} />}
      testID="coleccion-regresar"
    />
  );

  // Sin colección que mostrar: ya no existe o falló la carga sin datos previos.
  if (vm.noEncontrado || vm.sinDatos) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <View style={[styles.floating, { top: insets.top + 8 }]}>{regresar}</View>
        {vm.noEncontrado ? (
          <EmptyState
            Icon={Layers}
            title="Esta colección ya no está disponible"
            message="Es posible que el artista la haya retirado."
            actionLabel="Regresar"
            actionVariant="ghost"
            onAction={() => navigation.goBack()}
            testID="coleccion-no-encontrada"
          />
        ) : (
          <ErrorState
            title="No pudimos cargar la colección"
            message={vm.error}
            onRetry={vm.reload}
          />
        )}
      </View>
    );
  }

  // Sin datos de la lista: skeleton de toda la pantalla (nada en los primeros 150 ms).
  if (!coleccion) {
    return (
      <View style={styles.screen}>
        {vm.showSkeleton ? <ColeccionSkeleton portadaAlto={portadaAlto} /> : null}
        <View style={[styles.floating, { top: insets.top + 8 }]}>{regresar}</View>
      </View>
    );
  }

  let vacio;
  if (vm.obrasCargadas) {
    vacio = (
      <EmptyState
        Icon={ImageOff}
        title="Aún no tiene obras publicadas"
        message="Vuelve pronto para ver las piezas de esta colección."
        testID="coleccion-sin-obras"
      />
    );
  } else if (vm.error) {
    vacio = (
      <ErrorState title="No pudimos cargar las obras" message={vm.error} onRetry={vm.reload} />
    );
  } else {
    vacio = vm.showSkeleton ? <ObrasColeccionSkeleton /> : null;
  }

  const cabecera = (
    <View>
      <PostImagen
        uri={coleccion.portada}
        width={width}
        height={portadaAlto}
        radius={0}
        recyclingKey={String(coleccion.id ?? slug)}
        style={styles.bleed}
      />
      <View style={[styles.sheet, styles.bleed]}>
        <Badge label="Colección" tone="destacada" />
        <Text style={styles.title} accessibilityRole="header" testID="coleccion-nombre">
          {coleccion.nombre}
        </Text>
        {coleccion.artista ? (
          <ArtistaFila
            coleccion={coleccion}
            iniciales={vm.iniciales}
            totalTexto={vm.totalTexto}
            onPress={
              coleccion.artistaId
                ? () => navigation.navigate('PerfilArtista', { id: coleccion.artistaId })
                : undefined
            }
          />
        ) : null}
        {coleccion.historia ? (
          <Text style={[type.body, styles.historia]} testID="coleccion-historia">
            {coleccion.historia}
          </Text>
        ) : null}
        <Text style={[type.section, styles.seccion]} accessibilityRole="header">
          Obras de la colección
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <Animated.View entering={FadeIn.duration(FADE_MS)} style={styles.flex}>
        <FlatList
          data={vm.obras}
          keyExtractor={(o) => String(o.id)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.column}
          ItemSeparatorComponent={RowGap}
          ListHeaderComponent={cabecera}
          ListEmptyComponent={vacio}
          contentContainerStyle={styles.list}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          removeClippedSubviews
          testID="coleccion-lista"
        />
      </Animated.View>
      <View style={[styles.floating, { top: insets.top + 8 }]}>{regresar}</View>
    </View>
  );
}

/** Artista de la colección: foto (o iniciales), nombre y número de obras. Abre su perfil. */
function ArtistaFila({ coleccion, iniciales, totalTexto, onPress }) {
  const foto = imagenSegura(coleccion.artistaFoto, AVATAR * PixelRatio.get());
  const leido = [`De ${coleccion.artista}`, totalTexto].filter(Boolean).join(', ');
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={leido}
      accessibilityHint={onPress ? 'Abre el perfil del artista' : undefined}
      style={({ pressed }) => [styles.artista, pressed && styles.pressed]}
      testID="coleccion-artista"
    >
      <View style={styles.avatar}>
        {foto ? (
          <Image
            source={{ uri: foto }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Text style={styles.avatarText}>{iniciales}</Text>
        )}
      </View>
      <View style={styles.artistaTexts}>
        <Text style={[type.cardTitle, styles.primary]} numberOfLines={1}>
          {coleccion.artista}
        </Text>
        {totalTexto ? (
          <Text style={[type.meta, styles.muted]} testID="coleccion-total">
            {totalTexto}
          </Text>
        ) : null}
      </View>
      {onPress ? <ChevronRight size={20} color={colors.textMuted} strokeWidth={1.5} /> : null}
    </Pressable>
  );
}

function RowGap() {
  return <View style={{ height: GRID_ROW_GAP }} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen },
  flex: { flex: 1 },
  center: { justifyContent: 'center' },
  floating: { position: 'absolute', left: 16 },
  list: { paddingHorizontal: SCREEN_MARGIN, paddingBottom: 40, flexGrow: 1 },
  column: { gap: GRID_GAP },
  // La portada y la hoja ocupan todo el ancho, fuera del margen de la cuadrícula.
  bleed: { marginHorizontal: -SCREEN_MARGIN },
  sheet: {
    marginTop: -28,
    marginBottom: 12,
    borderTopLeftRadius: radius.cardLarge,
    borderTopRightRadius: radius.cardLarge,
    backgroundColor: colors.bgScreen,
    paddingHorizontal: SCREEN_MARGIN,
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
  artista: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pressed: { opacity: 0.8 },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radius.avatar,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bold, fontSize: 14, color: colors.textOnDark },
  artistaTexts: { flex: 1, gap: 2 },
  primary: { color: colors.textPrimary },
  muted: { color: colors.textMuted },
  historia: { color: colors.textSecondary },
  seccion: { color: colors.textPrimary, marginTop: 10 },
});

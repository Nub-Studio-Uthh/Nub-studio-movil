import { useCallback, useEffect, useRef } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Heart, LogIn } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { type } from '../../../constants/typography';
import { CARD_SPRING_MS, FADE_MS, STAGGER_MS } from '../../../constants/animations';
import { SCREEN_MARGIN } from '../../../constants/layout';
import { useFavoritosViewModel } from '../../../viewmodels/useFavoritosViewModel';
import { FavoritoCard } from '../../components/favorito/FavoritoCard';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import { FavoritosSkeleton } from './FavoritosSkeleton';

const ANIMADAS = 5; // solo entran animadas las primeras tarjetas visibles
const SEPARACION = 16;

/**
 * Favoritos (HU-07): obras guardadas por el cliente, como en el prototipo. Cada tarjeta abre
 * el detalle y el corazón la quita. Sin sesión invita a iniciar sesión.
 * Se recarga al volver a la pestaña, para ver lo agregado desde el detalle de una obra.
 */
export function FavoritosScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const vm = useFavoritosViewModel();
  const { recargarEnSilencio } = vm;

  // La primera carga la hace el ViewModel; al volver a la pestaña se refresca.
  const primeraVez = useRef(true);
  useEffect(() => {
    const unsubscribe = navigation.addListener?.('focus', () => {
      if (primeraVez.current) {
        primeraVez.current = false;
        return;
      }
      recargarEnSilencio();
    });
    return unsubscribe;
  }, [navigation, recargarEnSilencio]);

  const abrir = useCallback(
    (obra) => navigation.navigate('DetalleObra', { id: obra.id, slug: obra.slug }),
    [navigation]
  );

  const { quitar } = vm;
  const onQuitar = useCallback(
    async (obra) => {
      const mensaje = await quitar(obra);
      if (mensaje) Alert.alert('No pudimos quitarla de tus favoritos', mensaje);
    },
    [quitar]
  );

  const renderItem = useCallback(
    ({ item, index }) => {
      const card = (
        <FavoritoCard
          obra={item}
          onPress={abrir}
          onQuitar={onQuitar}
          testID={`favorito-${index}`}
        />
      );
      return (
        <Animated.View
          layout={LinearTransition}
          entering={
            index < ANIMADAS
              ? FadeInDown.springify()
                  .duration(CARD_SPRING_MS)
                  .delay(index * STAGGER_MS)
              : undefined
          }
        >
          {card}
        </Animated.View>
      );
    },
    [abrir, onQuitar]
  );

  const iniciarSesion = () => navigation.navigate('Login', { regresar: true });

  let body;
  if (vm.vista === 'invitado') {
    body = (
      <EmptyState
        Icon={Heart}
        tone="primary"
        title="Guarda las obras que te gustan"
        message="Inicia sesión para guardar obras y encontrarlas aquí cuando quieras."
        actionLabel="Iniciar sesión"
        onAction={iniciarSesion}
        testID="favoritos-invitado"
        style={styles.state}
      />
    );
  } else if (vm.vista === 'sin-permiso') {
    body = (
      <EmptyState
        Icon={Heart}
        title="Favoritos no disponibles"
        message="Los favoritos están disponibles para cuentas de cliente."
        testID="favoritos-sin-permiso"
        style={styles.state}
      />
    );
  } else if (vm.vista === 'sesion-vencida') {
    body = (
      <EmptyState
        Icon={LogIn}
        title="Tu sesión ya no es válida"
        message="Inicia sesión de nuevo para ver tus favoritos."
        actionLabel="Iniciar sesión"
        onAction={iniciarSesion}
        testID="favoritos-sesion-vencida"
        style={styles.state}
      />
    );
  } else if (vm.showSkeleton) {
    body = <FavoritosSkeleton />;
  } else if (vm.esperando) {
    body = null; // menos de 150 ms: sin skeleton para no parpadear
  } else if (vm.vista === 'error') {
    body = (
      <ErrorState
        title="No pudimos cargar tus favoritos"
        message={vm.error}
        onRetry={vm.reload}
        style={styles.state}
      />
    );
  } else {
    body = (
      <Animated.View entering={FadeIn.duration(FADE_MS)} style={styles.flex}>
        <FlatList
          data={vm.favoritos}
          keyExtractor={(o) => String(o.id)}
          renderItem={renderItem}
          ItemSeparatorComponent={Separador}
          ListEmptyComponent={
            <EmptyState
              Icon={Heart}
              title="Aún no tienes favoritos"
              message="Toca el corazón en el detalle de una obra para guardarla aquí."
              actionLabel="Explorar el catálogo"
              actionVariant="ghost"
              onAction={() => navigation.navigate('Catalogo')}
              testID="favoritos-vacio"
            />
          }
          contentContainerStyle={styles.list}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          testID="favoritos-lista"
        />
      </Animated.View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={[type.screenTitle, styles.title]} accessibilityRole="header">
          Favoritos
        </Text>
        {vm.subtitulo ? (
          <Text style={[type.body, styles.subtitle]} testID="favoritos-total">
            {vm.subtitulo}
          </Text>
        ) : null}
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
  header: { alignItems: 'center', paddingHorizontal: SCREEN_MARGIN, paddingBottom: 20 },
  title: { color: colors.textPrimary },
  subtitle: { color: colors.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: SCREEN_MARGIN, paddingBottom: 32, flexGrow: 1 },
  state: { flex: 1, justifyContent: 'center' },
});

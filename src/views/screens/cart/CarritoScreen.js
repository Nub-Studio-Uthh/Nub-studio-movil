import { useCallback, useEffect, useRef } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { LogIn, ShoppingCart } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { CARD_SPRING_MS, FADE_MS, STAGGER_MS } from '../../../constants/animations';
import { SCREEN_MARGIN } from '../../../constants/layout';
import { useCarritoViewModel } from '../../../viewmodels/useCarritoViewModel';
import { textoObras } from '../../../utils/carrito';
import { CarritoItem } from '../../components/carrito/CarritoItem';
import { CarritoResumen } from '../../components/carrito/CarritoResumen';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import { CarritoSkeleton } from './CarritoSkeleton';

const ANIMADAS = 5; // solo entran animadas las primeras tarjetas visibles
const SEPARACION = 16;

/**
 * Carrito (HU-08): obras que el cliente quiere comprar, con el total actualizado.
 * Sin sesión invita a iniciar sesión. Se recarga al volver a la pestaña, para ver lo
 * agregado desde el detalle de una obra. "Pagar" abre Finalizar compra (HU-09).
 */
export function CarritoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const vm = useCarritoViewModel();
  const { recargarEnSilencio, quitar } = vm;

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
    (item) => navigation.navigate('DetalleObra', { id: item.id, slug: item.slug }),
    [navigation]
  );

  const onQuitar = useCallback(
    async (item) => {
      const mensaje = await quitar(item);
      if (mensaje) Alert.alert('No pudimos quitarla del carrito', mensaje);
    },
    [quitar]
  );

  const renderItem = useCallback(
    ({ item, index }) => (
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
        <CarritoItem item={item} onPress={abrir} onQuitar={onQuitar} testID={`carrito-${index}`} />
      </Animated.View>
    ),
    [abrir, onQuitar]
  );

  const iniciarSesion = () => navigation.navigate('Login', { regresar: true });
  const pagar = () => navigation.navigate('FinalizarCompra');

  let body;
  if (vm.vista === 'invitado') {
    body = (
      <EmptyState
        Icon={ShoppingCart}
        tone="primary"
        title="Prepara tu compra"
        message="Inicia sesión para agregar obras a tu carrito y pagarlas cuando quieras."
        actionLabel="Iniciar sesión"
        onAction={iniciarSesion}
        testID="carrito-invitado"
        style={styles.state}
      />
    );
  } else if (vm.vista === 'sin-permiso') {
    body = (
      <EmptyState
        Icon={ShoppingCart}
        title="Carrito no disponible"
        message="El carrito está disponible para cuentas de cliente."
        testID="carrito-sin-permiso"
        style={styles.state}
      />
    );
  } else if (vm.vista === 'sesion-vencida') {
    body = (
      <EmptyState
        Icon={LogIn}
        title="Tu sesión ya no es válida"
        message="Inicia sesión de nuevo para ver tu carrito."
        actionLabel="Iniciar sesión"
        onAction={iniciarSesion}
        testID="carrito-sesion-vencida"
        style={styles.state}
      />
    );
  } else if (vm.showSkeleton) {
    body = <CarritoSkeleton />;
  } else if (vm.esperando) {
    body = null; // menos de 150 ms: sin skeleton para no parpadear
  } else if (vm.vista === 'error') {
    body = (
      <ErrorState
        title="No pudimos cargar tu carrito"
        message={vm.error}
        onRetry={vm.reload}
        style={styles.state}
      />
    );
  } else if (vm.items.length === 0) {
    body = (
      <EmptyState
        Icon={ShoppingCart}
        title="Tu carrito está vacío"
        message="Agrega obras desde su detalle y aquí verás tu total."
        actionLabel="Explorar el catálogo"
        actionVariant="ghost"
        onAction={() => navigation.navigate('Catalogo')}
        testID="carrito-vacio"
        style={styles.state}
      />
    );
  } else {
    body = (
      <Animated.View entering={FadeIn.duration(FADE_MS)} style={styles.flex}>
        <FlatList
          data={vm.items}
          keyExtractor={(i) => String(i.idCarrito)}
          renderItem={renderItem}
          ItemSeparatorComponent={Separador}
          ListHeaderComponent={
            <View style={styles.banner} testID="carrito-resumen-compra">
              <Text style={[type.bodySmall, styles.bannerTexto]}>Resumen de compra</Text>
              <Text style={[type.metaBold, styles.bannerCantidad]}>{textoObras(vm.piezas)}</Text>
            </View>
          }
          ListFooterComponent={
            <CarritoResumen total={vm.total} piezas={vm.piezas} onPagar={pagar} />
          }
          contentContainerStyle={styles.list}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          testID="carrito-lista"
        />
      </Animated.View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={[type.screenTitle, styles.title]} accessibilityRole="header">
          Carrito
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
  header: { alignItems: 'center', paddingHorizontal: SCREEN_MARGIN, paddingBottom: 16 },
  title: { color: colors.textPrimary },
  list: { paddingHorizontal: SCREEN_MARGIN, paddingBottom: 32, flexGrow: 1 },
  state: { flex: 1, justifyContent: 'center' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: SEPARACION,
    borderRadius: radius.input,
    backgroundColor: colors.bgDark,
  },
  bannerTexto: { color: colors.textOnDark },
  bannerCantidad: { color: colors.primary },
});

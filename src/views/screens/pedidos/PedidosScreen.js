import { useCallback, useEffect, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, LogIn, Package } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { CARD_SPRING_MS, FADE_MS, STAGGER_MS } from '../../../constants/animations';
import { SCREEN_MARGIN } from '../../../constants/layout';
import { space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { usePedidosViewModel } from '../../../viewmodels/usePedidosViewModel';
import { PedidoCard } from '../../components/pedido/PedidoCard';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import { IconButton } from '../../components/ui/IconButton';
import { PedidosSkeleton } from './PedidosSkeleton';

const ANIMADAS = 5; // solo entran animadas las primeras tarjetas visibles
const SEPARACION = 16;

/**
 * Mis pedidos (HU-10): pedidos del cliente con su estatus, incluidos los hechos en la web.
 * Cada tarjeta abre el detalle. Es solo consulta. Se recarga al volver a la pantalla.
 */
export function PedidosScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const vm = usePedidosViewModel();
  const { recargarEnSilencio } = vm;

  // La primera carga la hace el ViewModel; al volver desde un detalle se refresca.
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

  const volver = () => navigation.goBack();
  const iniciarSesion = () => navigation.navigate('Login', { regresar: true });
  const abrir = useCallback(
    (pedido) => navigation.navigate('DetallePedido', { id: pedido.id }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item, index }) => (
      <Animated.View
        entering={
          index < ANIMADAS
            ? FadeInDown.springify()
                .duration(CARD_SPRING_MS)
                .delay(index * STAGGER_MS)
            : undefined
        }
      >
        <PedidoCard pedido={item} onPress={abrir} testID={`pedido-${index}`} />
      </Animated.View>
    ),
    [abrir]
  );

  let body;
  if (vm.vista === 'invitado') {
    body = (
      <EmptyState
        Icon={Package}
        tone="primary"
        title="Consulta tus pedidos"
        message="Inicia sesión para ver tus compras, también las que hiciste en la web."
        actionLabel="Iniciar sesión"
        onAction={iniciarSesion}
        testID="pedidos-invitado"
        style={styles.state}
      />
    );
  } else if (vm.vista === 'sin-permiso') {
    body = (
      <EmptyState
        Icon={Package}
        title="Pedidos no disponibles"
        message="Los pedidos están disponibles para cuentas de cliente."
        testID="pedidos-sin-permiso"
        style={styles.state}
      />
    );
  } else if (vm.vista === 'sesion-vencida') {
    body = (
      <EmptyState
        Icon={LogIn}
        title="Tu sesión ya no es válida"
        message="Inicia sesión de nuevo para ver tus pedidos."
        actionLabel="Iniciar sesión"
        onAction={iniciarSesion}
        testID="pedidos-sesion-vencida"
        style={styles.state}
      />
    );
  } else if (vm.showSkeleton) {
    body = <PedidosSkeleton />;
  } else if (vm.esperando) {
    body = null; // menos de 150 ms: sin skeleton para no parpadear
  } else if (vm.vista === 'error') {
    body = (
      <ErrorState
        title="No pudimos cargar tus pedidos"
        message={vm.error}
        onRetry={vm.reload}
        style={styles.state}
      />
    );
  } else {
    body = (
      <Animated.View entering={FadeIn.duration(FADE_MS)} style={styles.flex}>
        <FlatList
          data={vm.pedidos}
          keyExtractor={(p) => String(p.id)}
          renderItem={renderItem}
          ItemSeparatorComponent={Separador}
          ListEmptyComponent={
            <EmptyState
              Icon={Package}
              title="Aún no tienes pedidos"
              message="Cuando compres una obra, tu pedido aparecerá aquí con su estatus."
              actionLabel="Explorar el catálogo"
              actionVariant="ghost"
              onAction={() => navigation.navigate('Tabs', { screen: 'Catalogo' })}
              testID="pedidos-vacio"
            />
          }
          ListFooterComponent={
            vm.pedidos.length > 0 ? (
              <Text style={[type.caption, styles.nota]}>
                También ves los pedidos que hiciste en la web.
              </Text>
            ) : null
          }
          contentContainerStyle={styles.list}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          testID="pedidos-lista"
        />
      </Animated.View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <IconButton
          icon={<ArrowLeft size={20} color={colors.textPrimary} />}
          label="Regresar"
          onPress={volver}
          round
          testID="pedidos-regresar"
        />
        <Text style={[type.section, styles.titulo]} accessibilityRole="header">
          Mis pedidos
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
    gap: space.md,
    paddingHorizontal: SCREEN_MARGIN,
    paddingBottom: space.lg,
  },
  titulo: { fontSize: 20, lineHeight: 26, color: colors.textPrimary },
  list: { paddingHorizontal: SCREEN_MARGIN, paddingBottom: 32, flexGrow: 1 },
  state: { flex: 1, justifyContent: 'center' },
  nota: { color: colors.textMuted, textAlign: 'center', marginTop: space.xl },
});

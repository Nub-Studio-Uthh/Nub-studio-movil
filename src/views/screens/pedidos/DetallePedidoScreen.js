import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, LogIn, Package, Truck } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { SCREEN_MARGIN } from '../../../constants/layout';
import { radius, space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { useDetallePedidoViewModel } from '../../../viewmodels/useDetallePedidoViewModel';
import { formatearPrecio } from '../../../utils/formatters';
import { estadoPedido, formatearFecha, textoObras } from '../../../utils/pedidos';
import { EstadoPedido } from '../../components/pedido/EstadoPedido';
import { ItemPedido } from '../../components/pedido/ItemPedido';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';

/**
 * Detalle de pedido (HU-10), solo consulta: estatus, obras, desglose del total y, si ya
 * salió, el número de guía. Recibe { id } por parámetro de ruta.
 */
export function DetallePedidoScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params ?? {};
  const vm = useDetallePedidoViewModel(id);

  const volver = () => navigation.goBack();
  const iniciarSesion = () => navigation.navigate('Login', { regresar: true });

  const rastrear = async (guia) => {
    try {
      await Linking.openURL(
        `https://www.google.com/search?q=${encodeURIComponent(`rastrear guia ${guia}`)}`
      );
    } catch {
      Alert.alert('No pudimos abrir el enlace', 'Revisa tu conexión e inténtalo de nuevo.');
    }
  };

  let body;
  if (vm.vista === 'invitado') {
    body = (
      <EmptyState
        Icon={Package}
        tone="primary"
        title="Inicia sesión para ver tu pedido"
        actionLabel="Iniciar sesión"
        onAction={iniciarSesion}
        testID="detalle-pedido-invitado"
      />
    );
  } else if (vm.vista === 'sin-permiso') {
    body = (
      <EmptyState
        Icon={Package}
        title="Pedidos no disponibles"
        message="Los pedidos están disponibles para cuentas de cliente."
      />
    );
  } else if (vm.vista === 'sesion-vencida') {
    body = (
      <EmptyState
        Icon={LogIn}
        title="Tu sesión ya no es válida"
        message="Inicia sesión de nuevo para ver tu pedido."
        actionLabel="Iniciar sesión"
        onAction={iniciarSesion}
      />
    );
  } else if (vm.isLoading) {
    body = <ActivityIndicator color={colors.primary} testID="detalle-pedido-cargando" />;
  } else if (vm.vista === 'error') {
    body = (
      <ErrorState title="No pudimos cargar el pedido" message={vm.error} onRetry={vm.reload} />
    );
  } else if (vm.vista === 'no-encontrado' || !vm.pedido) {
    body = (
      <EmptyState
        Icon={Package}
        title="No encontramos este pedido"
        message="Puede que ya no esté disponible en tu cuenta."
        actionLabel="Ver mis pedidos"
        actionVariant="ghost"
        onAction={volver}
        testID="detalle-pedido-no-encontrado"
      />
    );
  } else {
    const p = vm.pedido;
    const est = estadoPedido(p.estado);
    body = (
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: space.xxl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        testID="detalle-pedido"
      >
        <View style={styles.card}>
          <View style={styles.hero}>
            <EstadoPedido estado={p.estado} />
            <Text style={[type.caption, styles.muted]}>
              {formatearFecha(p.fecha, { largo: true })} · {textoObras(p.piezas)}
            </Text>
          </View>
          {est.mensaje ? <Text style={[type.bodySmall, styles.mensaje]}>{est.mensaje}</Text> : null}
        </View>

        {p.estado === 'enviado' ? (
          <View style={styles.card} testID="detalle-pedido-guia">
            <View style={styles.guiaTitulo}>
              <Truck size={18} color={colors.info} />
              <Text style={[type.cardTitle, styles.titulo]}>Tu pedido está en camino</Text>
            </View>
            {p.numeroGuia ? (
              <>
                <Text style={[type.bodySmall, styles.muted]}>Número de guía: {p.numeroGuia}</Text>
                <Button
                  label="Rastrear paquete"
                  variant="ghost"
                  compact
                  onPress={() => rastrear(p.numeroGuia)}
                  testID="detalle-pedido-rastrear"
                />
              </>
            ) : (
              <Text style={[type.bodySmall, styles.muted]}>
                Pronto recibirás el número de guía para rastrear tu paquete.
              </Text>
            )}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={[type.badge, styles.etiqueta]}>OBRAS</Text>
          {p.items.map((item, i) => (
            <ItemPedido key={String(item.id)} item={item} testID={`detalle-pedido-item-${i}`} />
          ))}
        </View>

        <View style={styles.card} testID="detalle-pedido-desglose">
          <Fila etiqueta="Subtotal" valor={formatearPrecio(p.subtotal)} />
          {p.descuento > 0 ? (
            <Fila
              etiqueta={p.codigoCupon ? `Cupón ${p.codigoCupon}` : 'Cupón'}
              valor={`-${formatearPrecio(p.descuento)}`}
              acento
            />
          ) : null}
          {p.empaque > 0 ? (
            <Fila etiqueta="Empaque reforzado" valor={`+${formatearPrecio(p.empaque)}`} />
          ) : null}
          <View style={styles.linea} />
          <View style={styles.fila}>
            <Text style={[type.section, styles.titulo]}>Total</Text>
            <Text style={[type.screenTitle, styles.total]} testID="detalle-pedido-total">
              {formatearPrecio(p.total)}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Fila etiqueta="Pedido" valor={p.codigo} />
          <Fila etiqueta="Método de pago" valor="Mercado Pago" />
          <Text style={[type.caption, styles.muted]}>
            El envío se coordina directamente con la galería después del pago.
          </Text>
        </View>
      </ScrollView>
    );
  }

  const titulo = vm.pedido ? `Pedido ${vm.pedido.codigo}` : 'Detalle de pedido';
  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <IconButton
          icon={<ArrowLeft size={20} color={colors.textPrimary} />}
          label="Regresar"
          onPress={volver}
          round
          testID="detalle-pedido-regresar"
        />
        <Text style={[type.section, styles.headerTitulo]} accessibilityRole="header">
          {titulo}
        </Text>
      </View>
      <View style={[styles.flex, !vm.pedido && styles.centro]}>{body}</View>
    </View>
  );
}

function Fila({ etiqueta, valor, acento }) {
  return (
    <View style={styles.fila}>
      <Text style={[type.body, styles.muted]}>{etiqueta}</Text>
      <Text style={[type.metaBold, { color: acento ? colors.success : colors.textPrimary }]}>
        {valor}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen },
  flex: { flex: 1 },
  centro: { justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: SCREEN_MARGIN,
    paddingBottom: space.md,
  },
  headerTitulo: { fontSize: 20, lineHeight: 26, color: colors.textPrimary },
  scroll: { paddingHorizontal: SCREEN_MARGIN, paddingBottom: space.xxl, gap: space.md },
  card: {
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  mensaje: { color: colors.textSecondary },
  guiaTitulo: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  etiqueta: { color: colors.textMuted },
  titulo: { color: colors.textPrimary },
  muted: { color: colors.textSecondary },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  linea: { height: 1, backgroundColor: colors.borderDefault },
  total: { fontSize: 22, lineHeight: 28, color: colors.primary },
});

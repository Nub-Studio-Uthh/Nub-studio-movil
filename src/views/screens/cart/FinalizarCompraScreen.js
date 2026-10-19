import { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, LogIn, ShieldCheck, ShoppingCart } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { SCREEN_MARGIN } from '../../../constants/layout';
import { radius, space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { useFinalizarCompraViewModel } from '../../../viewmodels/useFinalizarCompraViewModel';
import { formatearPrecio } from '../../../utils/formatters';
import { textoObras } from '../../../utils/carrito';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';

const METODOS = ['Tarjeta', 'OXXO', 'Mercado Pago'];
const PASOS = [
  'Revisas aquí tu pedido.',
  'Se abre NU-B Studio web. Inicia sesión con tu misma cuenta.',
  'Ves tu mismo carrito, pones tu dirección y pagas con tarjeta, OXXO o Mercado Pago.',
  'Tu pedido aparece en Mis pedidos, en la app y en la web.',
];

/**
 * Finalizar compra (HU-09): resumen del carrito y paso a la plataforma web, donde se
 * captura la dirección y se paga. La app no pide dirección ni datos de pago.
 * Al volver de la web se recarga el carrito, por si el pedido ya se pagó.
 */
export function FinalizarCompraScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const vm = useFinalizarCompraViewModel();
  const { recargarEnSilencio } = vm;

  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') recargarEnSilencio();
    });
    return () => sub.remove();
  }, [recargarEnSilencio]);

  const volver = () => navigation.goBack();
  const iniciarSesion = () => navigation.navigate('Login', { regresar: true });

  const continuar = async () => {
    if (!vm.urlPago) {
      Alert.alert(
        'No pudimos abrir la web',
        'Falta configurar EXPO_PUBLIC_WEB_URL en el archivo .env.'
      );
      return;
    }
    try {
      await Linking.openURL(vm.urlPago);
    } catch {
      Alert.alert('No pudimos abrir la web', 'Revisa tu conexión e inténtalo de nuevo.');
    }
  };

  let body;
  let barra = false;
  if (vm.vista === 'invitado') {
    body = (
      <EmptyState
        Icon={ShoppingCart}
        tone="primary"
        title="Inicia sesión para pagar"
        message="Tu carrito se guarda en tu cuenta, así lo verás igual en la web."
        actionLabel="Iniciar sesión"
        onAction={iniciarSesion}
        testID="finalizar-invitado"
      />
    );
  } else if (vm.vista === 'sin-permiso') {
    body = (
      <EmptyState
        Icon={ShoppingCart}
        title="Compra no disponible"
        message="Las compras están disponibles para cuentas de cliente."
        testID="finalizar-sin-permiso"
      />
    );
  } else if (vm.vista === 'sesion-vencida') {
    body = (
      <EmptyState
        Icon={LogIn}
        title="Tu sesión ya no es válida"
        message="Inicia sesión de nuevo para continuar con tu compra."
        actionLabel="Iniciar sesión"
        onAction={iniciarSesion}
        testID="finalizar-sesion-vencida"
      />
    );
  } else if (vm.isLoading) {
    body = <ActivityIndicator color={colors.primary} testID="finalizar-cargando" />;
  } else if (vm.vista === 'error') {
    body = (
      <ErrorState title="No pudimos cargar tu carrito" message={vm.error} onRetry={vm.reload} />
    );
  } else if (vm.items.length === 0) {
    body = (
      <EmptyState
        Icon={ShoppingCart}
        title="Tu carrito está vacío"
        message="Agrega obras desde su detalle para poder pagar."
        actionLabel="Explorar el catálogo"
        actionVariant="ghost"
        onAction={() => navigation.navigate('Tabs', { screen: 'Catalogo' })}
        testID="finalizar-vacio"
      />
    );
  } else {
    barra = true;
    body = (
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        testID="finalizar-contenido"
      >
        <View style={styles.resumen} testID="finalizar-resumen">
          <View style={styles.resumenTextos}>
            <Text style={[type.caption, styles.obras]}>{textoObras(vm.piezas)}</Text>
            <Text style={[type.cardTitle, styles.titulos]} numberOfLines={2}>
              {vm.resumen}
            </Text>
          </View>
          <Text style={[type.price, styles.precio]}>
            {formatearPrecio(vm.total, { moneda: false })}
          </Text>
        </View>

        <View style={styles.bloque}>
          <Text style={[type.badge, styles.etiqueta]}>MÉTODOS DISPONIBLES EN LA WEB</Text>
          <View style={styles.metodos}>
            {METODOS.map((m) => (
              <View key={m} style={styles.metodo}>
                <Text style={[type.metaBold, styles.metodoTexto]}>{m}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.pasos}>
          <Text style={[type.cardTitle, styles.pasosTitulo]}>¿Cómo se completa el pago?</Text>
          {PASOS.map((texto, i) => (
            <View key={texto} style={styles.paso}>
              <View style={styles.numero}>
                <Text style={[type.metaBold, styles.numeroTexto]}>{i + 1}</Text>
              </View>
              <Text style={[type.bodySmall, styles.pasoTexto]}>{texto}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
          testID="finalizar-regresar"
        />
        <Text style={[type.section, styles.titulo]} accessibilityRole="header">
          Finalizar compra
        </Text>
      </View>

      <View style={[styles.flex, !barra && styles.centro]}>{body}</View>

      {barra ? (
        <View style={[styles.barra, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
          <View style={styles.totalFila}>
            <Text style={[type.body, styles.totalLabel]}>Total a pagar</Text>
            <Text style={[type.screenTitle, styles.total]} testID="finalizar-total">
              {formatearPrecio(vm.total)}
            </Text>
          </View>
          <Button
            label="Continuar pago en la web"
            onPress={continuar}
            testID="finalizar-continuar"
          />
          <View style={styles.nota}>
            <ShieldCheck size={14} color={colors.textMuted} />
            <Text style={[type.caption, styles.notaTexto]}>
              Se abrirá NU-B Studio web en tu navegador.
            </Text>
          </View>
        </View>
      ) : null}
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
  titulo: { fontSize: 20, lineHeight: 26, color: colors.textPrimary },
  scroll: { paddingHorizontal: SCREEN_MARGIN, paddingBottom: space.xl, gap: space.xl },
  resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
  },
  resumenTextos: { flex: 1, gap: 2 },
  obras: { color: colors.textSecondary },
  titulos: { color: colors.textPrimary },
  precio: { color: colors.textPrimary },
  bloque: { gap: space.sm },
  etiqueta: { color: colors.textMuted },
  metodos: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  metodo: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  metodoTexto: { color: colors.textPrimary },
  pasos: {
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  pasosTitulo: { color: colors.textPrimary },
  paso: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  numero: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  numeroTexto: { color: colors.textOnDark, fontSize: 12, lineHeight: 14 },
  pasoTexto: { flex: 1, color: colors.textSecondary },
  barra: {
    gap: space.md,
    paddingTop: space.md,
    paddingHorizontal: SCREEN_MARGIN,
    backgroundColor: colors.bgScreen,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
  },
  totalFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: colors.textPrimary },
  total: { fontSize: 22, lineHeight: 28, color: colors.primary },
  nota: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  notaTexto: { color: colors.textMuted },
});

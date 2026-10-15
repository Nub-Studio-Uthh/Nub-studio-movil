import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  ExternalLink,
  Globe,
  Heart,
  Lock,
  LogOut,
  Package,
  Pencil,
} from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { StarMark } from '../../components/ui/StarMark';
import { colors } from '../../../constants/colors';
import { SCREEN_MARGIN } from '../../../constants/layout';
import { radius, space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { useAccountViewModel } from '../../../viewmodels/useAccountViewModel';

// TODO: poner la URL real de nubstudio web
const URL_WEB = 'https://nub-studio-front.vercel.app/';
const VERSION_APP = 'NU-B Studio v1.0.0';
const ROSA_SUAVE = '#FCE8E8';

export function AccountScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { autenticado, nombre, correo, iniciales, cerrarSesion } = useAccountViewModel();

  const contenedor = { paddingTop: insets.top + space.xl, paddingHorizontal: SCREEN_MARGIN };

  // Visitante: invita a iniciar sesión
  if (!autenticado) {
    return (
      <View style={[styles.screen, styles.guest, contenedor]}>
        <Text style={[type.screenTitle, styles.titulo]}>Mi cuenta</Text>
        <Text style={[type.body, styles.sub]}>Inicia sesión para ver y gestionar tus datos.</Text>
        <Button
          label="Iniciar sesión"
          onPress={() => navigation.navigate('Login')}
          testID="cuenta-iniciar-sesion"
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[contenedor, { paddingBottom: space.xxl, gap: space.md }]}
    >
      <View style={styles.header}>
        <Text style={[type.screenTitle, styles.titulo]} accessibilityRole="header">
          Mi cuenta
        </Text>
        <StarMark size={28} />
      </View>

      <View style={[styles.card, styles.perfil]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{iniciales}</Text>
        </View>
        <View style={styles.perfilTextos}>
          <Text style={[type.body, styles.nombre]} numberOfLines={1} testID="cuenta-nombre">
            {nombre || '—'}
          </Text>
          <Text style={[type.caption, styles.sub]} numberOfLines={1} testID="cuenta-correo">
            {correo || '—'}
          </Text>
        </View>
      </View>

      <Fila
        icono={<Package size={20} color={colors.textPrimary} />}
        label="Mis pedidos"
        onPress={() => navigation.navigate('Pedidos')}
        testID="cuenta-pedidos"
      />
      <Fila
        icono={<Heart size={20} color={colors.textPrimary} />}
        label="Favoritos"
        onPress={() => navigation.navigate('Favoritos')}
        testID="cuenta-favoritos"
      />
      <Fila
        icono={<Pencil size={20} color={colors.textPrimary} />}
        label="Datos personales"
        onPress={() => navigation.navigate('DatosPersonales')}
        testID="cuenta-datos"
      />
      <Fila
        icono={<Lock size={20} color={colors.textPrimary} />}
        label="Cambiar contraseña"
        onPress={() => navigation.navigate('CambiarContrasena')}
        testID="cuenta-contrasena"
      />
      <Fila
        icono={<Globe size={20} color={colors.textPrimary} />}
        label="Ir a nubstudio web"
        externo
        onPress={() => Linking.openURL(URL_WEB)}
        testID="cuenta-web"
      />

      <Pressable
        onPress={cerrarSesion}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
        style={styles.cerrar}
        testID="cuenta-cerrar-sesion"
      >
        <LogOut size={16} color={colors.error} />
        <Text style={[type.caption, styles.cerrarTexto]}>CERRAR SESIÓN</Text>
      </Pressable>

      <Text style={[type.caption, styles.version]}>{VERSION_APP}</Text>
    </ScrollView>
  );
}

function Fila({ icono, label, onPress, externo = false, testID }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.card, styles.fila]}
      testID={testID}
    >
      {icono}
      <Text style={[type.body, styles.filaTexto]}>{label}</Text>
      {externo ? (
        <ExternalLink size={18} color={colors.textMuted} />
      ) : (
        <ChevronRight size={18} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen },
  guest: { gap: space.lg },
  titulo: { color: colors.textPrimary },
  sub: { color: colors.textSecondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: {
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  perfil: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  perfilTextos: { flex: 1, gap: 2 },
  nombre: { color: colors.textPrimary, fontWeight: '700' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  filaTexto: { flex: 1, color: colors.textPrimary },
  cerrar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: space.lg,
    borderRadius: radius.card,
    backgroundColor: ROSA_SUAVE,
    marginTop: space.sm,
  },
  cerrarTexto: { color: colors.error, fontWeight: '700', letterSpacing: 0.5 },
  version: { color: colors.textMuted, textAlign: 'center', marginTop: space.sm },
});

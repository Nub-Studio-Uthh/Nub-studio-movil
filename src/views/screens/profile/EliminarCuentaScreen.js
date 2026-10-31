import { Alert, StyleSheet, Text, View } from 'react-native';
import { AuthScreenLayout } from '../../components/auth/AuthScreenLayout';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { colors } from '../../../constants/colors';
import { radius, space } from '../../../constants/spacing';
import { fonts, type } from '../../../constants/typography';
import { useEliminarCuentaViewModel } from '../../../viewmodels/useEliminarCuentaViewModel';

const SE_BORRA = [
  'Tu nombre, correo y contraseña',
  'Tus favoritos, tu carrito y tus direcciones',
  'Tu sesión en este y en otros dispositivos',
];
const SE_CONSERVA =
  'Tus compras ya hechas se guardan sin tus datos personales, porque son registros de venta.';

/** Cuenta → "Eliminar mi cuenta" (derecho ARCO de Cancelación). */
export function EliminarCuentaScreen({ navigation }) {
  const vm = useEliminarCuentaViewModel();

  const eliminar = async () => {
    if (!(await vm.eliminar())) return;
    Alert.alert(
      'Cuenta eliminada',
      'Tu cuenta y tus datos se eliminaron. Gracias por usar NUB Studio.'
    );
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const confirmar = () => {
    if (!vm.contrasena) {
      vm.eliminar(); // muestra el aviso de contraseña vacía
      return;
    }
    Alert.alert('¿Eliminar tu cuenta?', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: eliminar },
    ]);
  };

  return (
    <AuthScreenLayout
      title="Eliminar mi cuenta"
      subtitle="Esta acción es permanente y no se puede deshacer."
      onBack={() => navigation.goBack()}
    >
      <View style={styles.caja} testID="eliminar-explicacion">
        <Text style={[type.bodySmall, styles.subtitulo]}>Se elimina:</Text>
        {SE_BORRA.map((linea) => (
          <Text key={linea} style={[type.bodySmall, styles.texto]}>
            • {linea}
          </Text>
        ))}
        <Text style={[type.bodySmall, styles.texto, styles.nota]}>{SE_CONSERVA}</Text>
      </View>

      <TextField
        label="Contraseña"
        placeholder="••••••••"
        value={vm.contrasena}
        onChangeText={vm.cambiarContrasena}
        secure
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={confirmar}
        testID="eliminar-contrasena"
      />

      {vm.error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite" testID="eliminar-error">
          {vm.error}
        </Text>
      ) : null}

      <Button
        label={vm.eliminando ? 'Eliminando...' : 'Eliminar mi cuenta'}
        variant="danger"
        onPress={confirmar}
        disabled={vm.eliminando}
        testID="eliminar-confirmar"
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  caja: {
    gap: space.xs,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  subtitulo: { fontFamily: fonts.bold, color: colors.textPrimary },
  texto: { color: colors.textSecondary },
  nota: { marginTop: space.sm },
  error: { ...type.bodySmall, color: colors.error, textAlign: 'center' },
});

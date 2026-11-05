import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { AuthScreenLayout } from '../../components/auth/AuthScreenLayout';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { colors } from '../../../constants/colors';
import { space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { useRecuperarContrasenaViewModel } from '../../../viewmodels/useRecuperarContrasenaViewModel';

/**
 * "¿Olvidaste tu contraseña?" (desde Iniciar sesión) y "Cambiar contraseña" (desde Cuenta).
 * route.params: { correo?: string, modo?: 'recuperar' | 'cuenta' }
 */
export function RecuperarContrasenaScreen({ navigation, route }) {
  const vm = useRecuperarContrasenaViewModel({
    correo: route?.params?.correo ?? '',
    modo: route?.params?.modo,
  });

  const terminar = async () => {
    if (!(await vm.guardar())) return;
    if (vm.desdeCuenta) {
      Alert.alert('Contraseña actualizada', 'Usa tu nueva contraseña la próxima vez que entres.');
      navigation.goBack();
      return;
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login', params: { correo: vm.correo.trim(), contrasenaNueva: true } }],
    });
  };

  const regresar = () => (vm.paso === 'correo' ? navigation.goBack() : vm.atras());
  const titulo = vm.desdeCuenta ? 'Cambiar contraseña' : 'Recuperar contraseña';

  let subtitulo;
  let contenido;
  if (vm.paso === 'correo') {
    subtitulo = vm.desdeCuenta
      ? `Te enviaremos un código a ${vm.correo} para confirmar que eres tú.`
      : 'Escribe el correo de tu cuenta y te enviaremos un código.';
    contenido = (
      <>
        {vm.desdeCuenta ? null : (
          <TextField
            label="Correo electrónico"
            placeholder="tu@correo.com"
            value={vm.correo}
            onChangeText={vm.cambiarCorreo}
            error={vm.errores.correo}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={vm.enviarCodigo}
            testID="recuperar-correo"
          />
        )}
        <Mensajes error={vm.error} info={vm.info} />
        <Button
          label={vm.enviando ? 'Enviando...' : 'Enviar código'}
          onPress={vm.enviarCodigo}
          disabled={vm.enviando}
          testID="recuperar-enviar"
        />
      </>
    );
  } else if (vm.paso === 'codigo') {
    subtitulo = `Si ${vm.correoOculto} tiene una cuenta, le llegó un código de 6 letras o números. Dura 15 minutos.`;
    contenido = (
      <>
        <TextField
          label="Código"
          placeholder="Ej. VM32V8"
          value={vm.codigo}
          onChangeText={vm.cambiarCodigo}
          error={vm.errores.codigo}
          autoCapitalize="characters"
          maxLength={6}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          returnKeyType="done"
          onSubmitEditing={vm.verificarCodigo}
          testID="recuperar-codigo"
        />
        <Mensajes error={vm.error} info={vm.info} />
        <Button
          label={vm.enviando ? 'Revisando...' : 'Continuar'}
          onPress={vm.verificarCodigo}
          disabled={vm.enviando}
          testID="recuperar-verificar"
        />
        <Pressable
          onPress={vm.reenviar}
          disabled={vm.enviando}
          accessibilityRole="button"
          style={styles.link}
          testID="recuperar-reenviar"
        >
          <Text style={[type.bodySmall, { color: colors.textPrimary }]}>
            ¿No te llegó? Revisa spam o <Text style={styles.bold}>reenviar código</Text>
          </Text>
        </Pressable>
      </>
    );
  } else {
    subtitulo = 'Crea tu contraseña nueva.';
    contenido = (
      <>
        <TextField
          label="Nueva contraseña"
          placeholder="••••••••"
          value={vm.nueva}
          onChangeText={vm.cambiarNueva}
          error={vm.errores.nueva}
          hint="8 o más caracteres, con mayúscula, minúscula, número y símbolo."
          secure
          autoComplete="new-password"
          textContentType="newPassword"
          testID="recuperar-nueva"
        />
        <TextField
          label="Confirmar contraseña"
          placeholder="Repite tu contraseña"
          value={vm.confirmacion}
          onChangeText={vm.cambiarConfirmacion}
          error={vm.errores.confirmacion}
          secure
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={terminar}
          testID="recuperar-confirmacion"
        />
        <Mensajes error={vm.error} info={vm.info} />
        <Button
          label={vm.enviando ? 'Guardando...' : 'Guardar contraseña'}
          onPress={terminar}
          disabled={vm.enviando}
          testID="recuperar-guardar"
        />
      </>
    );
  }

  return (
    <AuthScreenLayout title={titulo} subtitle={subtitulo} onBack={regresar}>
      <Text style={[type.badge, styles.paso]} testID="recuperar-paso">
        PASO {vm.numeroPaso} DE 3
      </Text>
      {contenido}
    </AuthScreenLayout>
  );
}

function Mensajes({ error, info }) {
  if (error) {
    return (
      <Text
        style={[styles.mensaje, { color: colors.error }]}
        accessibilityLiveRegion="polite"
        testID="recuperar-error"
      >
        {error}
      </Text>
    );
  }
  if (info) {
    return (
      <Text style={[styles.mensaje, { color: colors.success }]} accessibilityLiveRegion="polite">
        {info}
      </Text>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  paso: { color: colors.primary, textAlign: 'center' },
  mensaje: { ...type.bodySmall, textAlign: 'center' },
  link: { alignItems: 'center', paddingVertical: space.sm },
  bold: { fontFamily: type.metaBold.fontFamily, color: colors.primary },
});

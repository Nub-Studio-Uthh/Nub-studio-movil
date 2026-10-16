import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthScreenLayout } from '../../components/auth/AuthScreenLayout';
import { Button } from '../../components/ui/Button';
import { StarMark } from '../../components/ui/StarMark';
import { TextField } from '../../components/ui/TextField';
import { colors } from '../../../constants/colors';
import { space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { useLoginViewModel } from '../../../viewmodels/useLoginViewModel';

const irATabs = (navigation) => navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });

export function LoginScreen({ navigation, route }) {
  const { form, errores, errorGeneral, enviando, puedeEnviar, cambiar, ingresar } =
    useLoginViewModel(route?.params?.correo);
  const contrasenaRef = useRef(null);
  const verificado = route?.params?.verificado;

  const ingresarYNavegar = async () => {
    const r = await ingresar();
    // regresar: se abrió desde otra pantalla (p. ej. favoritos, HU-07) y se vuelve a ella.
    if (r?.resultado === 'ok') {
      if (route?.params?.regresar && navigation.canGoBack()) navigation.goBack();
      else irATabs(navigation);
    } else if (r?.resultado === 'verificar')
      navigation.navigate('VerifyEmail', { correo: r.correo });
  };

  return (
    <AuthScreenLayout
      title="Iniciar sesión"
      subtitle="Accede a tu colección de arte huasteco"
      footer="Usa la misma cuenta que en nubstudio web"
    >
      <TextField
        label="Correo electrónico"
        placeholder="tu@correo.com"
        value={form.correo}
        onChangeText={cambiar('correo')}
        error={errores.correo}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => contrasenaRef.current?.focus()}
        testID="login-correo"
      />
      <TextField
        ref={contrasenaRef}
        label="Contraseña"
        placeholder="••••••••"
        value={form.contrasena}
        onChangeText={cambiar('contrasena')}
        error={errores.contrasena}
        secure
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={ingresarYNavegar}
        testID="login-contrasena"
      />

      {verificado ? (
        <Text style={[styles.mensaje, { color: colors.success }]}>
          Correo verificado. Ya puedes iniciar sesión.
        </Text>
      ) : null}
      {errorGeneral ? (
        <Text
          style={[styles.mensaje, { color: colors.error }]}
          accessibilityLiveRegion="polite"
          testID="login-error"
        >
          {errorGeneral}
        </Text>
      ) : null}

      <Button
        label={enviando ? 'Ingresando...' : 'Ingresar a la galería'}
        onPress={ingresarYNavegar}
        disabled={!puedeEnviar}
        testID="login-ingresar"
      />

      <Pressable
        onPress={() => navigation.navigate('Register')}
        accessibilityRole="link"
        testID="login-registrate"
        style={styles.link}
      >
        <Text style={[type.bodySmall, { color: colors.textPrimary }]}>
          ¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate</Text>
        </Text>
      </Pressable>

      <View style={styles.adorno}>
        <StarMark size={24} />
      </View>

      <Button
        label="Explorar sin cuenta"
        variant="ghost"
        onPress={() => irATabs(navigation)}
        testID="login-explorar"
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  mensaje: { ...type.bodySmall, textAlign: 'center' },
  link: { alignItems: 'center', marginTop: -space.xs },
  linkBold: { fontFamily: type.metaBold.fontFamily, color: colors.primary },
  adorno: { alignItems: 'center' },
});

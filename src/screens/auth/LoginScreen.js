import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthScreenLayout } from '../../components/auth/AuthScreenLayout';
import { Button } from '../../components/ui/Button';
import { StarMark } from '../../components/ui/StarMark';
import { TextField } from '../../components/ui/TextField';
import { colors } from '../../constants/colors';
import { space } from '../../constants/spacing';
import { type } from '../../constants/typography';
import { useAuth } from '../../models/AuthContext';
import { validarLogin } from '../../utils/validators';

const irATabs = (navigation) => navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });

export function LoginScreen({ navigation, route }) {
  const { signIn } = useAuth();
  const contrasenaRef = useRef(null);
  const [form, setForm] = useState({ correo: route?.params?.correo ?? '', contrasena: '' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const verificado = route?.params?.verificado;

  const cambiar = (campo) => (valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
    setErrorGeneral(null);
  };

  const ingresar = async () => {
    const nuevos = validarLogin(form);
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    setEnviando(true);
    try {
      await signIn(form);
      irATabs(navigation);
    } catch (error) {
      // Cuenta creada pero sin verificar: se manda a poner el código del correo.
      if (error.data?.requiresVerification) {
        navigation.navigate('VerifyEmail', { correo: form.correo.trim() });
      } else {
        setErrorGeneral(error.message);
      }
      setEnviando(false);
    }
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
        onSubmitEditing={ingresar}
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
        onPress={ingresar}
        disabled={enviando || !form.correo || !form.contrasena}
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

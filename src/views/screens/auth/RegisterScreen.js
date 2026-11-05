import { Pressable, StyleSheet, Text } from 'react-native';
import { AuthScreenLayout } from '../../components/auth/AuthScreenLayout';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { TextField } from '../../components/ui/TextField';
import { colors } from '../../../constants/colors';
import { space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { useRegisterViewModel } from '../../../viewmodels/useRegisterViewModel';

export function RegisterScreen({ navigation }) {
  const { form, errores, errorGeneral, enviando, cambiar, toggleTerminos, registrar } =
    useRegisterViewModel();

  const registrarYVerificar = async () => {
    const correo = await registrar();
    if (correo) navigation.navigate('VerifyEmail', { correo });
  };

  return (
    <AuthScreenLayout
      title="Crear cuenta"
      subtitle="Regístrate para guardar favoritos, armar tu carrito y seguir tus pedidos."
      onBack={() => navigation.goBack()}
    >
      <TextField
        label="Nombre completo"
        placeholder="Ej. Juan Pérez"
        value={form.nombre}
        onChangeText={cambiar('nombre')}
        error={errores.nombre}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        testID="registro-nombre"
      />
      <TextField
        label="Correo electrónico"
        placeholder="tu@correo.com"
        value={form.correo}
        onChangeText={cambiar('correo')}
        error={errores.correo}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        testID="registro-correo"
      />
      <TextField
        label="Contraseña"
        placeholder="••••••••"
        value={form.contrasena}
        onChangeText={cambiar('contrasena')}
        error={errores.contrasena}
        hint="Mínimo 8 caracteres, con mayúscula, número y símbolo"
        secure
        autoComplete="new-password"
        textContentType="newPassword"
        testID="registro-contrasena"
      />
      <TextField
        label="Confirmar contraseña"
        placeholder="Repite tu contraseña"
        value={form.confirmacion}
        onChangeText={cambiar('confirmacion')}
        error={errores.confirmacion}
        secure
        autoComplete="new-password"
        textContentType="newPassword"
        testID="registro-confirmacion"
      />
      <Checkbox
        checked={form.aceptaTerminos}
        onToggle={toggleTerminos}
        accessibilityLabel="Acepto los Términos y Condiciones y la Política de privacidad"
        error={errores.terminos}
        testID="registro-terminos"
      >
        Acepto los{' '}
        <Text
          style={styles.enlace}
          onPress={() => navigation.navigate('Legal', { tipo: 'terminos' })}
        >
          Términos y Condiciones
        </Text>{' '}
        y la{' '}
        <Text
          style={styles.enlace}
          onPress={() => navigation.navigate('Legal', { tipo: 'privacidad' })}
        >
          Política de privacidad
        </Text>
      </Checkbox>
      {errorGeneral ? (
        <Text style={styles.errorGeneral} accessibilityLiveRegion="polite" testID="registro-error">
          {errorGeneral}
        </Text>
      ) : null}
      <Button
        label={enviando ? 'Creando cuenta...' : 'Crear cuenta'}
        onPress={registrarYVerificar}
        disabled={enviando}
        testID="registro-enviar"
      />
      <Pressable
        onPress={() => navigation.goBack()}
        accessibilityRole="link"
        style={styles.link}
        testID="registro-login"
      >
        <Text style={[type.bodySmall, { color: colors.textPrimary }]}>
          ¿Ya tienes cuenta? <Text style={styles.enlace}>Inicia sesión</Text>
        </Text>
      </Pressable>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  errorGeneral: { ...type.bodySmall, color: colors.error, textAlign: 'center' },
  link: { alignItems: 'center', paddingVertical: space.sm },
  enlace: { fontFamily: type.metaBold.fontFamily, color: colors.primary },
});

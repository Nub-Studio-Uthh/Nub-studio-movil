import { Pressable, StyleSheet, Text } from 'react-native';
import { AuthScreenLayout } from '../../components/auth/AuthScreenLayout';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { colors } from '../../../constants/colors';
import { space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { useVerifyEmailViewModel } from '../../../viewmodels/useVerifyEmailViewModel';

export function VerifyEmailScreen({ navigation, route }) {
  const correo = route.params?.correo ?? '';
  const {
    codigo,
    error,
    info,
    enviando,
    reenviando,
    puedeVerificar,
    cambiarCodigo,
    verificar,
    reenviar,
  } = useVerifyEmailViewModel(correo);

  const verificarYEntrar = async () => {
    if (!(await verificar())) return;
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login', params: { correo, verificado: true } }],
    });
  };

  return (
    <AuthScreenLayout
      title="Verifica tu correo"
      subtitle={`Enviamos un código de 6 dígitos a ${correo}`}
      onBack={() => navigation.goBack()}
    >
      <TextField
        label="Código de verificación"
        value={codigo}
        onChangeText={cambiarCodigo}
        keyboardType="number-pad"
        maxLength={6}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        returnKeyType="done"
        onSubmitEditing={verificarYEntrar}
        testID="verificar-codigo"
      />

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite" testID="verificar-error">
          {error}
        </Text>
      ) : null}
      {info ? (
        <Text style={styles.info} accessibilityLiveRegion="polite">
          {info}
        </Text>
      ) : null}

      <Button
        label={enviando ? 'Verificando...' : 'Verificar'}
        onPress={verificarYEntrar}
        disabled={!puedeVerificar}
        testID="verificar-enviar"
      />

      <Pressable
        onPress={reenviar}
        disabled={reenviando}
        accessibilityRole="button"
        style={styles.link}
        testID="verificar-reenviar"
      >
        <Text style={[type.body, { color: colors.textPrimary }]}>
          ¿No te llegó?{' '}
          <Text style={styles.bold}>{reenviando ? 'Enviando...' : 'Reenviar código'}</Text>
        </Text>
      </Pressable>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: { ...type.bodySmall, color: colors.error, textAlign: 'center' },
  info: { ...type.bodySmall, color: colors.success, textAlign: 'center' },
  link: { alignItems: 'center', paddingVertical: space.sm },
  bold: { fontFamily: type.metaBold.fontFamily, color: colors.primary },
});

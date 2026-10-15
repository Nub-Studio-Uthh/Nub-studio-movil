import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AuthScreenLayout } from '../../components/auth/AuthScreenLayout';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { colors } from '../../constants/colors';
import { space } from '../../constants/spacing';
import { type } from '../../constants/typography';
import * as authService from '../../models/authService';
import { esCodigoValido } from '../../utils/validators';

export function VerifyEmailScreen({ navigation, route }) {
  const correo = route.params?.correo ?? '';
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  const verificar = async () => {
    if (!esCodigoValido(codigo)) return setError('El código tiene 6 dígitos');
    setEnviando(true);
    setError(null);
    try {
      await authService.verificarCorreo({ correo, codigo });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login', params: { correo, verificado: true } }],
      });
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  };

  const reenviar = async () => {
    setReenviando(true);
    setError(null);
    setInfo(null);
    try {
      await authService.reenviarCodigo(correo);
      setInfo('Te enviamos un código nuevo.');
    } catch (e) {
      setError(e.message);
    } finally {
      setReenviando(false);
    }
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
        onChangeText={(t) => {
          setCodigo(t.replace(/\D/g, ''));
          setError(null);
        }}
        keyboardType="number-pad"
        maxLength={6}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        returnKeyType="done"
        onSubmitEditing={verificar}
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
        onPress={verificar}
        disabled={enviando || codigo.length !== 6}
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

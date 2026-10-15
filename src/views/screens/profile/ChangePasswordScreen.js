import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AuthScreenLayout } from '../../components/auth/AuthScreenLayout';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { colors } from '../../../constants/colors';
import { type } from '../../../constants/typography';
import { useAuth } from '../../../models/AuthContext';
import { validarCambioContrasena } from '../../../utils/validators';

const INICIAL = { actual: '', nueva: '', confirmacion: '' };

export function ChangePasswordScreen({ navigation }) {
  const { changePassword } = useAuth();
  const [form, setForm] = useState(INICIAL);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null); // { tipo: 'ok' | 'error', texto }
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
    setMensaje(null);
  };

  const guardar = async () => {
    const nuevos = validarCambioContrasena(form);
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    setEnviando(true);
    try {
      await changePassword({ actual: form.actual, nueva: form.nueva });
      setForm(INICIAL);
      setMensaje({ tipo: 'ok', texto: 'Tu contraseña se actualizó correctamente.' });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AuthScreenLayout title="Cambiar contraseña" onBack={() => navigation.goBack()}>
      <TextField
        label="Contraseña actual"
        placeholder="••••••••"
        value={form.actual}
        onChangeText={cambiar('actual')}
        error={errores.actual}
        secure
        autoComplete="current-password"
        testID="cambiar-actual"
      />
      <TextField
        label="Nueva contraseña"
        placeholder="••••••••"
        value={form.nueva}
        onChangeText={cambiar('nueva')}
        error={errores.nueva}
        hint="Mínimo 8 caracteres, con mayúscula, número y símbolo"
        secure
        autoComplete="new-password"
        testID="cambiar-nueva"
      />
      <TextField
        label="Confirmar nueva contraseña"
        placeholder="Repite tu contraseña"
        value={form.confirmacion}
        onChangeText={cambiar('confirmacion')}
        error={errores.confirmacion}
        secure
        autoComplete="new-password"
        testID="cambiar-confirmacion"
      />

      {mensaje ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.mensaje, { color: mensaje.tipo === 'ok' ? colors.success : colors.error }]}
        >
          {mensaje.texto}
        </Text>
      ) : null}

      <Button
        label={enviando ? 'Guardando...' : 'Actualizar contraseña'}
        onPress={guardar}
        disabled={enviando}
        testID="cambiar-guardar"
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  mensaje: { ...type.bodySmall, textAlign: 'center' },
});

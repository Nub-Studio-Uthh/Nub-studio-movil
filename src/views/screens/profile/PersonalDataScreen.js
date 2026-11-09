import { StyleSheet, Switch, Text, View } from 'react-native';
import { LogIn } from 'lucide-react-native';
import { AuthScreenLayout } from '../../components/auth/AuthScreenLayout';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { colors } from '../../../constants/colors';
import { radius, space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { usePersonalDataViewModel } from '../../../viewmodels/usePersonalDataViewModel';
import { PersonalDataSkeleton } from './PersonalDataSkeleton';

/** Cuenta → "Datos personales" (derechos ARCO de Acceso, Rectificación y Oposición). */
export function PersonalDataScreen({ navigation }) {
  const vm = usePersonalDataViewModel();

  let body;
  if (vm.vista === 'sesion-vencida') {
    body = (
      <EmptyState
        Icon={LogIn}
        title="Tu sesión ya no es válida"
        message="Inicia sesión de nuevo para ver tus datos."
        actionLabel="Iniciar sesión"
        onAction={() => navigation.navigate('Login', { regresar: true })}
        testID="datos-sesion-vencida"
      />
    );
  } else if (vm.vista === 'solo-lectura') {
    body = (
      <View style={styles.card}>
        <Dato label="Nombre completo" valor={vm.nombreSesion} testID="datos-nombre" />
        <Dato label="Correo electrónico" valor={vm.correoSesion} testID="datos-correo" />
      </View>
    );
  } else if (vm.showSkeleton) {
    body = <PersonalDataSkeleton />;
  } else if (vm.esperando) {
    body = null; // menos de 150 ms: sin skeleton para no parpadear
  } else if (vm.vista === 'error') {
    body = (
      <ErrorState title="No pudimos cargar tus datos" message={vm.error} onRetry={vm.reload} />
    );
  } else {
    body = <Formulario vm={vm} />;
  }

  return (
    <AuthScreenLayout title="Datos personales" onBack={() => navigation.goBack()}>
      {body}
    </AuthScreenLayout>
  );
}

function Formulario({ vm }) {
  return (
    <>
      <TextField
        label="Nombre completo"
        value={vm.form.nombre}
        onChangeText={vm.cambiar('nombre')}
        error={vm.errores.nombre}
        editable={!vm.guardando}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        maxLength={100}
        testID="datos-nombre"
      />
      <TextField
        label="Teléfono"
        value={vm.form.telefono}
        onChangeText={vm.cambiar('telefono')}
        error={vm.errores.telefono}
        hint="Opcional. 10 números."
        editable={!vm.guardando}
        keyboardType="number-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        maxLength={10}
        testID="datos-telefono"
      />

      <View style={styles.card}>
        <Dato label="Correo electrónico" valor={vm.correo} testID="datos-correo" />
        <Text style={[type.caption, styles.nota]}>El correo no se puede cambiar desde la app.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.switchFila}>
          <Text style={[type.body, styles.switchTexto]}>
            Recibir promociones y novedades por correo
          </Text>
          <Switch
            value={vm.aceptaMarketing}
            onValueChange={vm.cambiarMarketing}
            disabled={vm.cambiandoMarketing}
            trackColor={{ false: colors.borderDefault, true: colors.primary }}
            thumbColor={colors.textOnDark}
            accessibilityLabel="Recibir promociones y novedades por correo"
            testID="datos-marketing"
          />
        </View>
        <Text style={[type.caption, styles.nota]}>
          Puedes cambiarlo cuando quieras. Los correos de tu cuenta y tus pedidos te seguirán
          llegando.
        </Text>
        {vm.errorMarketing ? (
          <Text
            style={styles.error}
            accessibilityLiveRegion="polite"
            testID="datos-marketing-error"
          >
            {vm.errorMarketing}
          </Text>
        ) : null}
      </View>

      {vm.errorGuardar ? (
        <Text style={styles.error} accessibilityLiveRegion="polite" testID="datos-error">
          {vm.errorGuardar}
        </Text>
      ) : null}
      {vm.guardado ? (
        <Text style={styles.exito} accessibilityLiveRegion="polite" testID="datos-guardado">
          Tus datos se guardaron.
        </Text>
      ) : null}

      <Button
        label={vm.guardando ? 'Guardando...' : 'Guardar cambios'}
        onPress={vm.guardar}
        disabled={vm.guardando || !vm.hayCambios}
        testID="datos-guardar"
      />
    </>
  );
}

function Dato({ label, valor, testID }) {
  return (
    <View style={{ gap: space.xs }}>
      <Text style={[type.caption, { color: colors.textSecondary }]}>{label.toUpperCase()}</Text>
      <Text style={[type.body, { color: colors.textPrimary }]} testID={testID}>
        {valor || '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.xs,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  switchFila: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  switchTexto: { flex: 1, color: colors.textPrimary },
  nota: { color: colors.textMuted },
  error: { ...type.bodySmall, color: colors.error, textAlign: 'center' },
  exito: { ...type.bodySmall, color: colors.success, textAlign: 'center' },
});

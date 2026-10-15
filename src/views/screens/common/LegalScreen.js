import { StyleSheet, Text, View } from 'react-native';
import { AuthScreenLayout } from '../../components/auth/AuthScreenLayout';
import { colors } from '../../../constants/colors';
import { LEGAL } from '../../../constants/legal';
import { space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';

/** Muestra Términos y Condiciones o Política de privacidad. route.params.tipo: 'terminos' | 'privacidad' */
export function LegalScreen({ navigation, route }) {
  const doc = LEGAL[route.params?.tipo] ?? LEGAL.terminos;

  return (
    <AuthScreenLayout title={doc.titulo} onBack={() => navigation.goBack()}>
      {doc.secciones.map((s) => (
        <View key={s.titulo} style={styles.seccion}>
          <Text style={[type.cardTitle, { color: colors.textPrimary }]}>{s.titulo}</Text>
          <Text style={[type.bodySmall, { color: colors.textSecondary }]}>{s.texto}</Text>
        </View>
      ))}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  seccion: { gap: space.sm },
});

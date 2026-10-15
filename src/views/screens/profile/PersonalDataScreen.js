import { StyleSheet, Text, View } from 'react-native';
import { AuthScreenLayout } from '../../components/auth/AuthScreenLayout';
import { colors } from '../../../constants/colors';
import { radius, space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { useAuth } from '../../../models/AuthContext';

export function PersonalDataScreen({ navigation }) {
  const { usuario } = useAuth();
  return (
    <AuthScreenLayout title="Datos personales" onBack={() => navigation.goBack()}>
      <View style={styles.card}>
        <Dato label="Nombre completo" valor={usuario?.nombre} testID="datos-nombre" />
        <Dato label="Correo electrónico" valor={usuario?.correo} testID="datos-correo" />
      </View>
    </AuthScreenLayout>
  );
}

function Dato({ label, valor, testID }) {
  return (
    <View style={{ gap: space.xs }}>
      <Text style={[type.caption, { color: colors.textSecondary }]}>{label.toUpperCase()}</Text>
      <Text style={[type.body, { color: colors.textPrimary }]} testID={testID}>
        {valor ?? '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
});

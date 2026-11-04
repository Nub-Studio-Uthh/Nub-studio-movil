import { StyleSheet, View } from 'react-native';
import { colors } from '../../../constants/colors';
import { radius, space } from '../../../constants/spacing';
import { SkeletonBlock, SkeletonContainer, SkeletonLine } from '../../components/skeleton';

const ALTO_CAMPO = 48;
const ALTO_BOTON = 48;

function SkeletonCampo({ etiqueta, ayuda }) {
  return (
    <View style={styles.campo}>
      <SkeletonLine boxHeight={16} width={etiqueta} height={10} />
      <SkeletonBlock width="100%" height={ALTO_CAMPO} radius={radius.input} />
      {ayuda ? <SkeletonLine boxHeight={15} width={ayuda} height={10} /> : null}
    </View>
  );
}

/** Datos personales en carga: mismos campos, tarjeta y botón que el formulario. */
export function PersonalDataSkeleton() {
  return (
    <SkeletonContainer label="Cargando tus datos">
      <View style={styles.form}>
        <SkeletonCampo etiqueta={120} />
        <SkeletonCampo etiqueta={70} ayuda={110} />
        <View style={styles.card}>
          <SkeletonLine boxHeight={15} width={130} height={10} />
          <SkeletonLine boxHeight={20} width="60%" height={12} />
        </View>
        <View style={styles.card}>
          <SkeletonLine boxHeight={20} width="75%" height={12} />
          <SkeletonLine boxHeight={15} width="90%" height={10} />
        </View>
        <SkeletonBlock width="100%" height={ALTO_BOTON} radius={radius.pill} />
      </View>
    </SkeletonContainer>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
  campo: { gap: space.sm },
  card: {
    gap: space.xs,
    padding: space.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
});

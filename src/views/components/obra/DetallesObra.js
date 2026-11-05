import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../constants/colors';
import { space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';

const siNo = (v) => (v ? 'Sí' : 'No');

/**
 * Historia y ficha de la obra (año, dimensiones, marco y certificado).
 * Solo muestra lo que llega; si no hay nada que mostrar, no dibuja nada.
 * @param {{ historia?: string, anio?: number|null, dimensiones?: string|null,
 *   permiteMarco?: boolean|null, conCertificado?: boolean|null }} props
 */
export function DetallesObra({ historia, anio, dimensiones, permiteMarco, conCertificado }) {
  const filas = [
    anio !== null && anio !== undefined && { label: 'Año de creación', value: String(anio) },
    dimensiones && { label: 'Dimensiones', value: dimensiones },
    typeof permiteMarco === 'boolean' && { label: 'Permite marco', value: siNo(permiteMarco) },
    typeof conCertificado === 'boolean' && {
      label: 'Con certificado',
      value: siNo(conCertificado),
    },
  ].filter(Boolean);

  if (!historia && filas.length === 0) return null;

  return (
    <View style={styles.box} testID="detalles-obra">
      {historia ? (
        <View style={styles.section}>
          <Text style={[type.cardTitle, { color: colors.textPrimary }]} accessibilityRole="header">
            Historia
          </Text>
          <Text style={[type.body, { color: colors.textSecondary }]}>{historia}</Text>
        </View>
      ) : null}
      {filas.length > 0 ? (
        <View style={styles.section}>
          <Text style={[type.cardTitle, { color: colors.textPrimary }]} accessibilityRole="header">
            Detalles
          </Text>
          <View>
            {filas.map((f, i) => (
              <View key={f.label} style={[styles.row, i > 0 && styles.divider]}>
                <Text style={[type.bodySmall, { color: colors.textSecondary }]}>{f.label}</Text>
                <Text style={[type.metaBold, { color: colors.textPrimary }]}>{f.value}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: space.xl },
  section: { gap: space.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.md,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.borderDefault },
});

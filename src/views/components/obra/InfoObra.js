import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../constants/colors';
import { space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { Badge } from '../ui/Badge';
import { PriceTag } from '../ui/PriceTag';

/**
 * Etiquetas, nombre, precio y descripción de la obra. Solo presenta; no pide datos.
 * Los children se muestran entre el precio y la descripción (ahí va la tarjeta del artista).
 * @param {{ titulo: string, precio: number, descripcion?: string,
 *   etiquetas?: { label: string, tone?: string }[], children?: React.ReactNode }} props
 */
export function InfoObra({ titulo, precio, descripcion, etiquetas = [], children }) {
  return (
    <View style={styles.box}>
      {etiquetas.length > 0 ? (
        <View style={styles.badges}>
          {etiquetas.map((e) => (
            <Badge key={e.label} label={e.label} tone={e.tone} />
          ))}
        </View>
      ) : null}
      <Text style={styles.title} accessibilityRole="header">
        {titulo}
      </Text>
      <View style={styles.price}>
        <PriceTag precio={precio} />
        <Text style={[type.metaBold, { color: colors.textSecondary }]}>MXN</Text>
      </View>
      {children}
      {descripcion ? (
        <View style={styles.section}>
          <Text style={[type.cardTitle, { color: colors.textPrimary }]} accessibilityRole="header">
            Descripción
          </Text>
          <Text style={[type.body, { color: colors.textSecondary }]}>{descripcion}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: space.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  title: { ...type.screenTitle, fontSize: 24, lineHeight: 30, color: colors.textPrimary },
  price: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  section: { gap: space.sm },
});

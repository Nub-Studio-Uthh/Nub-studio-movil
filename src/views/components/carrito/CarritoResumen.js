import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/spacing';
import { fonts, type } from '../../../constants/typography';
import { formatearPrecio } from '../../../utils/formatters';
import { textoPagar } from '../../../utils/carrito';
import { Button } from '../ui/Button';

/**
 * Subtotal, envío, total y botón de pago (parte baja del carrito del prototipo).
 * El envío se coordina después, por eso no suma al total.
 * @param {{ total: number, piezas: number, onPagar?: () => void }} props
 */
export function CarritoResumen({ total, piezas, onPagar }) {
  return (
    <View style={styles.box}>
      <View style={styles.card}>
        <Fila etiqueta="Subtotal" valor={formatearPrecio(total, { moneda: false })} />
        <Fila etiqueta="Envío" valor="A COORDINAR" acento />
        <View style={styles.linea} />
        <View style={styles.fila}>
          <Text style={[type.section, styles.totalLabel]}>Total</Text>
          <Text style={[type.screenTitle, styles.total]} testID="carrito-total">
            {formatearPrecio(total)}
          </Text>
        </View>
      </View>
      <Button label={textoPagar(piezas)} onPress={onPagar} testID="carrito-pagar" />
      <MetodosAceptados />
    </View>
  );
}

function Fila({ etiqueta, valor, acento }) {
  return (
    <View style={styles.fila}>
      <Text style={[type.body, styles.etiqueta]}>{etiqueta}</Text>
      <Text style={[type.metaBold, { color: acento ? colors.success : colors.textPrimary }]}>
        {valor}
      </Text>
    </View>
  );
}

/** Insignias de los métodos de pago de la web: Mercado Pago, OXXO, Visa y Mastercard. */
function MetodosAceptados() {
  return (
    <View style={styles.metodos} testID="carrito-metodos">
      <Text style={[type.badge, styles.metodosTitulo]}>MÉTODOS ACEPTADOS</Text>
      <View
        style={styles.logos}
        accessible
        accessibilityLabel="Métodos aceptados: Mercado Pago, OXXO, Visa y Mastercard"
      >
        <View style={[styles.chip, { backgroundColor: '#009EE3' }]}>
          <Text style={[styles.chipTexto, { fontSize: 11 }]}>Mercado Pago</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: '#E8131A' }]}>
          <Text style={[styles.chipTexto, { fontSize: 11, letterSpacing: 0.7 }]}>OXXO</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: '#1A1F71' }]}>
          <Text
            style={[styles.chipTexto, { fontSize: 14, letterSpacing: 0.5, fontStyle: 'italic' }]}
          >
            VISA
          </Text>
        </View>
        <View style={[styles.chip, styles.chipMastercard]}>
          <View style={[styles.circulo, { backgroundColor: '#EB001B' }]} />
          <View style={[styles.circulo, { backgroundColor: '#F79E1B', marginLeft: -6 }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 16, marginTop: 20 },
  card: {
    gap: 10,
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
  },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  etiqueta: { color: colors.textSecondary },
  linea: { height: 1, backgroundColor: colors.borderDefault, marginVertical: 4 },
  totalLabel: { color: colors.textPrimary },
  total: { fontSize: 22, lineHeight: 28, color: colors.primary },
  metodos: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
  },
  metodosTitulo: { color: colors.textMuted },
  logos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  chipTexto: { fontFamily: fonts.numeric, color: colors.textOnDark },
  chipMastercard: {
    paddingHorizontal: 9,
    backgroundColor: colors.bgScreen,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  circulo: { width: 14, height: 14, borderRadius: 7 },
});

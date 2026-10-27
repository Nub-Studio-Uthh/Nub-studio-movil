import { StyleSheet, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { TextField } from '../ui/TextField';
import { SelectorLista } from './SelectorLista';

/**
 * Dirección de envío (HU-09): los mismos campos que pide el backend. Solo dibuja; los datos,
 * los errores y las listas llegan de useFinalizarCompraViewModel.
 */
export function FormularioDireccion({ direccion: d, errores: e, cambiar, estados, municipios }) {
  let hintMunicipio;
  if (!d.estado) hintMunicipio = 'Primero elige el estado.';
  else if (municipios.error) hintMunicipio = municipios.error;

  return (
    <View style={styles.bloque} testID="finalizar-direccion">
      <View style={styles.encabezado}>
        <MapPin size={18} color={colors.textPrimary} strokeWidth={1.5} />
        <Text style={[type.cardTitle, styles.titulo]} accessibilityRole="header">
          Dirección de envío
        </Text>
      </View>

      <TextField
        label="Calle"
        value={d.calle}
        onChangeText={(v) => cambiar('calle', v)}
        error={e.calle}
        autoCapitalize="words"
        maxLength={255}
        testID="dir-calle"
      />
      <View style={styles.fila}>
        <View style={styles.mitad}>
          <TextField
            label="Número exterior"
            value={d.numeroExterior}
            onChangeText={(v) => cambiar('numeroExterior', v)}
            error={e.numeroExterior}
            maxLength={20}
            testID="dir-num-ext"
          />
        </View>
        <View style={styles.mitad}>
          <TextField
            label="Interior (opcional)"
            value={d.numeroInterior}
            onChangeText={(v) => cambiar('numeroInterior', v)}
            error={e.numeroInterior}
            maxLength={20}
            testID="dir-num-int"
          />
        </View>
      </View>
      <TextField
        label="Colonia"
        value={d.colonia}
        onChangeText={(v) => cambiar('colonia', v)}
        error={e.colonia}
        autoCapitalize="words"
        maxLength={150}
        testID="dir-colonia"
      />
      <SelectorLista
        label="Estado"
        value={d.estado}
        opciones={estados.data}
        onChange={(v) => cambiar('estado', v)}
        placeholder={estados.error ? 'No pudimos cargar los estados' : 'Elige el estado'}
        error={e.estado}
        cargando={estados.isLoading}
        testID="dir-estado"
      />
      <SelectorLista
        label="Municipio"
        value={d.municipio}
        opciones={municipios.data}
        onChange={(v) => cambiar('municipio', v)}
        placeholder="Elige el municipio"
        error={e.municipio}
        hint={hintMunicipio}
        disabled={!d.estado}
        cargando={municipios.isLoading}
        testID="dir-municipio"
      />
      <TextField
        label="Código postal"
        value={d.codigoPostal}
        onChangeText={(v) => cambiar('codigoPostal', v.replace(/\D/g, '').slice(0, 5))}
        error={e.codigoPostal}
        keyboardType="number-pad"
        maxLength={5}
        testID="dir-cp"
      />
      <TextField
        label="Referencias (opcional)"
        value={d.referencias}
        onChangeText={(v) => cambiar('referencias', v)}
        error={e.referencias}
        hint="Ej. casa azul, frente a la escuela."
        autoCapitalize="sentences"
        maxLength={500}
        multiline
        testID="dir-referencias"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: space.lg },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  titulo: { color: colors.textPrimary },
  fila: { flexDirection: 'row', gap: space.md },
  mitad: { flex: 1 },
});

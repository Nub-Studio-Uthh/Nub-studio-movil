import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown, Search } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { radius, space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { filtrarPorNombre } from '../../../utils/direccion';

/**
 * Campo que se ve como los demás del formulario y abre una lista con buscador
 * (estado o municipio). Con `disabled` muestra `hint` para explicar por qué.
 * @param {{ label: string, value: {id:number,nombre:string}|null, opciones: {id:number,nombre:string}[],
 *   onChange: (o) => void, placeholder?: string, error?: string, hint?: string,
 *   disabled?: boolean, cargando?: boolean, testID?: string }} props
 */
export function SelectorLista({
  label,
  value,
  opciones,
  onChange,
  placeholder = 'Elige una opción',
  error,
  hint,
  disabled,
  cargando,
  testID,
}) {
  const insets = useSafeAreaInsets();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const lista = filtrarPorNombre(opciones, busqueda);

  const cerrar = () => {
    setAbierto(false);
    setBusqueda('');
  };
  const elegir = (o) => {
    cerrar();
    onChange(o);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <Pressable
        onPress={() => setAbierto(true)}
        disabled={disabled || cargando}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value?.nombre ?? placeholder}`}
        accessibilityState={{ disabled: !!(disabled || cargando) }}
        testID={testID}
        style={[styles.box, !!error && styles.boxError, (disabled || cargando) && styles.off]}
      >
        <Text style={[type.body, styles.valor, !value && styles.placeholder]} numberOfLines={1}>
          {value?.nombre ?? placeholder}
        </Text>
        {cargando ? (
          <ActivityIndicator size="small" color={colors.textMuted} />
        ) : (
          <ChevronDown size={18} color={colors.textMuted} />
        )}
      </Pressable>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}

      <Modal visible={abierto} transparent animationType="fade" onRequestClose={cerrar}>
        <Pressable style={styles.fondo} onPress={cerrar} accessibilityLabel="Cerrar" />
        <View style={[styles.hoja, { paddingBottom: insets.bottom + space.md }]}>
          <Text style={[type.section, styles.titulo]} accessibilityRole="header">
            {label}
          </Text>
          <View style={styles.buscador}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar"
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
              style={[type.body, styles.buscarInput]}
              testID={testID ? `${testID}-buscar` : undefined}
            />
          </View>
          <FlatList
            data={lista}
            keyExtractor={(o) => String(o.id)}
            keyboardShouldPersistTaps="handled"
            style={styles.lista}
            ListEmptyComponent={
              <Text style={[type.bodySmall, styles.vacio]}>No encontramos resultados.</Text>
            }
            renderItem={({ item }) => {
              const sel = item.id === value?.id;
              return (
                <Pressable
                  onPress={() => elegir(item)}
                  style={styles.opcion}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: sel }}
                  testID={testID ? `${testID}-opcion-${item.id}` : undefined}
                >
                  <Text style={[type.body, { color: sel ? colors.primary : colors.textPrimary }]}>
                    {item.nombre}
                  </Text>
                  {sel ? <Check size={20} color={colors.primary} /> : null}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  label: { ...type.metaBold, fontSize: 11, letterSpacing: 0.5, color: colors.textSecondary },
  box: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.input,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  boxError: { borderColor: colors.error },
  off: { opacity: 0.5 },
  valor: { flex: 1, color: colors.textPrimary },
  placeholder: { color: colors.textMuted },
  error: { ...type.caption, color: colors.error },
  hint: { ...type.caption, color: colors.textMuted },
  fondo: { flex: 1, backgroundColor: 'rgba(13,11,20,0.4)' },
  hoja: {
    maxHeight: '75%',
    backgroundColor: colors.bgScreen,
    borderTopLeftRadius: radius.cardLarge,
    borderTopRightRadius: radius.cardLarge,
    paddingTop: space.xl,
    paddingHorizontal: 20,
    gap: space.md,
  },
  titulo: { color: colors.textPrimary },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 44,
    paddingHorizontal: space.md,
    borderRadius: radius.input,
    backgroundColor: colors.bgInput,
  },
  buscarInput: { flex: 1, color: colors.textPrimary, paddingVertical: 0 },
  lista: { flexGrow: 0 },
  opcion: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  vacio: { color: colors.textMuted, paddingVertical: space.lg, textAlign: 'center' },
});

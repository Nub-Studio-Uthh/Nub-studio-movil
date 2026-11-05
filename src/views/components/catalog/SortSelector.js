import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { ORDENES } from '../../../utils/obras';

/**
 * Botón "Ordenar: Más recientes ▾" con borde e icono, para que se vea que se puede tocar.
 * Abre una hoja con las opciones de orden. No filtra: el catálogo siempre muestra todas las obras.
 */
export function SortSelector({ value, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const insets = useSafeAreaInsets();
  const actual = ORDENES.find((o) => o.value === value) ?? ORDENES[0];

  const elegir = (v) => {
    setAbierto(false);
    if (v !== value) onChange(v);
  };

  return (
    <>
      <Pressable
        onPress={() => setAbierto(true)}
        hitSlop={12}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel={`Ordenar por: ${actual.label}`}
        accessibilityHint="Cambia el orden de las obras"
        testID="ordenar"
      >
        <ArrowUpDown size={14} color={colors.textSecondary} strokeWidth={1.75} />
        <Text style={[type.meta, styles.prefijo]}>Ordenar:</Text>
        <Text style={[type.metaBold, styles.valor]} numberOfLines={1}>
          {actual.corto ?? actual.label}
        </Text>
        <ChevronDown size={16} color={colors.textPrimary} />
      </Pressable>

      <Modal
        visible={abierto}
        transparent
        animationType="fade"
        onRequestClose={() => setAbierto(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setAbierto(false)}
          accessibilityLabel="Cerrar"
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={[type.section, styles.title]} accessibilityRole="header">
            Ordenar por
          </Text>
          {ORDENES.map((o) => {
            const sel = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => elegir(o.value)}
                style={styles.option}
                accessibilityRole="radio"
                accessibilityState={{ checked: sel }}
                testID={`orden-${o.value}`}
              >
                <Text style={[type.body, { color: sel ? colors.primary : colors.textPrimary }]}>
                  {o.label}
                </Text>
                {sel ? <Check size={20} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
  },
  prefijo: { color: colors.textSecondary },
  valor: { flexShrink: 1, color: colors.textPrimary },
  backdrop: { flex: 1, backgroundColor: 'rgba(13,11,20,0.4)' },
  sheet: {
    backgroundColor: colors.bgScreen,
    borderTopLeftRadius: radius.cardLarge,
    borderTopRightRadius: radius.cardLarge,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  title: { color: colors.textPrimary, marginBottom: 8 },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
});

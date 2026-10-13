import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/spacing';
import { type } from '../../constants/typography';
import { ORDENES } from '../../utils/obras';

/** "Recientes ▾": abre una hoja con las opciones de orden. */
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
        testID="ordenar"
      >
        <Text style={[type.metaBold, { color: colors.textPrimary }]}>
          {actual.value === 'recientes' ? 'Recientes' : actual.label}
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
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 24 },
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

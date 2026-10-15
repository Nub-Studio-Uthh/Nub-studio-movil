import { memo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from '../ui/Chip';

/**
 * Fila de categorías con "Todas". Una sola categoría a la vez (el backend filtra por una).
 * @param {{ categorias: {id:number,nombre:string}[], seleccionada: {id:number}|null,
 *   onSelect: (categoria|null) => void, contentStyle?: object }} props
 */
function CategoryChipsBase({ categorias, seleccionada, onSelect, contentStyle }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, contentStyle]}
      accessibilityRole="tablist"
    >
      <Chip
        label="Todas"
        selected={!seleccionada}
        onPress={() => onSelect(null)}
        testID="categoria-todas"
      />
      {categorias.map((c) => (
        <Chip
          key={c.id}
          label={c.nombre}
          selected={seleccionada?.id === c.id}
          onPress={() => onSelect(seleccionada?.id === c.id ? null : c)}
          testID={`categoria-${c.slug || c.id}`}
        />
      ))}
    </ScrollView>
  );
}

export const CategoryChips = memo(CategoryChipsBase);

const styles = StyleSheet.create({
  row: { gap: 8 },
});

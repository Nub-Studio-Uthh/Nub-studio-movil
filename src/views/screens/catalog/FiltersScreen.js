import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { type } from '../../../constants/typography';
import { SCREEN_MARGIN } from '../../../constants/layout';
import { useFiltersViewModel } from '../../../viewmodels/useFiltersViewModel';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { PriceInput } from '../../components/catalog/PriceInput';
import { PriceRangeSlider } from '../../components/catalog/PriceRangeSlider';
import { CHIPS_CATEGORIAS, ShimmerProvider, SkeletonChipRow } from '../../components/skeleton';

/**
 * Hoja de filtros (HU-01): una categoría y un rango de precio que se combinan.
 * Los cambios se aplican al tocar "Aplicar"; "Limpiar" quita categoría y precio.
 */
export function FiltersScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    categorias,
    topePrecio,
    borrador,
    error,
    nActivos: n,
    cambiar,
    elegirCategoria,
    limpiar,
    aplicar,
  } = useFiltersViewModel();

  const aplicarYCerrar = () => {
    if (aplicar()) navigation.goBack();
  };

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} testID="hoja-filtros">
      <View style={styles.header}>
        <Text style={[type.section, { color: colors.textPrimary }]} accessibilityRole="header">
          Filtros
        </Text>
        <IconButton
          label="Cerrar filtros"
          onPress={() => navigation.goBack()}
          round
          icon={<X size={20} color={colors.textPrimary} />}
          testID="cerrar-filtros"
        />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <Text style={styles.label}>CATEGORÍA</Text>
        {categorias.isLoading ? (
          <ShimmerProvider>
            <SkeletonChipRow widths={CHIPS_CATEGORIAS} style={styles.chipsSkeleton} />
          </ShimmerProvider>
        ) : categorias.error ? (
          <Text style={[type.bodySmall, { color: colors.textSecondary }]}>
            No pudimos cargar las categorías.
          </Text>
        ) : (
          <View style={styles.chips}>
            {categorias.data.map((c) => (
              <Chip
                key={c.id}
                label={c.nombre}
                selected={borrador.categoria?.id === c.id}
                onPress={() => elegirCategoria(c)}
                testID={`filtro-categoria-${c.slug || c.id}`}
              />
            ))}
          </View>
        )}

        <Text style={[styles.label, styles.labelSpaced]}>RANGO DE PRECIO (MXN)</Text>
        <View style={styles.inputs}>
          <PriceInput
            label="Mínimo"
            value={borrador.precioMin}
            onChange={(precioMin) => cambiar({ precioMin })}
            placeholder="0"
            invalid={!!error}
            testID="precio-minimo"
          />
          <PriceInput
            label="Máximo"
            value={borrador.precioMax}
            onChange={(precioMax) => cambiar({ precioMax })}
            placeholder="Sin límite"
            invalid={!!error}
            testID="precio-maximo"
          />
        </View>
        <PriceRangeSlider
          min={0}
          max={topePrecio}
          step={100}
          low={borrador.precioMin}
          high={borrador.precioMax}
          onChange={(precioMin, precioMax) => cambiar({ precioMin, precioMax })}
        />
        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite" testID="error-precio">
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <View style={styles.actions}>
        <Button
          label="Limpiar"
          variant="ghost"
          onPress={limpiar}
          disabled={n === 0}
          style={styles.flex}
          testID="limpiar-filtros"
        />
        <Button
          label={n ? `Aplicar (${n})` : 'Aplicar'}
          onPress={aplicarYCerrar}
          disabled={!!error}
          style={styles.flex}
          testID="aplicar-filtros"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { backgroundColor: colors.bgScreen, paddingTop: 20 },
  header: {
    paddingHorizontal: SCREEN_MARGIN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  body: { paddingHorizontal: SCREEN_MARGIN, paddingTop: 16, paddingBottom: 8 },
  label: { ...type.badge, fontSize: 11, letterSpacing: 1.5, color: colors.textSecondary },
  labelSpaced: { marginTop: 24 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chipsSkeleton: { marginTop: 12 },
  inputs: { flexDirection: 'row', gap: 12, marginTop: 12, marginBottom: 8 },
  error: { ...type.caption, color: colors.error },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: SCREEN_MARGIN, paddingTop: 16 },
  flex: { flex: 1 },
});

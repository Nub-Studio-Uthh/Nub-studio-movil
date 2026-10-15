import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { type } from '../../constants/typography';
import { SCREEN_MARGIN } from '../../constants/layout';
import { useCatalogFilters } from '../../models/CatalogFiltersContext';
import { useRemoteData } from '../../hooks/useRemoteData';
import { getCategorias } from '../../models/categoriaService';
import { getObras } from '../../models/obraService';
import { contarFiltros, validarRangoPrecio } from '../../utils/obras';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { PriceInput } from '../../components/catalog/PriceInput';
import { PriceRangeSlider } from '../../components/catalog/PriceRangeSlider';
import { CHIPS_CATEGORIAS, ShimmerProvider, SkeletonChipRow } from '../../components/skeleton';

const TOPE_POR_DEFECTO = 10000;

// Precio más alto del catálogo, redondeado hacia arriba a miles, como tope del deslizador.
async function getTopePrecio(signal) {
  const { items } = await getObras({ ordenar: 'precio_desc' }, { limit: 1, signal });
  const mayor = items[0]?.precio ?? 0;
  return mayor > 0 ? Math.ceil(mayor / 1000) * 1000 : TOPE_POR_DEFECTO;
}

/**
 * Hoja de filtros (HU-01): una categoría y un rango de precio que se combinan.
 * Los cambios se aplican al tocar "Aplicar"; "Limpiar" quita categoría y precio.
 */
export function FiltersScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { filtros, actualizar } = useCatalogFilters();
  const categorias = useRemoteData((signal) => getCategorias({ signal }), []);
  const tope = useRemoteData(getTopePrecio, TOPE_POR_DEFECTO);

  const [borrador, setBorrador] = useState({
    categoria: filtros.categoria,
    precioMin: filtros.precioMin,
    precioMax: filtros.precioMax,
  });
  const cambiar = (cambios) => setBorrador((b) => ({ ...b, ...cambios }));

  const error = validarRangoPrecio(borrador.precioMin, borrador.precioMax);
  const n = contarFiltros(borrador);

  const aplicar = () => {
    if (error) return;
    actualizar(borrador);
    navigation.goBack();
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
                onPress={() =>
                  cambiar({
                    categoria:
                      borrador.categoria?.id === c.id ? null : { id: c.id, nombre: c.nombre },
                  })
                }
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
          max={tope.data}
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
          onPress={() => cambiar({ categoria: null, precioMin: null, precioMax: null })}
          disabled={n === 0}
          style={styles.flex}
          testID="limpiar-filtros"
        />
        <Button
          label={n ? `Aplicar (${n})` : 'Aplicar'}
          onPress={aplicar}
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

import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/spacing';
import { GRID_GAP, GRID_ROW_GAP, SCREEN_MARGIN, itemsToFill } from '../../../constants/layout';
import {
  SkeletonBlock,
  SkeletonContainer,
  SkeletonLine,
  SkeletonObraCard,
} from '../../components/skeleton';
import { ALTO_TARJETA, PORTADA } from '../../components/coleccion/ColeccionCard';

const SEPARACION = 16;

/** Tarjeta de colección en carga: mide lo mismo que ColeccionCard. */
function SkeletonTarjeta() {
  return (
    <View style={styles.card}>
      <SkeletonBlock width={PORTADA} height={PORTADA} />
      <View style={styles.texts}>
        <SkeletonLine boxHeight={23} width="80%" height={14} />
        <SkeletonLine boxHeight={20} width="95%" height={10} />
        <SkeletonBlock width={72} height={20} radius={radius.badge} />
      </View>
    </View>
  );
}

/** Colecciones en carga: las tarjetas que llenan la pantalla (mínimo 3). */
export function ColeccionesSkeleton({ topOffset = 120 }) {
  const { height } = useWindowDimensions();
  const tarjetas = itemsToFill(height - topOffset, ALTO_TARJETA, SEPARACION, 3);
  return (
    <SkeletonContainer label="Cargando colecciones" style={styles.box}>
      <View style={styles.list}>
        {Array.from({ length: tarjetas }, (_, i) => (
          <SkeletonTarjeta key={i} />
        ))}
      </View>
    </SkeletonContainer>
  );
}

/**
 * Detalle de colección en carga cuando no hay datos previos (p. ej. al abrirla desde
 * Inicio): portada, nombre, artista, historia y una fila de obras.
 */
export function ColeccionSkeleton({ portadaAlto }) {
  return (
    <SkeletonContainer label="Cargando colección">
      <SkeletonBlock width="100%" height={portadaAlto} radius={0} />
      <View style={[styles.box, styles.detalle]}>
        <SkeletonBlock width={88} height={20} radius={radius.badge} />
        <SkeletonLine boxHeight={34} width="70%" height={20} />
        <View style={styles.artista}>
          <SkeletonBlock width={40} height={40} shape="circle" />
          <SkeletonLine boxHeight={19} width={120} height={12} />
        </View>
        <SkeletonLine boxHeight={20} width="100%" height={10} />
        <SkeletonLine boxHeight={20} width="85%" height={10} />
        <SkeletonLine boxHeight={23} width={170} height={14} style={styles.seccion} />
        <View style={styles.grid}>
          <SkeletonObraCard variant="catalogo" />
          <SkeletonObraCard variant="catalogo" />
        </View>
      </View>
    </SkeletonContainer>
  );
}

/** Obras de la colección en carga: una fila de la cuadrícula de 2 columnas. */
export function ObrasColeccionSkeleton() {
  return (
    <SkeletonContainer label="Cargando obras de la colección">
      <View style={styles.grid}>
        <SkeletonObraCard variant="catalogo" />
        <SkeletonObraCard variant="catalogo" />
      </View>
    </SkeletonContainer>
  );
}

const styles = StyleSheet.create({
  box: { paddingHorizontal: SCREEN_MARGIN },
  list: { gap: SEPARACION },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 7,
    paddingRight: 14,
    minHeight: ALTO_TARJETA,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgScreen,
  },
  texts: { flex: 1, gap: 6, paddingVertical: 8 },
  detalle: { paddingTop: 24, gap: 14 },
  artista: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  seccion: { marginTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: GRID_GAP, rowGap: GRID_ROW_GAP },
});

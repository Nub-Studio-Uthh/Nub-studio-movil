import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/spacing';
import { itemsToFill, useLayout } from '../../../constants/layout';
import { SkeletonBlock, SkeletonContainer, SkeletonLine } from '../../components/skeleton';
import { IMAGEN_DESTACADA, THUMB } from '../../components/blog/PostCard';

const ALTO_FILA = THUMB + 16;
const SEPARACION = 16;

/** Tarjeta destacada en carga: mide lo mismo que PostCard "destacada". */
function SkeletonDestacada({ ancho }) {
  const imagen = ancho - 16 - 2;
  return (
    <View style={styles.card}>
      <SkeletonBlock width={imagen} height={Math.round(imagen * IMAGEN_DESTACADA)} />
      <View style={styles.texts}>
        <SkeletonLine boxHeight={16} width={120} height={10} />
        <SkeletonLine boxHeight={23} width="90%" height={14} />
        <SkeletonLine boxHeight={23} width="60%" height={14} />
        <SkeletonLine boxHeight={20} width="80%" height={10} />
      </View>
    </View>
  );
}

/** Tarjeta en fila en carga: mide lo mismo que PostCard "fila". */
export function SkeletonFila() {
  return (
    <View style={[styles.card, styles.row]}>
      <SkeletonBlock width={THUMB} height={THUMB} />
      <View style={styles.rowTexts}>
        <SkeletonLine boxHeight={19} width="85%" height={12} />
        <SkeletonLine boxHeight={16} width={80} height={10} />
      </View>
    </View>
  );
}

/** Blog en carga: la tarjeta destacada y las filas que llenan la pantalla (mínimo 2). */
export function BlogSkeleton({ topOffset = 180 }) {
  const { content } = useLayout();
  const { height } = useWindowDimensions();
  const destacada = Math.round((content - 18) * IMAGEN_DESTACADA) + 110;
  const filas = itemsToFill(height - topOffset - destacada, ALTO_FILA, SEPARACION, 2);

  return (
    <SkeletonContainer label="Cargando publicaciones" style={styles.list}>
      <SkeletonDestacada ancho={content} />
      {Array.from({ length: filas }, (_, i) => (
        <SkeletonFila key={i} />
      ))}
    </SkeletonContainer>
  );
}

const styles = StyleSheet.create({
  list: { gap: SEPARACION },
  card: {
    padding: 7,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgScreen,
  },
  texts: { paddingHorizontal: 9, paddingTop: 12, paddingBottom: 6, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingRight: 16 },
  rowTexts: { flex: 1, gap: 4 },
});

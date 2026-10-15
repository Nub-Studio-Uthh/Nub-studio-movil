import { StyleSheet, View } from 'react-native';
import { GRID_GAP, GRID_ROW_GAP, SCREEN_MARGIN } from '../../../constants/layout';
import { radius } from '../../../constants/spacing';
import {
  SkeletonBlock,
  SkeletonContainer,
  SkeletonLine,
  SkeletonObraCard,
} from '../../components/skeleton';
import { AVATAR } from '../../components/artist/ArtistaHeader';

/** Perfil de artista en carga: mismas medidas que ArtistaHeader y la cuadrícula de obras. */
export function PerfilArtistaSkeleton() {
  return (
    <SkeletonContainer label="Cargando perfil del artista" style={styles.box}>
      <View style={styles.header}>
        <SkeletonBlock width={AVATAR} height={AVATAR} shape="circle" />
        <SkeletonLine boxHeight={30} width={180} height={18} style={styles.mt} />
        <SkeletonLine boxHeight={20} width={140} height={10} />
        <View style={styles.datos}>
          <SkeletonBlock width={48} height={40} radius={radius.input} />
          <SkeletonBlock width={48} height={40} radius={radius.input} />
        </View>
        <SkeletonBlock width="100%" height={88} radius={radius.card} />
      </View>
      <SkeletonLine boxHeight={23} width={120} height={14} style={styles.titulo} />
      <View style={styles.grid}>
        <SkeletonObraCard variant="catalogo" />
        <SkeletonObraCard variant="catalogo" />
      </View>
    </SkeletonContainer>
  );
}

const styles = StyleSheet.create({
  box: { paddingHorizontal: SCREEN_MARGIN },
  header: { alignItems: 'center', gap: 8 },
  mt: { marginTop: 8 },
  datos: { flexDirection: 'row', gap: 56, marginTop: 16, marginBottom: 8 },
  titulo: { marginTop: 24, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: GRID_GAP, rowGap: GRID_ROW_GAP },
});

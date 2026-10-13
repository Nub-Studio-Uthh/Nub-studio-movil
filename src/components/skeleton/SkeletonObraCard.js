import { StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';
import { cardShadow, radius } from '../../constants/spacing';
import { useLayout } from '../../constants/layout';
import { SkeletonBlock, SkeletonLine } from './SkeletonBlock';

/** Tarjeta de obra en carga: mismas medidas que ObraCard (useLayout). */
export function SkeletonObraCard({ variant = 'catalogo' }) {
  const { card } = useLayout();
  return (
    <View style={[styles.card, { width: card.width }]}>
      <View>
        <SkeletonBlock
          width={card.imageWidth}
          height={card.imageHeight[variant]}
          radius={radius.image}
        />
        <View style={styles.heart} />
      </View>
      <View style={styles.texts}>
        <View style={styles.top}>
          <SkeletonLine boxHeight={19} width={card.bars.title} height={12} />
          <SkeletonLine boxHeight={16} width={card.bars.artist} height={10} />
        </View>
        <SkeletonLine boxHeight={23} width={card.bars.price} height={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: 7,
    paddingHorizontal: 7,
    paddingBottom: 12,
    gap: 7,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgScreen,
    ...cardShadow,
  },
  heart: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  texts: { paddingLeft: 6, gap: 6 },
  top: { gap: 2 },
});

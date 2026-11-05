import { useCallback, useState } from 'react';
import { FlatList, PixelRatio, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../constants/colors';
import { radius } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { useLayout } from '../../../constants/layout';
import { imagenSegura } from '../../../utils/obras';
import { Badge } from '../ui/Badge';

export const DOTS_GAP = 4; // separación entre el banner y los puntos

/**
 * Carrusel de obras destacadas de Inicio: banner de ancho de contenido × (C · 190/350),
 * radio 20, y puntos debajo (8 el activo, 6 los demás).
 */
export function HeroCarousel({ obras, onPress }) {
  const { banner } = useLayout();
  const [activo, setActivo] = useState(0);

  const onScroll = useCallback(
    (e) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / banner.width);
      setActivo((prev) => (prev === i ? prev : i));
    },
    [banner.width]
  );

  const renderItem = useCallback(
    ({ item, index }) => {
      const uri = imagenSegura(item.imagen, banner.width * PixelRatio.get());
      return (
        <Pressable
          onPress={() => onPress?.(item)}
          style={[styles.slide, { width: banner.width, height: banner.height }]}
          accessibilityRole="button"
          accessibilityLabel={`Obra destacada ${index + 1} de ${obras.length}: ${item.titulo}, de ${item.artista}`}
          testID={`destacada-${index}`}
        >
          {uri ? (
            <Image
              source={{ uri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              recyclingKey={String(item.id)}
            />
          ) : null}
          <LinearGradient
            colors={['transparent', 'rgba(13,11,20,0.75)']}
            start={{ x: 0, y: 0.35 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Badge label="Destacada" tone="destacada" onImage style={styles.badge} />
          <View style={styles.texts}>
            <View style={styles.titleBox}>
              <Text style={styles.title} numberOfLines={1}>
                {item.titulo}
              </Text>
            </View>
            <Text style={styles.meta} numberOfLines={1}>
              {[item.artista, item.categoria].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </Pressable>
      );
    },
    [banner.width, banner.height, obras.length, onPress]
  );

  return (
    <View>
      <View style={{ width: banner.width, height: banner.height }}>
        <FlatList
          data={obras}
          keyExtractor={(o) => String(o.id)}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={32}
          getItemLayout={(_, i) => ({ length: banner.width, offset: banner.width * i, index: i })}
          style={styles.list}
        />
      </View>
      {obras.length > 1 ? (
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no">
          {obras.map((o, i) => (
            <View
              key={o.id}
              style={[styles.dot, i === activo ? styles.dotActive : styles.dotIdle]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { borderRadius: radius.card, overflow: 'hidden' },
  slide: { borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.skeletonBase },
  badge: { position: 'absolute', top: 10, left: 19 },
  texts: { position: 'absolute', left: 19, right: 19, bottom: 18, gap: 6 },
  titleBox: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: colors.bgScreen,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  title: { ...type.section, fontSize: 22, lineHeight: 28, color: colors.textPrimary },
  meta: { ...type.meta, color: colors.textOnDark },
  dots: {
    marginTop: DOTS_GAP,
    height: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  dot: { borderRadius: 4 },
  dotActive: { width: 8, height: 8, backgroundColor: colors.primary },
  dotIdle: { width: 6, height: 6, backgroundColor: colors.borderDefault },
});

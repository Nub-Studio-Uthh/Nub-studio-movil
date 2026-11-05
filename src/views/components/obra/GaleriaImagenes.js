import { useCallback, useState } from 'react';
import { FlatList, PixelRatio, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { useLayout } from '../../../constants/layout';
import { radius, space } from '../../../constants/spacing';
import { imagenSegura } from '../../../utils/obras';
import { IconButton } from '../ui/IconButton';

// Espacio para la fila del botón de regreso, debajo de la barra de estado.
const FILA_SUPERIOR = 56;
// Alto de la zona de puntos debajo de la foto.
const ZONA_PUNTOS = 8 + space.lg * 2;

/**
 * Galería de imágenes del detalle de obra (pantalla 07): fondo oscuro, foto centrada
 * (medidas de useLayout().detailImage), puntos debajo y botón de regreso arriba.
 * @param {{ imagenes: string[], titulo?: string, onBack?: () => void }} props
 */
export function GaleriaImagenes({ imagenes = [], titulo = 'obra', onBack }) {
  const { width, detailImage } = useLayout();
  const insets = useSafeAreaInsets();
  const [activo, setActivo] = useState(0);
  const alto = insets.top + FILA_SUPERIOR + detailImage.height + ZONA_PUNTOS;

  const onScroll = useCallback(
    (e) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / width);
      setActivo((prev) => (prev === i ? prev : i));
    },
    [width]
  );

  const renderItem = useCallback(
    ({ item, index }) => {
      const uri = imagenSegura(item, detailImage.width * PixelRatio.get());
      return (
        <View
          style={[styles.slide, { width, paddingTop: insets.top + FILA_SUPERIOR }]}
          accessible
          accessibilityLabel={`${titulo}, imagen ${index + 1} de ${imagenes.length}`}
        >
          <View style={[styles.foto, { width: detailImage.width, height: detailImage.height }]}>
            {uri ? (
              <Image
                source={{ uri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                recyclingKey={`${index}-${item}`}
                accessibilityIgnoresInvertColors
              />
            ) : null}
          </View>
        </View>
      );
    },
    [width, detailImage.width, detailImage.height, insets.top, titulo, imagenes.length]
  );

  return (
    <View style={[styles.box, { width, height: alto }]}>
      <FlatList
        data={imagenes}
        keyExtractor={(item, i) => `${i}-${item}`}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        testID="galeria-imagenes"
      />
      <View style={[styles.top, { top: insets.top + space.sm }]} pointerEvents="box-none">
        <IconButton
          icon={<ArrowLeft size={20} color={colors.textPrimary} />}
          label="Regresar"
          onPress={onBack}
          round
          testID="detalle-regresar"
        />
      </View>
      {imagenes.length > 1 ? (
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no">
          {imagenes.map((_, i) => (
            <View key={i} style={[styles.dot, i === activo ? styles.dotActive : styles.dotIdle]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.bgDark },
  slide: { alignItems: 'center' },
  foto: { borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.skeletonBaseDark },
  top: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row' },
  dots: {
    position: 'absolute',
    bottom: space.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: { borderRadius: 4 },
  dotActive: { width: 8, height: 8, backgroundColor: colors.primary },
  dotIdle: { width: 6, height: 6, backgroundColor: 'rgba(255,255,255,0.4)' },
});

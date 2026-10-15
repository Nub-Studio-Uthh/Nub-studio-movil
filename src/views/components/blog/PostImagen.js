import { PixelRatio, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../constants/colors';
import { imagenSegura } from '../../../utils/obras';

/**
 * Imagen destacada de un post. Si no tiene (o no es https), se muestra el degradado
 * de marca del prototipo para que la tarjeta no quede vacía.
 * @param {{ uri?: string|null, width: number, height: number, radius?: number,
 *   recyclingKey?: string, style?: object, children?: React.ReactNode }} props
 */
export function PostImagen({ uri, width, height, radius = 14, recyclingKey, style, children }) {
  const segura = imagenSegura(uri, width * PixelRatio.get());
  return (
    <View style={[styles.box, { width, height, borderRadius: radius }, style]}>
      {segura ? (
        <Image
          source={{ uri: segura }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          recyclingKey={recyclingKey}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          testID="imagen-sin-foto"
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', backgroundColor: colors.skeletonBase },
});

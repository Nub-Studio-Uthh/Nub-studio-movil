import { PixelRatio, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MapPin } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { radius, space } from '../../../constants/spacing';
import { fonts, type } from '../../../constants/typography';
import { imagenSegura } from '../../../utils/obras';

export const AVATAR = 96;

/** Un dato del perfil: número grande y su etiqueta (Obras, Desde). */
function Dato({ valor, etiqueta, testID }) {
  return (
    <View style={styles.dato} testID={testID}>
      <Text style={styles.datoValor}>{valor}</Text>
      <Text style={[type.meta, styles.secondary]}>{etiqueta}</Text>
    </View>
  );
}

/**
 * Encabezado del perfil de artista (HU-03): foto o iniciales, nombre, ciudad,
 * categoría, número de obras y colecciones, año desde que está en NU-B y biografía.
 * @param {{ artista: ReturnType<typeof import('../../../utils/artistas').normalizarArtista>,
 *   iniciales: string, totalObras: number, totalColecciones?: number|null }} props
 */
export function ArtistaHeader({ artista, iniciales, totalObras, totalColecciones }) {
  const uri = imagenSegura(artista.foto, AVATAR * PixelRatio.get());
  const lugar = [artista.ciudad, artista.categoria].filter(Boolean).join(' · ');

  return (
    <View style={styles.box}>
      <View style={styles.avatar}>
        {uri ? (
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Text style={styles.iniciales} testID="perfil-iniciales">
            {iniciales}
          </Text>
        )}
      </View>

      <Text style={styles.nombre} accessibilityRole="header" testID="perfil-nombre">
        {artista.nombre}
      </Text>
      {lugar ? (
        <View style={styles.lugar}>
          <MapPin size={16} color={colors.textSecondary} strokeWidth={1.5} />
          <Text style={[type.bodySmall, styles.secondary]}>{lugar}</Text>
        </View>
      ) : null}

      <View style={styles.datos}>
        <Dato
          valor={totalObras}
          etiqueta={totalObras === 1 ? 'Obra' : 'Obras'}
          testID="perfil-total-obras"
        />
        {totalColecciones !== null && totalColecciones !== undefined ? (
          <Dato
            valor={totalColecciones}
            etiqueta={totalColecciones === 1 ? 'Colección' : 'Colecciones'}
            testID="perfil-total-colecciones"
          />
        ) : null}
        {artista.desde ? (
          <Dato valor={artista.desde} etiqueta="Desde" testID="perfil-desde" />
        ) : null}
      </View>

      {artista.biografia ? (
        <View style={styles.bio}>
          <Text style={[type.bodySmall, styles.secondary]} testID="perfil-biografia">
            {artista.biografia}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: space.sm },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radius.avatar,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iniciales: { fontFamily: fonts.bold, fontSize: 36, color: colors.textOnDark },
  nombre: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: space.sm,
  },
  lugar: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secondary: { color: colors.textSecondary },
  datos: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  dato: { alignItems: 'center', gap: 2 },
  datoValor: { fontFamily: fonts.numeric, fontSize: 20, color: colors.textPrimary },
  bio: {
    alignSelf: 'stretch',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.card,
    padding: space.lg,
    marginTop: space.sm,
  },
});

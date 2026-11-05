import { memo, useMemo, useState } from 'react';
import { PixelRatio, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../../constants/colors';
import { fonts, type } from '../../../constants/typography';
import { radius } from '../../../constants/spacing';
import { htmlABloques } from '../../../utils/blog';
import { imagenSegura } from '../../../utils/obras';

/** Texto con partes en negrita o cursiva. */
function Partes({ partes, style, negritaFont = fonts.bold }) {
  return (
    <Text style={style}>
      {partes.map((p, i) => (
        <Text
          key={i}
          style={[p.negrita && { fontFamily: negritaFont }, p.cursiva && styles.cursiva]}
        >
          {p.texto}
        </Text>
      ))}
    </Text>
  );
}

/** Imagen dentro del contenido: ocupa el ancho y respeta su proporción al cargar. */
function ImagenContenido({ uri, alt, width, index }) {
  const [proporcion, setProporcion] = useState(4 / 3);
  const segura = imagenSegura(uri, width * PixelRatio.get());
  if (!segura) return null; // solo imágenes https
  return (
    <View style={styles.figura}>
      <Image
        source={{ uri: segura }}
        style={[styles.imagen, { width, height: Math.round(width / proporcion) }]}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
        accessibilityLabel={alt || undefined}
        accessible={!!alt}
        onLoad={(e) => {
          const { width: w, height: h } = e?.source ?? {};
          if (w > 0 && h > 0) setProporcion(Math.min(Math.max(w / h, 0.6), 2.4));
        }}
        testID={`post-imagen-${index}`}
      />
      {alt ? <Text style={[type.meta, styles.pie]}>{alt}</Text> : null}
    </View>
  );
}

/**
 * Cuerpo de una publicación (HU-05): convierte el HTML del editor de la web en
 * títulos, párrafos, listas, citas e imágenes nativas.
 * @param {{ html: string|null, width: number, testID?: string }} props
 */
function ContenidoPostBase({ html, width, testID = 'post-contenido' }) {
  const bloques = useMemo(() => htmlABloques(html), [html]);

  return (
    <View style={styles.box} testID={testID}>
      {bloques.map((b, i) => {
        switch (b.tipo) {
          case 'titulo':
            return (
              <Partes
                key={i}
                partes={b.partes}
                style={[type.section, styles.titulo]}
                negritaFont={fonts.bold}
              />
            );
          case 'item':
            return (
              <View key={i} style={styles.item}>
                <Text style={[styles.parrafo, styles.vineta]}>•</Text>
                <Partes partes={b.partes} style={[styles.parrafo, styles.flex]} />
              </View>
            );
          case 'cita':
            return (
              <View key={i} style={styles.cita}>
                <Partes partes={b.partes} style={[styles.parrafo, styles.cursiva]} />
              </View>
            );
          case 'imagen':
            return <ImagenContenido key={i} uri={b.uri} alt={b.alt} width={width} index={i} />;
          default:
            return <Partes key={i} partes={b.partes} style={styles.parrafo} />;
        }
      })}
    </View>
  );
}

export const ContenidoPost = memo(ContenidoPostBase);

const styles = StyleSheet.create({
  box: { gap: 16 },
  titulo: { color: colors.textPrimary, marginTop: 8 },
  parrafo: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.textPrimary },
  cursiva: { fontStyle: 'italic' },
  item: { flexDirection: 'row', gap: 8, paddingLeft: 4 },
  vineta: { color: colors.primary },
  flex: { flex: 1 },
  cita: { borderLeftWidth: 3, borderLeftColor: colors.primary, paddingLeft: 12 },
  figura: { gap: 8 },
  imagen: { borderRadius: radius.image, backgroundColor: colors.skeletonBase },
  pie: { color: colors.textMuted },
});

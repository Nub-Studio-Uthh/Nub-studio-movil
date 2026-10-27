import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, Info, Star, TriangleAlert } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { radius, space } from '../../../constants/spacing';
import { fonts, type } from '../../../constants/typography';
import { partirNegritas } from '../../../utils/legal';

// Mismos colores de recuadro que la página legal de la web.
const RECUADROS = {
  important: { color: colors.warning, fondo: '#FFF8E6', Icono: Star },
  info: { color: colors.info, fondo: '#EEF4FC', Icono: Info },
  warning: { color: colors.error, fondo: '#FCEEF1', Icono: TriangleAlert },
  success: { color: colors.success, fondo: '#EAF6F0', Icono: CheckCircle2 },
};

/** Texto con **negritas** convertido en <Text> anidados. */
function TextoRico({ texto, style, negritaStyle }) {
  return (
    <Text style={style}>
      {partirNegritas(texto).map((p, i) =>
        p.negrita ? (
          <Text key={i} style={[styles.negrita, negritaStyle]}>
            {p.texto}
          </Text>
        ) : (
          p.texto
        )
      )}
    </Text>
  );
}

function Lista({ items, numerada }) {
  return (
    <View style={styles.lista}>
      {items.map((li, i) => (
        <View key={i} style={styles.item}>
          <Text style={[type.bodySmall, styles.vineta]}>{numerada ? `${i + 1}.` : '•'}</Text>
          <TextoRico texto={li} style={[type.bodySmall, styles.parrafo, styles.flex]} />
        </View>
      ))}
    </View>
  );
}

/**
 * Un bloque de un documento legal (ver constants/legalComun.js). Las tablas de la web se
 * dibujan como tarjetas, una por fila, porque en un teléfono no caben varias columnas.
 */
export function BloqueLegal({ bloque: b }) {
  switch (b?.t) {
    case 'p':
      return <TextoRico texto={b.x} style={[type.bodySmall, styles.parrafo]} />;
    case 'h3':
      return <Text style={[type.cardTitle, styles.h3]}>{b.x}</Text>;
    case 'ul':
      return <Lista items={b.x} />;
    case 'ol':
      return <Lista items={b.x} numerada />;
    case 'box': {
      const r = RECUADROS[b.k] ?? RECUADROS.info;
      return (
        <View style={[styles.box, { backgroundColor: r.fondo, borderLeftColor: r.color }]}>
          <r.Icono size={16} color={r.color} style={styles.boxIcono} />
          <View style={styles.flex}>
            <TextoRico texto={b.x} style={[type.bodySmall, styles.parrafo]} />
            {b.list ? <Lista items={b.list} /> : null}
          </View>
        </View>
      );
    }
    case 'table':
      return (
        <View style={styles.tabla}>
          {b.rows.map((fila, i) => (
            <View key={i} style={[styles.fila, i > 0 && styles.filaBorde]}>
              {fila.map((celda, j) => (
                <View key={j} style={styles.celda}>
                  <Text style={[type.badge, styles.encabezado]}>{b.head[j]?.toUpperCase()}</Text>
                  <TextoRico texto={celda} style={[type.bodySmall, styles.parrafo]} />
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    case 'contact':
      return (
        <View style={styles.contacto}>
          <Text style={[type.section, styles.contactoTitulo]}>{b.title}</Text>
          {b.lines.map((l, i) => (
            <TextoRico
              key={i}
              texto={l}
              style={[type.bodySmall, styles.contactoTexto]}
              negritaStyle={styles.contactoNegrita}
            />
          ))}
        </View>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  parrafo: { color: colors.textSecondary, lineHeight: 22 },
  negrita: { fontFamily: fonts.semibold, color: colors.textPrimary },
  h3: { color: colors.textPrimary, marginTop: space.sm },
  lista: { gap: space.xs },
  item: { flexDirection: 'row', gap: space.sm, paddingRight: space.xs },
  vineta: { color: colors.textSecondary, minWidth: 16, lineHeight: 22 },
  box: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.md,
    borderLeftWidth: 3,
    borderRadius: 6,
  },
  boxIcono: { marginTop: 3 },
  tabla: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radius.card,
    backgroundColor: colors.bgScreen,
    overflow: 'hidden',
  },
  fila: { padding: space.md, gap: space.sm },
  filaBorde: { borderTopWidth: 1, borderTopColor: colors.borderDefault },
  celda: { gap: 2 },
  encabezado: { color: colors.secondary },
  contacto: {
    gap: space.xs,
    padding: space.xl,
    borderRadius: radius.card,
    backgroundColor: colors.textPrimary,
  },
  contactoTitulo: { color: colors.textOnDark, marginBottom: space.xs },
  contactoTexto: { color: 'rgba(255,255,255,0.78)', lineHeight: 22 },
  contactoNegrita: { color: colors.textOnDark },
});

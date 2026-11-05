import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { LEGAL, OTRO_DOCUMENTO } from '../../../constants/legal';
import { SCREEN_MARGIN } from '../../../constants/layout';
import { radius, space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { BloqueLegal } from '../../components/legal/BloqueLegal';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';

/**
 * Términos y Condiciones o Aviso de Privacidad: el mismo contenido que la página legal de
 * la web, con un índice que lleva a cada sección. route.params.tipo: 'terminos' | 'privacidad'
 */
export function LegalScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const tipo = LEGAL[route.params?.tipo] ? route.params.tipo : 'terminos';
  const doc = LEGAL[tipo];
  const otro = OTRO_DOCUMENTO[tipo];

  const scroll = useRef(null);
  const posiciones = useRef({});
  const irA = (id) => {
    const y = posiciones.current[id];
    if (y !== undefined) scroll.current?.scrollTo({ y: Math.max(0, y - space.md), animated: true });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.barra}>
        <IconButton
          label="Regresar"
          round
          onPress={() => navigation.goBack()}
          icon={<ArrowLeft size={20} color={colors.textPrimary} strokeWidth={1.5} />}
          testID="legal-regresar"
        />
      </View>
      <ScrollView
        ref={scroll}
        contentContainerStyle={[styles.contenido, { paddingBottom: space.xxl + insets.bottom }]}
        testID="legal-scroll"
      >
        <Text style={[type.badge, styles.kicker]}>DOCUMENTO LEGAL</Text>
        <Text style={[type.screenTitle, styles.titulo]} accessibilityRole="header">
          {doc.title}
        </Text>
        <Text style={[type.body, styles.subtitulo]}>{doc.subtitle}</Text>
        <View style={styles.meta}>
          <Text style={[type.meta, styles.metaTexto]}>Última actualización: {doc.updated}</Text>
          <Text style={[type.meta, styles.metaTexto]}>Versión {doc.version}</Text>
        </View>

        {doc.intro ? <BloqueLegal bloque={doc.intro} /> : null}

        <View style={styles.indice} testID="legal-indice">
          <Text style={[type.badge, styles.indiceTitulo]}>CONTENIDO</Text>
          {doc.sections.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => irA(s.id)}
              hitSlop={4}
              accessibilityRole="link"
              accessibilityLabel={`Ir a ${s.title}`}
              testID={`legal-ir-${s.id}`}
            >
              <Text style={[type.bodySmall, styles.indiceLink]}>{s.title}</Text>
            </Pressable>
          ))}
        </View>

        {doc.sections.map((s) => (
          <View
            key={s.id}
            style={styles.seccion}
            onLayout={(e) => {
              posiciones.current[s.id] = e.nativeEvent.layout.y;
            }}
            testID={`legal-seccion-${s.id}`}
          >
            <Text style={[type.section, styles.h2]} accessibilityRole="header">
              {s.title}
            </Text>
            {s.blocks.map((b, i) => (
              <BloqueLegal key={i} bloque={b} />
            ))}
          </View>
        ))}

        <View style={styles.pie}>
          <Text style={[type.caption, styles.pieTexto]}>
            © 2026 NU★B Studio · Versión {doc.version}
          </Text>
          <Button
            label={otro.label}
            variant="ghost"
            compact
            onPress={() => navigation.replace?.('Legal', { tipo: otro.tipo })}
            testID="legal-otro"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen },
  barra: { paddingHorizontal: SCREEN_MARGIN, paddingVertical: space.sm },
  contenido: { paddingHorizontal: SCREEN_MARGIN, gap: space.md },
  kicker: { color: colors.primary },
  titulo: { color: colors.textPrimary },
  subtitulo: { color: colors.textSecondary },
  meta: {
    alignSelf: 'flex-start',
    gap: 2,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radius.card,
  },
  metaTexto: { color: colors.textSecondary },
  indice: {
    gap: space.sm,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
  },
  indiceTitulo: { color: colors.secondary },
  indiceLink: { color: colors.textSecondary },
  seccion: {
    gap: space.md,
    paddingTop: space.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
  },
  h2: { color: colors.textPrimary },
  pie: {
    marginTop: space.xl,
    paddingTop: space.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
    gap: space.md,
    alignItems: 'flex-start',
  },
  pieTexto: { color: colors.textMuted },
});

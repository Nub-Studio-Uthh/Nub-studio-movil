import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, Send, X } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { radius, space } from '../../../constants/spacing';
import { fonts, type } from '../../../constants/typography';
import { formatearFecha, iniciales } from '../../../utils/blog';
import { MAX_COMENTARIO, aceptaRespuestas } from '../../../utils/comentarios';
import { Button } from '../ui/Button';
import { ErrorState } from '../states/ErrorState';

const SANGRIA = 16;

/**
 * Lista de comentarios de una publicación (HU-05). Solo dibuja: los datos y las acciones
 * llegan de useComentariosViewModel a través de la pantalla. El campo para escribir está en
 * BarraComentario, fija abajo, para que suba con el teclado como en Facebook.
 */
export function Comentarios({
  comentarios,
  titulo,
  isLoading,
  error,
  onReintentar,
  onResponder,
  esMio,
  onEliminar,
}) {
  let lista;
  if (isLoading && !comentarios.length) {
    lista = <ActivityIndicator color={colors.primary} testID="comentarios-cargando" />;
  } else if (error && !comentarios.length) {
    lista = (
      <ErrorState
        title="No pudimos cargar los comentarios"
        message={error}
        onRetry={onReintentar}
        testID="comentarios-error"
      />
    );
  } else if (!comentarios.length) {
    lista = (
      <Text style={[type.bodySmall, styles.muted]} testID="comentarios-vacio">
        Aún no hay comentarios. ¡Sé la primera persona en comentar!
      </Text>
    );
  } else {
    lista = comentarios.map((c) => (
      <Comentario
        key={c.id}
        comentario={c}
        onResponder={onResponder}
        esMio={esMio}
        onEliminar={onEliminar}
      />
    ));
  }

  return (
    <View style={styles.seccion} testID="comentarios">
      <View style={styles.encabezado}>
        <MessageCircle size={20} color={colors.textPrimary} strokeWidth={1.5} />
        <Text style={[type.section, styles.titulo]} accessibilityRole="header">
          Comentarios
        </Text>
        <Text style={[type.meta, styles.muted]} testID="comentarios-total">
          {titulo}
        </Text>
      </View>
      <View style={styles.lista}>{lista}</View>
    </View>
  );
}

/**
 * Barra fija inferior para escribir (o invitación a iniciar sesión). Vive fuera del
 * ScrollView, así el teclado la empuja hacia arriba y siempre se ve lo que se escribe.
 * Abajo deja el espacio de los botones del sistema (insets.bottom), que en teléfonos con
 * navegación por gestos es casi 0 y en los que tienen botones es su altura.
 */
export function BarraComentario({
  texto,
  onCambiarTexto,
  onEnviar,
  enviando,
  respondiendoA,
  onCancelarRespuesta,
  requiereSesion,
  puedeEscribir,
  onIniciarSesion,
}) {
  const insets = useSafeAreaInsets();
  const input = useRef(null);
  const [tecladoVisible, setTecladoVisible] = useState(false);

  useEffect(() => {
    const mostrar = Keyboard.addListener('keyboardDidShow', () => setTecladoVisible(true));
    const ocultar = Keyboard.addListener('keyboardDidHide', () => setTecladoVisible(false));
    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, []);

  // Al tocar "Responder" se abre el teclado en el campo.
  useEffect(() => {
    if (respondiendoA) input.current?.focus();
  }, [respondiendoA]);

  if (!requiereSesion && !puedeEscribir) return null;

  // Con el teclado abierto los botones del sistema quedan detrás de él.
  const abajo = tecladoVisible ? space.sm : Math.max(insets.bottom, space.sm);

  if (requiereSesion) {
    return (
      <View style={[styles.barra, { paddingBottom: abajo }]} testID="comentarios-invitar-sesion">
        <Text style={[type.bodySmall, styles.secondary, styles.flex]}>
          Inicia sesión para comentar y responder.
        </Text>
        <Button
          label="Iniciar sesión"
          variant="ghost"
          compact
          onPress={onIniciarSesion}
          testID="comentarios-iniciar-sesion"
        />
      </View>
    );
  }

  const vacio = !texto.trim();
  return (
    <View style={[styles.barraColumna, { paddingBottom: abajo }]}>
      {respondiendoA ? (
        <View style={styles.respondiendo} testID="comentarios-respondiendo">
          <Text style={[type.meta, styles.secondary, styles.flex]} numberOfLines={1}>
            Respondiendo a <Text style={styles.negrita}>{respondiendoA.autor}</Text>
          </Text>
          <Pressable
            onPress={onCancelarRespuesta}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Cancelar respuesta"
            testID="comentarios-cancelar-respuesta"
          >
            <X size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      ) : null}
      <View style={styles.caja}>
        <TextInput
          ref={input}
          value={texto}
          onChangeText={onCambiarTexto}
          placeholder={respondiendoA ? 'Escribe tu respuesta…' : 'Escribe un comentario…'}
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={MAX_COMENTARIO}
          editable={!enviando}
          accessibilityLabel="Tu comentario"
          testID="comentarios-input"
          style={[type.body, styles.input]}
        />
        <Pressable
          onPress={onEnviar}
          disabled={vacio || enviando}
          accessibilityRole="button"
          accessibilityLabel="Enviar comentario"
          accessibilityState={{ disabled: vacio || enviando }}
          testID="comentarios-enviar"
          style={[styles.enviar, (vacio || enviando) && styles.enviarOff]}
        >
          {enviando ? (
            <ActivityIndicator size="small" color={colors.textOnDark} />
          ) : (
            <Send size={18} color={colors.textOnDark} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

function Comentario({ comentario: c, onResponder, esMio, onEliminar }) {
  const mio = esMio?.(c);
  return (
    <View style={[styles.item, c.nivel > 0 && styles.respuesta]} testID={`comentario-${c.id}`}>
      <View style={styles.fila}>
        <View style={[styles.avatar, c.esArtista && styles.avatarArtista]}>
          <Text style={styles.avatarTexto}>{iniciales(c.autor)}</Text>
        </View>
        <View style={styles.cuerpo}>
          <View style={styles.autorFila}>
            <Text style={[type.metaBold, styles.autor]} numberOfLines={1}>
              {c.autor}
            </Text>
            {c.esArtista ? <Text style={[type.caption, styles.artista]}>Artista</Text> : null}
          </View>
          <Text style={[type.bodySmall, styles.texto]}>{c.contenido}</Text>
          <View style={styles.acciones}>
            {c.fecha ? (
              <Text style={[type.caption, styles.muted]}>{formatearFecha(c.fecha)}</Text>
            ) : null}
            {onResponder && aceptaRespuestas(c) ? (
              <Pressable
                onPress={() => onResponder(c)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Responder a ${c.autor}`}
                testID={`responder-${c.id}`}
              >
                <Text style={[type.metaBold, styles.accion]}>Responder</Text>
              </Pressable>
            ) : null}
            {mio ? (
              <Pressable
                onPress={() => onEliminar(c)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Eliminar mi comentario"
                testID={`eliminar-${c.id}`}
              >
                <Text style={[type.metaBold, styles.eliminar]}>Eliminar</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
      {c.respuestas.map((r) => (
        <Comentario
          key={r.id}
          comentario={r}
          onResponder={onResponder}
          esMio={esMio}
          onEliminar={onEliminar}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  seccion: {
    marginTop: space.xl,
    paddingTop: space.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
    gap: space.lg,
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  titulo: { flex: 1, color: colors.textPrimary },
  lista: { gap: space.lg },
  muted: { color: colors.textMuted },
  secondary: { color: colors.textSecondary },
  negrita: { fontFamily: fonts.bold },
  flex: { flex: 1 },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
    backgroundColor: colors.bgScreen,
  },
  barraColumna: {
    gap: space.xs,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
    backgroundColor: colors.bgScreen,
  },
  respondiendo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.xs,
  },
  caja: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    paddingLeft: space.lg,
    paddingRight: space.xs,
    paddingVertical: space.xs,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingVertical: space.sm,
    color: colors.textPrimary,
  },
  enviar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  enviarOff: { opacity: 0.4 },
  item: { gap: space.md },
  respuesta: {
    marginLeft: SANGRIA,
    paddingLeft: space.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.borderDefault,
  },
  fila: { flexDirection: 'row', gap: space.md },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.textPrimary,
  },
  avatarArtista: { backgroundColor: colors.primary },
  avatarTexto: { fontFamily: fonts.bold, fontSize: 12, color: colors.textOnDark },
  cuerpo: { flex: 1, gap: 2 },
  autorFila: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  autor: { flexShrink: 1, color: colors.textPrimary },
  artista: { color: colors.primary },
  texto: { color: colors.textPrimary },
  acciones: { flexDirection: 'row', alignItems: 'center', gap: space.lg, marginTop: space.xs },
  accion: { color: colors.textSecondary },
  eliminar: { color: colors.error },
});

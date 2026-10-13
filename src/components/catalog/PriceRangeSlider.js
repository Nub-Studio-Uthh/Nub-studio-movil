import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';
import { formatearPrecio } from '../../utils/formatters';

const THUMB = 24;

const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

/**
 * Deslizador de rango de precio con dos puntos.
 * `low`/`high` en null significan "sin límite" (se dibujan en los extremos).
 * @param {{ min: number, max: number, step?: number, low: number|null, high: number|null,
 *   onChange: (low: number|null, high: number|null) => void }} props
 */
export function PriceRangeSlider({ min, max, step = 100, low, high, onChange }) {
  const box = useRef(null);
  // Posición de la barra en la ventana y ancho útil (sin el radio de los puntos).
  const [track, setTrack] = useState({ x: 0, width: 0 });
  const lo = low ?? min;
  const hi = high ?? max;
  const span = Math.max(max - min, 1);
  const toX = (v) => ((clamp(v, min, max) - min) / span) * track.width;

  // Los extremos se convierten en null: "sin límite".
  const emitir = (nuevoLo, nuevoHi) =>
    onChange(nuevoLo <= min ? null : nuevoLo, nuevoHi >= max ? null : nuevoHi);

  // Valor según la posición absoluta del dedo (moveX): no depende de dónde empezó el gesto,
  // por eso los gestos se pueden crear de nuevo en cada render con los valores actuales.
  const valorEn = (pageX) => {
    const x = clamp(pageX - track.x, 0, track.width);
    return Math.round((min + (x / Math.max(track.width, 1)) * span) / step) * step;
  };

  const gesto = (cual) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => {
        if (!track.width) return;
        const v = valorEn(g.moveX);
        if (cual === 'lo') emitir(Math.min(v, hi), hi);
        else emitir(lo, Math.max(v, lo));
      },
    });

  const ajustar = (cual, delta) => {
    if (cual === 'lo') emitir(clamp(lo + delta, min, hi), hi);
    else emitir(lo, clamp(hi + delta, lo, max));
  };

  const thumbProps = (cual, valor, etiqueta) => ({
    ...gesto(cual).panHandlers,
    accessible: true,
    accessibilityRole: 'adjustable',
    accessibilityLabel: etiqueta,
    accessibilityValue: { min, max, now: valor, text: formatearPrecio(valor) },
    accessibilityActions: [{ name: 'increment' }, { name: 'decrement' }],
    onAccessibilityAction: (e) =>
      ajustar(cual, e.nativeEvent.actionName === 'increment' ? step * 5 : -step * 5),
    hitSlop: 10,
  });

  const medir = () =>
    box.current?.measureInWindow((x, _y, w) => setTrack({ x: x + THUMB / 2, width: w - THUMB }));

  const xLo = toX(lo);
  const xHi = toX(hi);

  return (
    <View ref={box} style={styles.box} onLayout={medir} testID="rango-precio">
      <View style={styles.track} />
      <View style={[styles.fill, { left: xLo + THUMB / 2, width: Math.max(xHi - xLo, 0) }]} />
      <View
        {...thumbProps('lo', lo, 'Precio mínimo')}
        style={[styles.thumb, { left: xLo }]}
        testID="rango-precio-minimo"
      />
      <View
        {...thumbProps('hi', hi, 'Precio máximo')}
        style={[styles.thumb, { left: xHi }]}
        testID="rango-precio-maximo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: 44, justifyContent: 'center' },
  track: {
    position: 'absolute',
    left: THUMB / 2,
    right: THUMB / 2,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderDefault,
  },
  fill: { position: 'absolute', height: 4, borderRadius: 2, backgroundColor: colors.primary },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.bgScreen,
    borderWidth: 2,
    borderColor: colors.primary,
  },
});

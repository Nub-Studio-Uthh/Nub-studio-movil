import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Minus, Plus } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { radius, space } from '../../../constants/spacing';
import { type } from '../../../constants/typography';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';

/**
 * Barra fija inferior del detalle (HU-02, HU-07 y HU-08): existencias, cantidad, favorito,
 * "Comprar ahora" y "Agregar al carrito". Solo avisa con callbacks; la pantalla decide qué hacer.
 * Mientras se guarda el favorito o se agrega al carrito los botones no responden, para no
 * mandar dos veces. Si la obra está agotada no se puede comprar.
 */
export function AccionesObra({
  favorito = false,
  guardando = false,
  agregando = false,
  comprando = false,
  existenciasTexto = '',
  agotada = false,
  cantidad = 1,
  maximo = 1,
  onMas,
  onMenos,
  onToggleFavorito,
  onAgregar,
  onComprar,
}) {
  const insets = useSafeAreaInsets();
  const ocupado = agregando || comprando;
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
      {existenciasTexto || !agotada ? (
        <View style={styles.fila}>
          <Text
            style={[type.metaBold, agotada ? styles.agotada : styles.disponibles]}
            testID="detalle-existencias"
          >
            {existenciasTexto}
          </Text>
          {!agotada ? (
            <View style={styles.cantidad} testID="detalle-cantidad">
              <Pressable
                onPress={onMenos}
                disabled={cantidad <= 1}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Quitar una pieza"
                accessibilityState={{ disabled: cantidad <= 1 }}
                style={[styles.paso, cantidad <= 1 && styles.pasoOff]}
                testID="detalle-menos"
              >
                <Minus size={16} color={colors.textPrimary} />
              </Pressable>
              <Text
                style={[type.cardTitle, styles.numero]}
                accessibilityLabel={`Cantidad: ${cantidad}`}
                testID="detalle-cantidad-valor"
              >
                {cantidad}
              </Text>
              <Pressable
                onPress={onMas}
                disabled={cantidad >= maximo}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Agregar una pieza"
                accessibilityState={{ disabled: cantidad >= maximo }}
                style={[styles.paso, cantidad >= maximo && styles.pasoOff]}
                testID="detalle-mas"
              >
                <Plus size={16} color={colors.textPrimary} />
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      <Button
        label={agotada ? 'Agotada' : comprando ? 'Preparando tu compra…' : 'Comprar ahora'}
        onPress={onComprar}
        disabled={agotada || ocupado}
        testID="detalle-comprar"
      />
      <View style={styles.fila}>
        <IconButton
          icon={
            <Heart
              size={22}
              color={favorito ? colors.favorite : colors.textPrimary}
              fill={favorito ? colors.favorite : 'transparent'}
            />
          }
          label={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          onPress={guardando ? undefined : onToggleFavorito}
          size={48}
          round
          testID="detalle-favorito"
        />
        <Button
          label={agregando ? 'Agregando…' : 'Agregar al carrito'}
          variant="ghost"
          onPress={onAgregar}
          disabled={agotada || ocupado}
          testID="detalle-agregar-carrito"
          style={styles.flex}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: space.md,
    paddingTop: space.md,
    paddingHorizontal: space.lg,
    backgroundColor: colors.bgScreen,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  flex: { flex: 1 },
  disponibles: { color: colors.success },
  agotada: { color: colors.error },
  cantidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  paso: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  pasoOff: { opacity: 0.3 },
  numero: { minWidth: 20, textAlign: 'center', color: colors.textPrimary },
});

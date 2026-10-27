import { StyleSheet, View } from 'react-native';

/**
 * Encabezado de la lista del catálogo: fila de chips y fila de "N obras · Orden".
 * Lo usan la pantalla real y su skeleton, así ocupan exactamente el mismo espacio.
 */
export function CatalogListHeader({ chips, count, sort }) {
  return (
    <View style={styles.box}>
      <View style={styles.chips}>{chips}</View>
      <View style={styles.countRow}>
        {count}
        {sort}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { paddingBottom: 13 },
  chips: { height: 36, marginHorizontal: -20 },
  countRow: {
    marginTop: 12,
    minHeight: 34,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

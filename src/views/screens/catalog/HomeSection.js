import { StyleSheet, View } from 'react-native';
import { SectionHeader } from '../../components/ui/SectionHeader';

/** Sección de Inicio: título real + contenido (real o skeleton) con las separaciones del diseño. */
export function HomeSection({ title, actionLabel, onAction, actionTestID, gap = 9, children }) {
  return (
    <View style={styles.section}>
      <SectionHeader
        title={title}
        actionLabel={actionLabel}
        onAction={onAction}
        testID={actionTestID}
      />
      <View style={{ marginTop: gap }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 22 },
});

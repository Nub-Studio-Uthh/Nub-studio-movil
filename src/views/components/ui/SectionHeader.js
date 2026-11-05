import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../constants/colors';
import { type } from '../../../constants/typography';

/** Título de sección con enlace opcional a la derecha ("Ver todas"). */
export function SectionHeader({ title, actionLabel, onAction, testID }) {
  return (
    <View style={styles.row}>
      <Text style={[type.section, { color: colors.textPrimary }]} accessibilityRole="header">
        {title}
      </Text>
      {actionLabel ? (
        <Pressable
          onPress={onAction}
          testID={testID}
          hitSlop={12}
          accessibilityRole="link"
          accessibilityLabel={`${actionLabel}: ${title}`}
        >
          <Text style={[type.metaBold, { color: colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

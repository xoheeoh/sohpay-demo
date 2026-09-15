import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';

export function PinDots({ length = 6, filled, error }: { length?: number; filled: number; error?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row} accessibilityLabel={`${filled}자리 입력됨`}>
      {Array.from({ length }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { borderColor: error ? colors.danger : colors.lineStrong },
            i < filled && { backgroundColor: error ? colors.danger : colors.primary, borderColor: 'transparent' },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14, justifyContent: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
});

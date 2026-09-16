import { layout } from '@styles';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 24 },
  list: { backgroundColor: 'white', borderRadius: 12, overflow: 'hidden' },
  pressable: { padding: 16, ...layout.rowBetween },
});

export default styles;

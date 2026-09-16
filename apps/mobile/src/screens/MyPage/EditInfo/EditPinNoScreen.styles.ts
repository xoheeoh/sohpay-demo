import { theme } from '@styles';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  wrap: { backgroundColor: theme.colors.gray50, flex: 1, position: 'relative' },
  dotContainer: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  dot: { width: 18, height: 18, borderRadius: 50 },
  activeDot: { backgroundColor: theme.colors.primary },
  inactiveDot: { backgroundColor: theme.colors.gray150 },
  keypadContainer: {
    position: 'absolute',
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
  },
  keyButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default styles;

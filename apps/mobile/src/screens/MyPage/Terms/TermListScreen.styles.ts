import { StyleSheet } from 'react-native';
import { layout, theme } from '@styles';

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: theme.screen.topCard },
  list: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
    overflow: 'hidden',
  },
  pressable: { paddingHorizontal: 16, paddingVertical: 14, ...layout.rowBetween },
  divider: { borderTopWidth: 1, borderTopColor: theme.colors.gray100 },
  pressed: { backgroundColor: theme.colors.gray50 },
});

export default styles;

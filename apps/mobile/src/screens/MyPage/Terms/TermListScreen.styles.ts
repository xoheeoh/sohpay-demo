import { StyleSheet } from 'react-native';
import { layout, theme } from '@styles';

// 마이페이지 메뉴 카드와 같은 모양 (둥근 모서리 · 그림자 · 줄 사이 연한 선)
const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 24 },
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

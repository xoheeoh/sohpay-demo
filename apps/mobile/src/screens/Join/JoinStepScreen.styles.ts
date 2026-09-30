import { StyleSheet } from 'react-native';
import { theme } from '@styles';

const styles = StyleSheet.create({
  container: { paddingTop: theme.screen.topForm, paddingHorizontal: 16, gap: 32 },
  // 단계 표시는 내용 첫 줄과 같은 높이에 붙인다
  stepBox: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: theme.screen.topForm, right: 16 },
  stepBadgeActive: {
    borderRadius: 50,
    width: 24,
    height: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadge: {
    borderRadius: 50,
    width: 24,
    height: 24,
    backgroundColor: theme.colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLine: { width: 20, height: 2, backgroundColor: theme.colors.gray150 },
  certify: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  iconButton: { margin: 0, width: 24, height: 24 },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});

export default styles;

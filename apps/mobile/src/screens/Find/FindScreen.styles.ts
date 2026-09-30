import { StyleSheet } from 'react-native';
import { theme } from '@styles';

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: theme.screen.topForm, gap: 24 },

  // ── 성공 화면(ID 찾기 · 임시 PW) ─────────────────────────────────
  successWrap: { gap: 50, flex: 1, justifyContent: 'center' },
  hero: { gap: 12, alignItems: 'center' },
  // Lottie 그림 안의 투명 여백(위 28px, 아래 35px)을 음수 여백으로 상쇄해 보이는 그림 기준으로 정렬한다
  animation: { marginTop: -28, marginBottom: -32 },
  // 결과 카드와 그 아래 데모 안내 문구를 한 덩어리로 묶는다
  resultBlock: { gap: 12 },
  infoCard: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 20,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  infoDivider: { height: 1, backgroundColor: theme.colors.gray150 },
});

export default styles;

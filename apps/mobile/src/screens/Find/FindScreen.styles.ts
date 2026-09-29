import { StyleSheet } from 'react-native';
import { theme } from '@styles';

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 24, gap: 24 },

  // ── 성공 화면(ID 찾기 · 임시 PW) ─────────────────────────────────
  // 다른 완료 화면(가입·충전·출금·결제 완료)과 같은 구성: [애니메이션 + 문구] 와 결과 카드 사이 간격 50
  successWrap: { gap: 50, flex: 1, justifyContent: 'center' },
  hero: { gap: 12, alignItems: 'center' },
  // Lottie 그림은 상자 안에 위 28px, 아래 35px 투명 여백을 두고 그려지므로 음수 여백으로 상쇄해 보이는 그림 기준으로 정렬한다
  animation: { marginTop: -28, marginBottom: -32 },
  // 결과 카드와 그 아래 데모 안내 문구를 한 덩어리로
  resultBlock: { gap: 12 },
  // 찾은 회원 정보를 담는 카드 (탈퇴 완료 화면의 안내 카드와 같은 모양: 테두리 없이 연한 배경만)
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

import { StyleSheet } from 'react-native';
import { theme } from '@styles';

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 24, gap: 24 },
  successWrap: { gap: 32, flex: 1, justifyContent: 'center' },

  // ── 성공 화면(ID 찾기) ──────────────────────────────────────────
  // 애니메이션·제목·결과 카드를 한 덩어리로 묶는 컨테이너. 요소 사이 간격은 여기서만 정한다.
  successBody: { gap: 20 },
  // 크기는 SuccessAnimation 의 size 로 정한다. 여기서는 제목 쪽으로 살짝 당기는 여백만 둔다.
  successAnimation: { marginBottom: -8 },
  // 찾은 회원 정보를 담는 카드. 입력칸과 같은 연한 배경·테두리를 써서 화면 톤을 맞춘다.
  infoCard: {
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
    paddingHorizontal: 20,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  infoDivider: { height: 1, backgroundColor: theme.colors.line },
});

export default styles;

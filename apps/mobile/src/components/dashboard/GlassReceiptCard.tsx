import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';

import { Skeleton, Typography, Wordmark } from '@components/common';
import { theme } from '@styles';

export interface GlassReceiptRow {
  label: string;
  /** null 이면 아직 조회 전이라 자리표시자(스켈레톤)를 보여준다 */
  value: string | null;
}

interface GlassReceiptCardProps {
  /** 오른쪽 위 배지 글자. 예) 출금 완료 */
  badgeLabel: string;
  /** 금액 위에 붙는 이름. 예) 출금 금액 */
  amountLabel: string;
  /** 큰 글씨로 보여줄 금액 (원 단위) */
  amount: string | number;
  /** 구분선 아래에 한 줄씩 놓이는 항목들 */
  rows: GlassReceiptRow[];
}

/** 금액 숫자를 '145,500' 처럼 천 단위 콤마 문자열로 */
const formatAmount = (value: string | number) => Number(value).toLocaleString('ko-KR');

/**
 * 완료 화면(출금·충전)의 결과 카드. 유리판(글래스모피즘) 느낌.
 * 앱·웹 공통 blur 라이브러리가 없어 카드 뒤 빛 덩어리 + 반투명 흰색 + 위쪽 하이라이트 + 파란 그림자로 같은 인상을 낸다.
 */
const GlassReceiptCard: React.FC<GlassReceiptCardProps> = ({ badgeLabel, amountLabel, amount, rows }) => (
  <View style={styles.glassWrap}>
    <LinearGradient
      colors={['rgba(91, 140, 255, 0.55)', 'rgba(91, 140, 255, 0)']}
      start={{ x: 0.3, y: 0.3 }}
      end={{ x: 1, y: 1 }}
      style={styles.glowBlue}
    />
    <LinearGradient
      colors={['rgba(62, 210, 176, 0.45)', 'rgba(62, 210, 176, 0)']}
      start={{ x: 0.7, y: 0.7 }}
      end={{ x: 0, y: 0 }}
      style={styles.glowMint}
    />

    {/* 그림자는 바깥 View 가, 둥근 모서리 안쪽 잘라내기는 카드가 맡는다. iOS 는 한 뷰에 둘을 함께 걸면 모서리가 둥글게 잘리지 않는다 */}
    <View style={styles.cardShadow}>
      <View style={styles.card}>
        {/* 위쪽 빛 반사 */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.highlight}
          pointerEvents="none"
        />

        <View style={styles.head}>
          <Wordmark height={18} color={theme.colors.primary} />
          <View style={styles.badge}>
            <Typography mode="caption2" color="blue700">
              {badgeLabel}
            </Typography>
          </View>
        </View>

        <View style={{ gap: 4 }}>
          <Typography mode="body2" color="blue700">
            {amountLabel}
          </Typography>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Typography mode="heading1" color="blue900" style={styles.amount}>
              {formatAmount(amount)}
            </Typography>
            <Typography mode="subtitle1" color="blue800">
              원
            </Typography>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={{ gap: 10 }}>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Typography mode="body2" color="blue700">
                {row.label}
              </Typography>
              {row.value === null ? (
                <Skeleton width={96} height={14} style={styles.rowSkeleton} />
              ) : (
                <Typography mode="subtitle3" color="blue900" numberOfLines={1} style={styles.rowValue}>
                  {row.value}
                </Typography>
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  // 웹의 700px 프레임에서 카드가 너무 커지지 않게 휴대폰 폭으로 제한한다
  glassWrap: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  // 카드 뒤 빛 덩어리. 모서리 밖으로 살짝 새어 나와 유리 너머 색이 비치는 느낌을 준다
  glowBlue: { position: 'absolute', top: -28, left: -24, width: 220, height: 220, borderRadius: 110 },
  glowMint: { position: 'absolute', right: -30, bottom: -36, width: 200, height: 200, borderRadius: 100 },
  cardShadow: {
    borderRadius: theme.radius.xl,
    boxShadow: '0 16px 40px rgba(30, 99, 240, 0.16), 0 2px 6px rgba(30, 99, 240, 0.08)', // 떠 있는 느낌의 파란 그림자
  },
  card: {
    borderRadius: theme.radius.xl,
    padding: 22,
    gap: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.62)', // 반투명 흰색: 뒤의 빛 덩어리가 연하게 비친다
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)', // 유리 가장자리의 밝은 테두리
  },
  // 카드 위쪽 1/3 에 깔리는 흰 하이라이트 (빛 반사)
  highlight: { position: 'absolute', top: 0, left: 0, right: 0, height: 72 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(30, 99, 240, 0.12)',
    justifyContent: 'center',
  },
  amount: { fontSize: 34, lineHeight: 42, letterSpacing: -1 },
  divider: { height: 1, backgroundColor: 'rgba(30, 99, 240, 0.14)' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  // 긴 값이 카드 밖으로 나가지 않게 값 칸이 남는 폭만 쓰고 말줄임한다
  rowValue: { flexShrink: 1, textAlign: 'right' },
  // 유리 위에서는 기본 회색 막대가 묻히므로 파랑 기운을 살짝 준다
  rowSkeleton: { backgroundColor: 'rgba(30, 99, 240, 0.12)' },
});

export default GlassReceiptCard;
export { GlassReceiptCard };

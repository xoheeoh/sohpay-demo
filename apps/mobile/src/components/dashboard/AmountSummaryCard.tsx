import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { Skeleton, Typography } from '@components/common';
import { layout, theme } from '@styles';

interface AmountSummaryCardProps {
  /** 금액 위에 붙는 이름. 예) 출금 예정 금액 */
  label: string;
  /** 큰 글씨로 보여줄 금액 (원 단위 숫자) */
  amount: number;
  /** 오른쪽 위 동그라미 안 아이콘 이름 (react-native-paper / MaterialCommunityIcons) */
  icon: string;
  /** 아래 띠의 이름. 예) 출금 후 잔액 */
  subLabel: string;
  /** 아래 띠의 금액. null 이면 아직 조회 전이라 자리표시자(스켈레톤)를 보여준다 */
  subAmount: number | null;
}

/** 금액 숫자를 '145,500' 처럼 천 단위 콤마 문자열로 */
const formatAmount = (value: number) => value.toLocaleString('ko-KR');

/**
 * 출금·충전 확인 화면 상단의 금액 카드.
 * 흰 카드 안에 [이름 + 아이콘] / [큰 금액] / [연한 띠: 처리 후 잔액] 순으로 놓는다.
 */
const AmountSummaryCard: React.FC<AmountSummaryCardProps> = ({ label, amount, icon, subLabel, subAmount }) => (
  <View style={styles.card}>
    <View style={layout.rowBetween}>
      <Typography mode="body2" color="gray500">
        {label}
      </Typography>
      <View style={styles.iconCircle}>
        <Icon source={icon} size={20} color={theme.colors.primary} />
      </View>
    </View>

    <View style={styles.amountRow}>
      <Typography mode="heading1" color="gray900">
        {formatAmount(amount)}
      </Typography>
      <Typography mode="subtitle1" color="gray600">
        원
      </Typography>
    </View>

    <View style={[layout.rowBetween, styles.subInfoStrip]}>
      <Typography mode="body2" color="gray600">
        {subLabel}
      </Typography>
      {subAmount === null ? (
        <Skeleton width={88} height={14} />
      ) : (
        <Typography mode="subtitle3" color="gray900">
          {formatAmount(subAmount)} 원
        </Typography>
      )}
    </View>
  </View>
);

// 회원정보(UsrInfoScreen)·계좌관리 화면과 같은 카드 모양
const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
    padding: 20,
    gap: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: -8 },
  subInfoStrip: {
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});

export default AmountSummaryCard;
export { AmountSummaryCard };

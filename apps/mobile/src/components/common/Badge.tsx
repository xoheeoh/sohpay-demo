import { StyleSheet, View, ViewStyle } from 'react-native';

import Typography from './Typography';
import { theme } from '@styles';

type BadgeTone = 'red' | 'blue' | 'gray' | 'green' | 'yellow';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

const TONES: Record<BadgeTone, { bg: keyof typeof theme.colors; fg: keyof typeof theme.colors }> = {
  red: { bg: 'red50', fg: 'red600' },
  blue: { bg: 'blue50', fg: 'blue700' },
  gray: { bg: 'gray100', fg: 'gray600' },
  green: { bg: 'green50', fg: 'green900' },
  yellow: { bg: 'yellow50', fg: 'yellow900' },
};

/**
 * 거래 상태(결제/취소/충전/출금 등) 표시용 pill 형태 배지
 * - 거래 상태명 → 색상 매핑은 getTrxTone() 참고
 */
const Badge: React.FC<BadgeProps> = ({ label, tone = 'gray', size = 'small', style }) => {
  const { bg, fg } = TONES[tone];

  return (
    <View style={[styles.base, styles[size], { backgroundColor: theme.colors[bg] }, style]}>
      <Typography mode="subtitle4" color={fg} style={size === 'small' ? styles.smallText : undefined}>
        {label}
      </Typography>
    </View>
  );
};

/** 거래 상태명에 따른 배지 색상 */
export const getTrxTone = (stateNm: string): BadgeTone => {
  if (stateNm === '결제' || stateNm === '출금실패') return 'red';
  if (stateNm === '취소' || stateNm === '부분취소' || stateNm === '충전' || stateNm === '출금성공') return 'blue';
  if (stateNm === '출금요청') return 'yellow';
  return 'gray';
};

const styles = StyleSheet.create({
  base: { alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  small: { height: 20, paddingHorizontal: 7 },
  medium: { height: 26, paddingHorizontal: 10 },
  smallText: { fontSize: 11, lineHeight: 16, letterSpacing: -0.22 },
});

export default Badge;
export { Badge };

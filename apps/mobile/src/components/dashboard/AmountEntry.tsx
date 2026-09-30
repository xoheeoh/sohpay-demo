import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { BOTTOM_BTN_BOX_HEIGHT, Typography } from '@components/common';
import { theme } from '@styles';
import { toKoreanAmount } from '@utils/koreanAmount';

/** 빠른 금액 버튼 (예: +1만) */
export interface QuickAmount {
  label: string;
  value: number;
}

interface AmountEntryProps {
  /** 위쪽 질문. 예) 얼마를 충전할까요? */
  question: string;
  /** 현재 금액 (숫자만 담긴 문자열. 비어 있으면 0원으로 표시) */
  amount: string;
  onChangeAmount: (next: string) => void;
  /** 금액 아래 작은 안내. 오류가 없을 때 보인다 */
  hint: string;
  /** 오류 문구. 있으면 안내 대신 빨간색으로 보이고 금액도 빨갛게 바뀐다 */
  error?: string;
  /** 빠른 금액 버튼들. 누르면 현재 금액에 더해진다 */
  quickAmounts: QuickAmount[];
  /** "전액" 버튼을 눌렀을 때. 넘기지 않으면 버튼이 빠진다 */
  onMax?: () => void;
  /** 입력 가능한 최대 자릿수. 기본 8자리(9,999만 원) */
  maxDigits?: number;
}

/** 키패드 배열. 마지막 줄은 [00, 0, 지우기] */
const KEY_ROWS: (string | 'back')[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['00', '0', 'back'],
];

/**
 * 은행 앱 이체 화면 방식의 금액 입력. 큰 금액 숫자 아래에 빠른 금액 버튼과 자체 숫자 키패드를 붙인다.
 * 시스템 키보드를 쓰지 않아 웹·앱에서 같은 모양이고 PinPad 와 조작감이 같다.
 */
const AmountEntry: React.FC<AmountEntryProps> = ({
  question,
  amount,
  onChangeAmount,
  hint,
  error,
  quickAmounts,
  onMax,
  maxDigits = 8,
}) => {
  const numeric = Number(amount || 0);
  const hasValue = numeric > 0;

  const pressKey = (key: string | 'back') => {
    if (key === 'back') {
      onChangeAmount(amount.length <= 1 ? '' : amount.slice(0, -1));
      return;
    }
    // 앞자리 0 은 쌓지 않는다 ("0" 상태에서 "00" 을 눌러도 0)
    const next = (amount + key).replace(/^0+(?=\d)/, '');
    if (next.replace(/^0+$/, '').length > maxDigits) return;
    onChangeAmount(next === '0' ? '' : next);
  };

  const addQuick = (value: number) => {
    const next = numeric + value;
    if (String(next).length > maxDigits) return;
    onChangeAmount(String(next));
  };

  return (
    <View style={styles.wrap}>
      {/* 질문 + 금액 */}
      <View style={styles.top}>
        <Typography mode="heading3" color="gray900">
          {question}
        </Typography>

        <View style={styles.amountBlock}>
          <View style={styles.amountRow}>
            <Typography
              mode="heading1"
              color={error ? 'red500' : hasValue ? 'gray900' : 'gray300'}
              style={styles.amount}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {numeric.toLocaleString('ko-KR')}
            </Typography>
            <Typography mode="heading3" color={error ? 'red500' : hasValue ? 'gray700' : 'gray300'}>
              원
            </Typography>
          </View>

          {/* 오류가 있으면 오류만, 없으면 한글 읽기(값이 있을 때) + 안내 */}
          {error ? (
            <Typography mode="body2" color="red500" style={styles.sub}>
              {error}
            </Typography>
          ) : (
            <Typography mode="body2" color="gray500" style={styles.sub}>
              {hasValue ? `${toKoreanAmount(numeric)} 원` : hint}
            </Typography>
          )}
        </View>

        {/* 빠른 금액 */}
        <View style={styles.chips}>
          {quickAmounts.map((q) => (
            <Pressable
              key={q.label}
              accessibilityRole="button"
              style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
              onPress={() => addQuick(q.value)}>
              <Typography mode="subtitle3" color="gray700">
                {q.label}
              </Typography>
            </Pressable>
          ))}
          {onMax && (
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.chip, styles.chipMax, pressed && styles.chipPressed]}
              onPress={onMax}>
              <Typography mode="subtitle3" color="primary">
                전액
              </Typography>
            </Pressable>
          )}
        </View>
      </View>

      {/* 숫자 키패드 (PinPad 와 같은 모양, 숫자는 섞지 않는다) */}
      <View style={styles.keypad}>
        {KEY_ROWS.map((row, i) => (
          <View key={i} style={styles.keyRow}>
            {row.map((key) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={key === 'back' ? '지우기' : key}
                style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
                onPress={() => pressKey(key)}
                onLongPress={key === 'back' ? () => onChangeAmount('') : undefined}>
                {key === 'back' ? (
                  <Icon source="backspace-outline" size={26} color={theme.colors.gray700} />
                ) : (
                  <Typography mode="heading3" color="gray900" style={styles.digit}>
                    {key}
                  </Typography>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  top: { flex: 1, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16, gap: 24 },
  amountBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, maxWidth: '100%' },
  amount: { fontSize: 40, lineHeight: 48, letterSpacing: -1.2, flexShrink: 1 },
  sub: { textAlign: 'center', minHeight: 20 },

  chips: { flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipMax: { backgroundColor: theme.colors.primarySoft },
  chipPressed: { opacity: 0.6 },

  // 하단 고정 버튼 상자가 위에 겹치므로 그 높이만큼 아래 여백을 둔다
  keypad: {
    backgroundColor: theme.colors.gray50,
    borderTopLeftRadius: theme.radius.xxl + 4,
    borderTopRightRadius: theme.radius.xxl + 4,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: BOTTOM_BTN_BOX_HEIGHT + 8,
    gap: 8,
  },
  keyRow: { flexDirection: 'row', gap: 8 },
  key: { flex: 1, height: 56, borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center' },
  keyPressed: { backgroundColor: 'white', boxShadow: theme.shadow.card },
  digit: { fontFamily: 'Pretendard-Medium' },
});

export default AmountEntry;
export { AmountEntry };

import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Typography from './Typography';
import Wordmark from './Wordmark';
import { theme } from '@styles';

interface PinPadProps {
  /** 화면 제목 (예: 간편 비밀번호 입력) */
  title: string;
  /** 안내 문구 - 강조 텍스트를 섞을 수 있어 노드로 받는다 */
  description: ReactNode;
  /** 6칸 입력 상태 */
  dots: boolean[];
  /** 랜덤 배열된 상단 9개 숫자 */
  topNumbers: number[];
  /** 마지막 줄 가운데 숫자 */
  remainingNumber?: number;
  onKeyPress: (num: number) => void;
  onShuffle: () => void;
  onDelete: () => void;
  /** 비밀번호 불일치 등 오류 시 점 색을 붉게 */
  error?: boolean;
  /** 제목 위에 얹을 요소 (회원가입 단계 표시 등) */
  topSlot?: ReactNode;
}

/**
 * 간편 비밀번호 화면 공통 레이아웃
 * - 상단: 워드마크 · 제목 · 안내 · 6개 점
 * - 하단: 3x4 랜덤 키패드 (재배열 / 남은 숫자 / 삭제)
 * 숫자 배열·검증 로직은 각 화면이 그대로 갖고, 이 컴포넌트는 표시만 담당한다.
 */
const PinPad: React.FC<PinPadProps> = ({
  title,
  description,
  dots,
  topNumbers,
  remainingNumber,
  onKeyPress,
  onShuffle,
  onDelete,
  error = false,
  topSlot,
}) => {
  const insets = useSafeAreaInsets();

  const renderKey = (content: ReactNode, onPress: () => void, key: string) => (
    <Pressable
      key={key}
      onPress={onPress}
      style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
      accessibilityRole="button">
      {content}
    </Pressable>
  );

  return (
    <View style={styles.wrap}>
      {topSlot}

      {/* 상단 안내 */}
      <View style={styles.top}>
        <Wordmark height={22} />

        <View style={{ gap: 8, alignItems: 'center' }}>
          <Typography mode="heading3" color="gray900">
            {title}
          </Typography>
          <Typography mode="body2" color="gray500" style={{ textAlign: 'center' }}>
            {description}
          </Typography>
        </View>

        <View style={styles.dots}>
          {dots.map((filled, index) => (
            <View
              key={index}
              style={[styles.dot, filled ? (error ? styles.dotError : styles.dotActive) : styles.dotInactive]}
            />
          ))}
        </View>
      </View>

      {/* 키패드. 회색 배경이 화면 맨 아래(안전 영역 포함)까지 내려오고, 마지막 줄은 안전 영역 위로 줄 간격(8)만큼 띄운다.
          이를 위해 PinPad 를 쓰는 화면은 ScreenWrapper 의 bottomEdge 를 끈다 */}
      <View style={[styles.keypad, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        {Array(3)
          .fill(0)
          .map((_, row) => (
            <View key={row} style={styles.row}>
              {topNumbers.slice(row * 3, row * 3 + 3).map((num) =>
                renderKey(
                  <Typography mode="heading2" color="gray900" style={styles.digit}>
                    {num}
                  </Typography>,
                  () => onKeyPress(num),
                  `k-${num}`,
                ),
              )}
            </View>
          ))}

        <View style={styles.row}>
          {renderKey(
            <Typography mode="subtitle3" color="gray500">
              재배열
            </Typography>,
            onShuffle,
            'shuffle',
          )}
          {renderKey(
            <Typography mode="heading2" color="gray900" style={styles.digit}>
              {remainingNumber}
            </Typography>,
            () => remainingNumber !== undefined && onKeyPress(remainingNumber),
            'remaining',
          )}
          {renderKey(<Icon source="backspace-outline" size={26} color={theme.colors.gray700} />, onDelete, 'delete')}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'white' },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28, paddingHorizontal: 24 },
  dots: { flexDirection: 'row', gap: 16, marginTop: 8 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  dotActive: { backgroundColor: theme.colors.primary },
  dotError: { backgroundColor: theme.colors.red500 },
  dotInactive: { backgroundColor: theme.colors.gray150 },
  keypad: {
    backgroundColor: theme.colors.gray50,
    borderTopLeftRadius: theme.radius.xxl + 4,
    borderTopRightRadius: theme.radius.xxl + 4,
    paddingTop: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  row: { flexDirection: 'row', gap: 8 },
  key: { flex: 1, height: 64, borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center' },
  keyPressed: { backgroundColor: 'white', boxShadow: theme.shadow.card },
  digit: { fontFamily: 'Pretendard-Medium' },
});

export default PinPad;
export { PinPad };

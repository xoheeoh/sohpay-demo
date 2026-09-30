import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';

import { RootStackParamList } from '@typ/navigation';
import { loadUserAmt } from '@apis/commonApi';
import { formatDateTime, formatWon } from '@utils/formatter';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  InfoBox,
  KeyboardAwareScrollView,
  ScreenWrapper,
  Skeleton,
  Typography,
} from '@components/common';
import { layout, theme } from '@styles';

type CodeInfoScreenProps = NativeStackScreenProps<RootStackParamList, 'CodeInfo'>;

/** 금액 숫자를 '4,500' 처럼 천 단위 콤마 문자열로 */
const formatAmount = (value: number) => value.toLocaleString('ko-KR');

const CodeInfoScreen: React.FC<CodeInfoScreenProps> = ({ navigation, route }) => {
  const data = route.params.data;
  const goodsAmt = data.goodsAmt;

  // 현재 잔액. null 이면 조회 전으로 "결제 후 잔액" 자리에 자리표시자를 보여준다
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    loadUserAmt().then((result) => {
      console.log('회원 잔액 조회 결과:', result);

      if (result.resultCd === '0000') {
        const current = Number(result.sumPpRmnAmt);
        setBalance(current);
      }
    });
  }, []);

  /**
   * 결제코드 유효 시간. QR 은 발급 5분 뒤 만료되므로 남은 시간을 1초마다 갱신하고 0 이 되면 결제 버튼을 끈다.
   * 데모 QR(reusable)은 만료가 없다.
   */
  const isReusable = data.reusable === true;
  const expiresAtMs = data.expiresAt && !isReusable ? new Date(data.expiresAt).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (expiresAtMs === null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expiresAtMs]);

  const remainingSec = expiresAtMs === null ? null : Math.max(0, Math.floor((expiresAtMs - now) / 1000));
  const isExpired = remainingSec === 0;
  const remainingText =
    remainingSec === null
      ? null
      : `${Math.floor(remainingSec / 60)}:${String(remainingSec % 60).padStart(2, '0')} 남음`;

  const canPay = balance !== null && balance >= goodsAmt;
  // 잔액 부족 시 화면을 유지한 채 부족 금액과 충전 버튼을 보여준다
  const isInsufficient = balance !== null && balance < goodsAmt;
  const shortage = isInsufficient ? goodsAmt - balance : 0;

  return (
    <ScreenWrapper backgroundColor={theme.colors.bg} keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.wrap}
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        {/* 가맹점·결제 금액 카드 */}
        <View style={styles.card}>
          <View style={[layout.rowCenter, { gap: 12 }]}>
            <View style={styles.iconCircle}>
              <Icon source="storefront-outline" size={22} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Typography mode="subtitle2" color="gray900" numberOfLines={1}>
                {data.coNm}
              </Typography>
              <Typography mode="body2" color="gray500" numberOfLines={1}>
                {data.goodsNm}
              </Typography>
            </View>
          </View>

          <View style={{ gap: 4 }}>
            <Typography mode="body2" color="gray500">
              결제 금액
            </Typography>
            <View style={styles.amountRow}>
              <Typography mode="heading1" color="gray900">
                {formatAmount(goodsAmt)}
              </Typography>
              <Typography mode="subtitle1" color="gray600">
                원
              </Typography>
            </View>
          </View>

          <View style={[layout.rowBetween, styles.subInfoStrip]}>
            <Typography mode="body2" color="gray600">
              결제 후 잔액
            </Typography>
            {balance === null ? (
              <Skeleton width={88} height={14} />
            ) : (
              <Typography mode="subtitle3" color={canPay ? 'gray900' : 'red500'}>
                {formatWon(balance - goodsAmt)}
              </Typography>
            )}
          </View>

          {isInsufficient && (
            <InfoBox tone="yellow">{`잔액이 ${formatWon(shortage)} 부족해요. 충전 후 다시 결제해 주세요.`}</InfoBox>
          )}
        </View>

        {/* 결제 정보 카드 */}
        <View style={styles.card}>
          <Typography mode="subtitle2" color="gray900">
            결제 정보
          </Typography>

          <View style={{ gap: 14 }}>
            <InfoRow label="상품명" value={data.goodsNm} />
            <InfoRow label="공급가액" value={formatWon(data.goodsSplAmt)} />
            <InfoRow label="부가세" value={formatWon(data.goodsVat)} />
            <InfoRow label="가맹점 번호" value={data.mid} />
            <InfoRow label="요청일시" value={formatDateTime(`${data.reqDt}${data.reqTm}`)} />
            {/* 남은 시간이 1분 미만이면 빨갛게 표시한다 */}
            <InfoRow
              label="유효 시간"
              value={isReusable ? '만료 없음 (데모 QR)' : (remainingText ?? '-')}
              valueColor={remainingSec !== null && remainingSec < 60 ? 'red500' : 'gray900'}
            />
          </View>

          {isExpired && <InfoBox tone="yellow">결제코드가 만료됐어요. 가맹점에 새 QR 코드를 요청해 주세요.</InfoBox>}
        </View>

        {/* 결제 한도는 서버 규칙과 같은 값. 초과 시 PIN 입력 뒤에야 오류를 보게 되므로 미리 안내한다 */}
        <Typography mode="caption1" color="gray500" style={{ textAlign: 'center' }}>
          1회 50만원 · 1일 200만원까지 결제할 수 있어요
        </Typography>
      </KeyboardAwareScrollView>

      {/* 잔액 부족이면 "충전하기"로 바뀌어 충전 흐름으로 이어진다 */}
      <BottomBtnBox
        backgroundColor={theme.colors.bg}
        buttonKey={`${canPay}-${isInsufficient}-${isExpired}`}
        disabled={balance === null || isExpired}
        label={isExpired ? '만료된 결제코드' : isInsufficient ? '충전하기' : '결제하기'}
        onPress={() =>
          isInsufficient ? navigation.navigate('ChargeSelectMethod') : navigation.navigate('PinPayQR', { data: data })
        }
      />
    </ScreenWrapper>
  );
};

/** 라벨·값 한 줄 */
const InfoRow: React.FC<{ label: string; value: string; valueColor?: 'gray900' | 'red500' }> = ({
  label,
  value,
  valueColor = 'gray900',
}) => (
  <View style={[layout.rowBetween, { gap: 16 }]}>
    <Typography mode="body2" color="gray500">
      {label}
    </Typography>
    <Typography mode="body2" color={valueColor} numberOfLines={1} style={{ flexShrink: 1, textAlign: 'right' }}>
      {value}
    </Typography>
  </View>
);

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 24, gap: 16 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
    padding: 20,
    gap: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  subInfoStrip: {
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});

export default CodeInfoScreen;
export { CodeInfoScreen };

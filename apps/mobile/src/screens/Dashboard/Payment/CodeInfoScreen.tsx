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
  // 이전 화면(결제코드 입력 / QR 스캔)에서 얻어온 결제 정보
  const data = route.params.data;
  const goodsAmt = data.goodsAmt;

  // 현재 잔액 (null: 아직 조회 전 → "결제 후 잔액" 자리에 자리표시자가 보인다)
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

  const canPay = balance !== null && balance >= goodsAmt;
  // 잔액이 상품 금액보다 적으면 이 화면에 그대로 두고 부족한 금액과 충전 버튼을 보여준다 (알림으로 튕겨 보내지 않음)
  const isInsufficient = balance !== null && balance < goodsAmt;
  const shortage = isInsufficient ? goodsAmt - balance : 0;

  return (
    <ScreenWrapper backgroundColor={theme.colors.bg} keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.wrap}
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        {/* 가맹점·결제 금액 카드 (출금·충전 확인 화면의 금액 카드와 같은 모양) */}
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
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* 잔액이 부족하면 버튼이 "충전하기"로 바뀌어 충전 흐름으로 바로 이어진다 */}
      <BottomBtnBox
        backgroundColor={theme.colors.bg}
        buttonKey={`${canPay}-${isInsufficient}`}
        disabled={balance === null}
        label={isInsufficient ? '충전하기' : '결제하기'}
        onPress={() =>
          isInsufficient ? navigation.navigate('ChargeSelectMethod') : navigation.navigate('PinPayQR', { data: data })
        }
      />
    </ScreenWrapper>
  );
};

/** 라벨은 왼쫁에 연하게, 값은 오른쪽에 진하게 놓는 한 줄 (회원정보 화면과 같은 모양) */
const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={[layout.rowBetween, { gap: 16 }]}>
    <Typography mode="body2" color="gray500">
      {label}
    </Typography>
    <Typography mode="body2" color="gray900" numberOfLines={1} style={{ flexShrink: 1, textAlign: 'right' }}>
      {value}
    </Typography>
  </View>
);

// 출금 계좌 확인·충전 확인 화면과 같은 카드 모양
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

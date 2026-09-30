import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import { loadUserAmt } from '@apis/commonApi';
import { AmountSummaryCard } from '@components/dashboard';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  Typography,
} from '@components/common';
import { layout, theme } from '@styles';

type TransferAcntChargeScreenProps = NativeStackScreenProps<RootStackParamList, 'TransferAcntCharge'>;

const TransferAcntChargeScreen = ({ navigation, route }: TransferAcntChargeScreenProps) => {
  const chargeAmt = route.params.amount;

  // 현재 잔액. null 이면 조회 전으로 카드에 자리표시자를 보여준다
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    loadUserAmt().then((data) => {
      console.log('회원 잔액 조회 결과:', data);

      if (data.resultCd === '0000') {
        setBalance(Number(data.sumPpRmnAmt));
      }
    });
  }, []);

  return (
    <ScreenWrapper backgroundColor={theme.colors.bg} keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.wrap}
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        {/* 충전 금액 카드 */}
        <AmountSummaryCard
          label="충전 예정 금액"
          amount={Number(chargeAmt)}
          icon="bank-transfer-in"
          subLabel="충전 후 잔액"
          subAmount={balance === null ? null : balance + Number(chargeAmt)}
        />

        {/* 충전 수단 카드 */}
        <View style={styles.card}>
          <Typography mode="subtitle2" color="gray900">
            충전 수단
          </Typography>

          <View style={[layout.rowCenter, styles.methodRow]}>
            <View style={styles.methodIcon}>
              <Image
                source={require('@images/icon/money_transfer.png')}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            </View>

            <View style={{ gap: 2, flexShrink: 1 }}>
              <Typography mode="subtitle2" color="gray900">
                계좌이체
              </Typography>
              <Typography mode="body2" color="gray600">
                실시간 계좌이체 · 데모용 모의 결제창
              </Typography>
            </View>
          </View>

          <Typography mode="caption1" color="gray400">
            충전 버튼을 누르면 간편 비밀번호 확인 후 데모용 모의 결제창이 열립니다. 승인·거절·취소를 직접 골라 볼 수
            있고, 승인하면 입력한 금액이 잔액에 반영됩니다.
          </Typography>
        </View>
      </KeyboardAwareScrollView>

      <BottomBtnBox
        backgroundColor={theme.colors.bg}
        buttonKey={'charge'}
        disabled={false}
        label={'충전하기'}
        onPress={() =>
          navigation.navigate('PinCharge', {
            chargeAmt: chargeAmt,
          })
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 24, gap: 16 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
    padding: 20,
    gap: 16,
  },
  methodRow: {
    gap: 14,
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TransferAcntChargeScreen;
export { TransferAcntChargeScreen };

import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import { loadUserAmt } from '@apis/commonApi';
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
  // 이전 화면에서 얻어온 충전 예정 금액
  const chargeAmt = route.params.amount;

  // 현재 잔액 조회
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    loadUserAmt().then((data) => {
      console.log('회원 잔액 조회 결과:', data);

      if (data.resultCd === '0000') {
        setBalance(data.sumPpRmnAmt);
      }
    });
  }, []);

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        <View style={[styles.wrap, { gap: 12 }]}>
          <View style={styles.chargeBadge}>
            <Typography mode="body2" color="white">
              충전 예정 금액
            </Typography>
          </View>

          <Typography mode="heading1" color="gray900">
            {Number(chargeAmt).toLocaleString('kr-KR')} 원
          </Typography>
        </View>

        <View style={styles.divider} />

        <View style={[styles.wrap, { gap: 24 }]}>
          <Typography mode="heading3" color="gray900">
            충전 상세 내역
          </Typography>

          <View style={{ gap: 12 }}>
            <View style={layout.rowBetween}>
              <Typography mode="body2" color="gray900">
                충전 예정 금액
              </Typography>
              <Typography mode="subtitle2" color="gray900">
                {Number(chargeAmt).toLocaleString('kr-KR')} 원
              </Typography>
            </View>

            <View style={layout.rowBetween}>
              <Typography mode="body2" color="gray900">
                └ 충전 후 잔액
              </Typography>
              <Typography mode="body2" color="gray600">
                {(Number(balance) + Number(chargeAmt)).toLocaleString('kr-KR')} 원
              </Typography>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <BottomBtnBox
        buttonKey={'charge'}
        disabled={false}
        label={'충전'}
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
  wrap: { paddingVertical: 24, paddingHorizontal: 16 },
  chargeBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 32,
    alignSelf: 'baseline',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  divider: { backgroundColor: theme.colors.gray100, height: 1, marginHorizontal: 16 },
  bankInfoBox: {
    gap: 12,
    borderRadius: 8,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(45, 181, 237, 0.15)',
  },
});

export default TransferAcntChargeScreen;
export { TransferAcntChargeScreen };

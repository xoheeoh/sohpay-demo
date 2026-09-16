import React, { useEffect, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { useDialog } from '@contexts/DialogContext';
import { loadUserAmt } from '@apis/commonApi';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  SecondaryButton,
  TextField,
  Typography,
} from '@components/common';
import { BottomAmtBtn } from '@components/dashboard';
import { layout, theme } from '@styles';

type RefundScreenProps = NativeStackScreenProps<RootStackParamList, 'Refund'>;

const RefundScreen: React.FC<RefundScreenProps> = ({ navigation }) => {
  // 회원 잔액 출금 가능 금액 불러오기
  const [rmnAmt, setRmnAmt] = useState<number>(0);

  useEffect(() => {
    loadUserAmt().then((data) => {
      console.log('회원 잔액 조회 결과:', data);

      if (data.resultCd === '0000') {
        setRmnAmt(Number(data.ppCanRfndRmnAmt));
      }
    });
  }, []);

  // 잔액 출금 금액
  const [withdrawalAmt, setWithdrawalAmt] = useState('');

  // 버튼 활성화 상태
  const isButtonDisabled = !(withdrawalAmt.length > 0);

  // Dialog
  const { alert } = useDialog();

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        <View style={[styles.container, { gap: 16 }]}>
          <Typography mode="heading3" color="gray900">
            출금하실 금액을 입력해주세요.
          </Typography>

          <View>
            <TextField
              id={'withdrawal'}
              inputMode={'numeric'}
              label={'잔액 출금 금액'}
              value={withdrawalAmt}
              onChangeText={(x) => {
                const digits = x.replace(/[^0-9]/g, '');
                if (digits.length === 0) {
                  setWithdrawalAmt('');
                  return;
                }

                setWithdrawalAmt(Number(digits).toString());
              }}
              placeholder={'잔액 출금 금액을 입력해주세요.'}
            />
            <View style={{ marginTop: 10, ...layout.rowBetween }}>
              <View style={{ gap: 4, ...layout.rowCenter }}>
                <Icon source={'information'} size={18} color={theme.colors.gray600} />
                <Typography mode="caption1" color="gray600">
                  잔액 출금 가능 금액: {rmnAmt.toLocaleString('ko-KR')}원
                </Typography>
              </View>
              <SecondaryButton
                label={'전액 입력'}
                onPress={() => setWithdrawalAmt(rmnAmt.toString())}
                size={'medium'}
              />
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <BottomAmtBtn
        add={(value: number) =>
          setWithdrawalAmt((prev) => {
            const newVal = Number(prev || 0) + value;
            return newVal.toString();
          })
        }
      />

      <BottomBtnBox
        buttonKey={isButtonDisabled.toString()}
        disabled={isButtonDisabled}
        label={'다음'}
        onPress={() => {
          const amt = Number(withdrawalAmt || 0);
          if (amt > rmnAmt || amt === 0) {
            Keyboard.dismiss();

            alert({
              title: '안내',
              message1: '잔액 출금 가능 금액을 확인 후 다시 입력해주세요.',
            });
            return;
          }
          navigation.navigate('RefundAcnt', { amt });
        }}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 24 },
});

export default RefundScreen;
export { RefundScreen };

import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';

import { IRmnAmt } from '@typ/paymentType';
import type { RootStackParamList } from '@typ/navigation';
import { filterOnlyNumber } from '@utils/input';
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

type ChargeAmtScreenProps = NativeStackScreenProps<RootStackParamList, 'ChargeAmt'>;

const ChargeAmtScreen: React.FC<ChargeAmtScreenProps> = ({ navigation }) => {
  // 입력한 충전 금액 상태관리
  const [chargeAmt, setChargeAmt] = useState<string>('');

  // 현재 잔액 조회
  const [rmnAmtData, setRmnAmtData] = useState<IRmnAmt>();

  useEffect(() => {
    loadUserAmt().then((data) => {
      console.log('회원 잔액 조회 결과:', data);

      if (data.resultCd === '0000') {
        setRmnAmtData(data);
      }
    });
  }, []);

  // 충전 금액 검증 함수
  const validateChargeAmount = (amount: string): { isValid: boolean; errorMessage?: string } => {
    const numAmount = Number(amount);

    // 값이 입력되지 않은 최초 상태
    if (!amount || amount.length === 0) {
      return { isValid: true };
    }

    // 최대 충전 금액 체크 (머니 잔액 포함 200만 원)
    const currentBalance = rmnAmtData ? Number(rmnAmtData.moneyAmt) : 0;
    const totalAmount = currentBalance + numAmount;
    if (totalAmount > 2000000) {
      return { isValid: false, errorMessage: '충전 한도를 초과했습니다. (최대 200만 원)' };
    }

    return { isValid: true };
  };

  // 다음 버튼 활성화 상태 계산 (chargeAmt가 비어 있거나 0인 경우 or 충전 가능한 값이 아닌 경우 버튼 비활성화)
  const validation = validateChargeAmount(chargeAmt);
  const isButtonDisabled = !validation.isValid || !chargeAmt || Number(chargeAmt) <= 0;

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.wrap, { flexGrow: 1 }]}
        keyboardShouldPersistTaps="handled">
        <Typography mode="heading3" color="gray900">
          충전 금액을 입력해주세요.
        </Typography>

        <View>
          <TextField
            id={'goodsAmt'}
            inputMode={'numeric'}
            label={'충전 금액'}
            value={chargeAmt}
            onChangeText={(text: string) => {
              // 입력값 필터링
              const filtered = filterOnlyNumber(text);
              setChargeAmt(filtered);
            }}
            placeholder={''}
          />
          <View
            style={{
              marginTop: 10,
              ...layout.rowBetween,
            }}>
            {validation.isValid ? (
              <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                <Icon source={'information'} color={theme.colors.gray900} size={18} />

                <Typography mode="caption1" color="gray600">
                  충전 가능 한도 금액은 200만 원 입니다.
                </Typography>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                <Icon source={'information'} color={theme.colors.red500} size={18} />

                <Typography mode="caption1" color="red500">
                  {validation.errorMessage}
                </Typography>
              </View>
            )}
            <SecondaryButton
              label={'전액 입력'}
              // 잔액은 최대 200만 원을 넘을 수 없음 (200만 - 현재 내 머니 잔액)
              onPress={() => {
                if (rmnAmtData) {
                  const maxChargeAmount = 2000000 - Number(rmnAmtData.moneyAmt);
                  setChargeAmt(maxChargeAmount.toString());
                }
              }}
              size={'medium'}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      <BottomAmtBtn
        add={(value: number) =>
          setChargeAmt((prev) => {
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
          navigation.navigate('TransferAcntCharge', { amount: chargeAmt });
        }}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingVertical: 24, paddingHorizontal: 16, gap: 16 },
});

export default ChargeAmtScreen;
export { ChargeAmtScreen };

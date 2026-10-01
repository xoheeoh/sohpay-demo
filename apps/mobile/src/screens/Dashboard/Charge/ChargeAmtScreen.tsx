import { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { IRmnAmt } from '@typ/paymentType';
import type { RootStackParamList } from '@typ/navigation';
import { loadUserAmt } from '@apis/commonApi';
import { BottomBtnBox, BOTTOM_BTN_BOX_KEYBOARD_INSET, ScreenWrapper } from '@components/common';
import { AmountEntry, QuickAmount } from '@components/dashboard';
import { theme } from '@styles';

type ChargeAmtScreenProps = NativeStackScreenProps<RootStackParamList, 'ChargeAmt'>;

/** 충전 금액 단위(원). 서버의 create_charge 규칙(1,000원 단위)과 같아야 한다 */
const CHARGE_UNIT = 1000;
/** 보유 머니 상한(원). 잔액 + 충전 금액이 이 값을 넘을 수 없다 */
const MAX_BALANCE = 2000000;

/** 빠른 금액 버튼. 한도가 200만 원이라 +100만 대신 "전액" 을 둔다 */
const QUICK_AMOUNTS: QuickAmount[] = [
  { label: '+1만', value: 10000 },
  { label: '+5만', value: 50000 },
  { label: '+10만', value: 100000 },
];

const ChargeAmtScreen: React.FC<ChargeAmtScreenProps> = ({ navigation }) => {
  // 입력한 충전 금액 (숫자만 담긴 문자열)
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

  const currentBalance = rmnAmtData ? Number(rmnAmtData.moneyAmt) : 0;

  // 충전 금액 검증
  const validateChargeAmount = (amount: string): { isValid: boolean; errorMessage?: string } => {
    const numAmount = Number(amount);

    // 미입력 상태는 오류로 보지 않고 버튼만 비활성화한다
    if (!amount) {
      return { isValid: true };
    }

    // 보유 머니 포함 상한 검사
    if (currentBalance + numAmount > MAX_BALANCE) {
      return { isValid: false, errorMessage: '충전 한도를 초과했습니다. (보유 머니 포함 최대 200만 원)' };
    }

    // 최소 금액·1,000원 단위. 서버(create_charge)와 같은 규칙으로 미리 거른다
    if (numAmount < CHARGE_UNIT) {
      return { isValid: false, errorMessage: '최소 충전 가능 금액은 1,000원입니다.' };
    }
    if (numAmount % CHARGE_UNIT !== 0) {
      return { isValid: false, errorMessage: '충전은 1,000원 단위로 입력해 주세요.' };
    }

    return { isValid: true };
  };

  const validation = validateChargeAmount(chargeAmt);
  const isButtonDisabled = !chargeAmt || !validation.isValid;

  // 전액: 한도까지 남은 금액을 1,000원 단위로 내림한다
  const fillMax = () => {
    const room = Math.max(MAX_BALANCE - currentBalance, 0);
    const rounded = Math.floor(room / CHARGE_UNIT) * CHARGE_UNIT;
    setChargeAmt(rounded > 0 ? String(rounded) : '');
  };

  // 맨 아래 키패드가 회색이라 하단 안전 영역도 같은 색으로 이어 준다
  return (
    <ScreenWrapper
      backgroundColor="white"
      bottomSafeAreaColor={theme.colors.gray50}
      keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <AmountEntry
        question="얼마를 충전할까요?"
        amount={chargeAmt}
        onChangeAmount={setChargeAmt}
        hint="1,000원 단위로 최대 200만 원까지 충전할 수 있어요."
        error={validation.errorMessage}
        quickAmounts={QUICK_AMOUNTS}
        onMax={fillMax}
      />

      <BottomBtnBox
        backgroundColor={theme.colors.gray50}
        buttonKey={isButtonDisabled.toString()}
        disabled={isButtonDisabled}
        label={'다음'}
        onPress={() => {
          if (isButtonDisabled) return;
          navigation.navigate('TransferAcntCharge', { amount: chargeAmt });
        }}
      />
    </ScreenWrapper>
  );
};

export default ChargeAmtScreen;
export { ChargeAmtScreen };

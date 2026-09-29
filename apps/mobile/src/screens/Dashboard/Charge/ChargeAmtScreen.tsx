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

/** 빠른 금액 버튼. 한도가 200만 원이라 +100만은 쓸 일이 거의 없어 빼고 "전액" 으로 대신한다 */
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

    // 값이 입력되지 않은 최초 상태: 오류로 보지 않는다 (버튼만 꺼짐)
    if (!amount) {
      return { isValid: true };
    }

    // 최대 충전 금액 체크 (머니 잔액 포함 200만 원)
    if (currentBalance + numAmount > MAX_BALANCE) {
      return { isValid: false, errorMessage: '충전 한도를 초과했습니다. (보유 머니 포함 최대 200만 원)' };
    }

    // 최소 금액·1,000원 단위 체크. 서버(create_charge)가 같은 규칙으로 거절하므로 여기서 미리 알려준다
    if (numAmount < CHARGE_UNIT) {
      return { isValid: false, errorMessage: '최소 충전 가능 금액은 1,000원입니다.' };
    }
    if (numAmount % CHARGE_UNIT !== 0) {
      return { isValid: false, errorMessage: '충전은 1,000원 단위로 입력해 주세요.' };
    }

    return { isValid: true };
  };

  // 다음 버튼 활성화 상태 (비어 있거나 검증에 걸리면 비활성화)
  const validation = validateChargeAmount(chargeAmt);
  const isButtonDisabled = !chargeAmt || !validation.isValid;

  // 전액: 한도까지 채울 수 있는 금액. 1,000원 단위 아래는 버린다 (예: 1,854,900 → 1,854,000)
  const fillMax = () => {
    const room = Math.max(MAX_BALANCE - currentBalance, 0);
    const rounded = Math.floor(room / CHARGE_UNIT) * CHARGE_UNIT;
    setChargeAmt(rounded > 0 ? String(rounded) : '');
  };

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <AmountEntry
        question="얼마를 충전할까요?"
        amount={chargeAmt}
        onChangeAmount={setChargeAmt}
        hint="1,000원 단위로, 보유 머니 포함 최대 200만 원까지 충전할 수 있어요."
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

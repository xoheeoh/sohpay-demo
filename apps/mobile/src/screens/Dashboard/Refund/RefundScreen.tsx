import React, { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import { loadUserAmt } from '@apis/commonApi';
import { BottomBtnBox, BOTTOM_BTN_BOX_KEYBOARD_INSET, ScreenWrapper } from '@components/common';
import { AmountEntry, QuickAmount } from '@components/dashboard';
import { theme } from '@styles';

type RefundScreenProps = NativeStackScreenProps<RootStackParamList, 'Refund'>;

/** 빠른 금액 버튼 */
const QUICK_AMOUNTS: QuickAmount[] = [
  { label: '+1만', value: 10000 },
  { label: '+5만', value: 50000 },
  { label: '+10만', value: 100000 },
];

const RefundScreen: React.FC<RefundScreenProps> = ({ navigation }) => {
  // 출금 가능 금액 조회
  const [rmnAmt, setRmnAmt] = useState<number>(0);

  useEffect(() => {
    loadUserAmt().then((data) => {
      console.log('회원 잔액 조회 결과:', data);

      if (data.resultCd === '0000') {
        setRmnAmt(Number(data.ppCanRfndRmnAmt));
      }
    });
  }, []);

  // 잔액 출금 금액 (숫자만 담긴 문자열)
  const [withdrawalAmt, setWithdrawalAmt] = useState('');

  /** 출금 금액 검증. 서버(request_refund)도 0원 이하·잔액 초과를 거절하므로 같은 기준으로 미리 알려준다 */
  const validateWithdrawalAmount = (amount: string): { isValid: boolean; errorMessage?: string } => {
    // 미입력 상태는 오류로 보지 않고 버튼만 비활성화한다
    if (!amount) {
      return { isValid: true };
    }

    const numAmount = Number(amount);
    if (numAmount === 0) {
      return { isValid: false, errorMessage: '0원은 출금할 수 없어요. 1원 이상 입력해 주세요.' };
    }
    if (numAmount > rmnAmt) {
      return { isValid: false, errorMessage: `출금 가능 금액(${rmnAmt.toLocaleString('ko-KR')}원)을 초과했어요.` };
    }

    return { isValid: true };
  };

  const validation = validateWithdrawalAmount(withdrawalAmt);
  const isButtonDisabled = !withdrawalAmt || !validation.isValid;

  // 맨 아래 키패드가 회색이라 하단 안전 영역도 같은 색으로 이어 준다
  return (
    <ScreenWrapper
      backgroundColor="white"
      bottomSafeAreaColor={theme.colors.gray50}
      keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <AmountEntry
        question="얼마를 출금할까요?"
        amount={withdrawalAmt}
        onChangeAmount={setWithdrawalAmt}
        hint={`출금 가능 금액은 ${rmnAmt.toLocaleString('ko-KR')}원이에요.`}
        error={validation.errorMessage}
        quickAmounts={QUICK_AMOUNTS}
        onMax={() => setWithdrawalAmt(rmnAmt > 0 ? String(rmnAmt) : '')}
      />

      <BottomBtnBox
        backgroundColor={theme.colors.gray50}
        buttonKey={isButtonDisabled.toString()}
        disabled={isButtonDisabled}
        label={'다음'}
        onPress={() => {
          // 버튼이 꺼져 있어 보통 오지 않지만 안전장치로 한 번 더 막는다
          if (isButtonDisabled) return;
          navigation.navigate('RefundAcnt', { amt: Number(withdrawalAmt) });
        }}
      />
    </ScreenWrapper>
  );
};

export default RefundScreen;
export { RefundScreen };

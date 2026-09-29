import React, { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import { loadUserAmt } from '@apis/commonApi';
import { BottomBtnBox, BOTTOM_BTN_BOX_KEYBOARD_INSET, ScreenWrapper } from '@components/common';
import { AmountEntry, QuickAmount } from '@components/dashboard';
import { theme } from '@styles';

type RefundScreenProps = NativeStackScreenProps<RootStackParamList, 'Refund'>;

/** 빠른 금액 버튼. 충전 금액 화면과 같은 구성 */
const QUICK_AMOUNTS: QuickAmount[] = [
  { label: '+1만', value: 10000 },
  { label: '+5만', value: 50000 },
  { label: '+10만', value: 100000 },
];

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

  // 잔액 출금 금액 (숫자만 담긴 문자열)
  const [withdrawalAmt, setWithdrawalAmt] = useState('');

  /**
   * 출금 금액 검증 (충전 금액 화면과 같은 방식: 틀린 값이면 금액 아래 문구가 빨갛게 바뀌고 다음 버튼이 꺼진다)
   * 서버(request_refund)도 0원 이하·잔액 초과를 거절하므로 같은 기준으로 미리 알려준다
   */
  const validateWithdrawalAmount = (amount: string): { isValid: boolean; errorMessage?: string } => {
    // 값이 입력되지 않은 최초 상태: 오류로 보지 않는다 (버튼만 꺼짐)
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

  // 다음 버튼 활성화 상태 (비어 있거나 검증에 걸리면 비활성화)
  const validation = validateWithdrawalAmount(withdrawalAmt);
  const isButtonDisabled = !withdrawalAmt || !validation.isValid;

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
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
          // 틀린 값이면 버튼이 꺼져 있어 여기까지 오지 않지만, 안전장치로 한 번 더 막는다
          if (isButtonDisabled) return;
          navigation.navigate('RefundAcnt', { amt: Number(withdrawalAmt) });
        }}
      />
    </ScreenWrapper>
  );
};

export default RefundScreen;
export { RefundScreen };

import { useCallback, useEffect, useRef, useState } from 'react';

import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import type { RootStackParamList } from '@typ/navigation';
import { useDialog } from '@contexts/DialogContext';
import { goBackToDashboard } from '@utils/navigationHelpers';
import { chkPinNum } from '@apis/usrApi';
import { newIdempotencyKey } from '@apis/client';
import { requestRefundAcnt } from '@apis/paymentApi';
import { PinPad, ScreenWrapper, Typography } from '@components/common';

type PinPayRefundScreenProps = NativeStackScreenProps<RootStackParamList, 'PinPayRefund'>;

const PinPayRefundScreen: React.FC<PinPayRefundScreenProps> = ({ navigation, route }) => {
  const refundAmt = route.params.amt;

  const [isFocused, setIsFocused] = useState(false);

  const { confirm } = useDialog();

  /**
   * 중복 방지 키. 화면에 들어올 때 한 번 만들어 PIN 을 다시 입력해도 같은 값을 보내므로,
   * 응답을 기다리는 동안 재입력해도 출금이 두 번 실행되지 않는다.
   */
  const idempotencyKeyRef = useRef<string>(newIdempotencyKey());

  // 출금 요청이 진행 중인 동안은 키패드 입력을 받지 않는다
  const isSubmittingRef = useRef(false);

  // 입력한 자릿수만큼 점을 채운다
  const [dots, setDots] = useState(Array(6).fill(false));
  const [inputCount, setInputCount] = useState<number>(0);

  // 0~9 를 무작위로 섞은 키패드 배열. 재배열 버튼을 누를 때마다 다시 섞는다
  const generateRandomKeypad = () => {
    const numbers = Array.from({ length: 10 }, (_, i) => i);
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return numbers;
  };

  const [keypadNumbers, setKeypadNumbers] = useState<number[]>(generateRandomKeypad());

  useEffect(() => {
    setKeypadNumbers(generateRandomKeypad());
  }, []);

  const handleKeyPress = (num: number) => {
    if (isSubmittingRef.current) return;
    if (inputCount < 6) {
      const newDots = [...dots];
      newDots[inputCount] = true;
      setDots(newDots);
      setInputCount(inputCount + 1);
      setEnteredNumbers([...enteredNumbers, num]);
    }
  };

  const handleDelete = () => {
    if (isSubmittingRef.current) return;
    if (inputCount > 0) {
      const newDots = [...dots];
      newDots[inputCount - 1] = false;
      setDots(newDots);
      setInputCount(inputCount - 1);
      setEnteredNumbers(enteredNumbers.slice(0, -1));
    }
  };

  const handleShuffle = () => {
    setKeypadNumbers(generateRandomKeypad());
  };

  // 키패드 위 3줄에 9개를 놓고, 남은 하나를 마지막 줄 가운데에 둔다
  const topNumbers = keypadNumbers.slice(0, 9);
  const remainingNumber = Array.from({ length: 10 }, (_, i) => i).find((num) => !topNumbers.includes(num));

  // 다른 화면에 다녀오면 입력을 처음부터 다시 받는다
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);

      setDots(Array(6).fill(false));
      setInputCount(0);
      setEnteredNumbers([]);
      isSubmittingRef.current = false;
      idempotencyKeyRef.current = newIdempotencyKey(); // 새로 들어온 출금은 새 요청이므로 키도 새로 만든다
    }, []),
  );

  const [enteredNumbers, setEnteredNumbers] = useState<number[]>([]);
  const [error, setError] = useState<boolean>(false);
  const [exceed, setExceed] = useState<boolean>(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null); // 서버가 알려주는 남은 시도 횟수

  // 6자리가 채워지면 서버에 비밀번호를 확인한다
  useEffect(() => {
    if (enteredNumbers.length === 6) {
      const finalNumber = enteredNumbers.join('');

      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      chkPinNum(finalNumber, 'RFND').then((data) => {
        // 응답이 오기 전에 화면을 떠났으면 무시한다
        if (!isFocused) return;

        if (data.resultCd === '0000') {
          handleRequestRfnd(finalNumber);
          return; // 출금 요청이 끝날 때까지 입력 잠금 유지
        }

        isSubmittingRef.current = false;
        if (data.resultCd === '9004') {
          // 5회 초과로 잠김
          setExceed(true);
          console.log('핀 번호 불일치!', data.resultMsg);

          setDots(Array(6).fill(false));
          setEnteredNumbers([]);
          setInputCount(0);
        } else {
          // 서버가 남은 횟수를 알려주면 함께 보여준다
          setRemainingAttempts(typeof data.remainingAttempts === 'number' ? data.remainingAttempts : null);
          setError(true);
          console.log('핀 번호 불일치!', data.resultMsg);

          setDots(Array(6).fill(false));
          setEnteredNumbers([]);
          setInputCount(0);
        }
      });
    }
  }, [enteredNumbers]);

  // 오류 토스트
  useEffect(() => {
    if (error && !exceed) {
      Toast.show({
        type: 'error',
        text1:
          remainingAttempts !== null
            ? `비밀번호가 올바르지 않습니다. (남은 횟수 ${remainingAttempts}회)\n5회 틀리면 10분간 잠깁니다.`
            : '비밀번호가 올바르지 않습니다.\n비밀번호를 확인 후 다시 입력해 주세요.',
      });
      // 다음 실패에도 토스트가 다시 뜨도록 되돌린다
      setError(false);
    } else if (exceed) {
      Toast.show({
        type: 'error',
        // 서버 규칙: 5회 틀리면 10분 뒤 자동으로 풀린다
        text1: '간편 비밀번호를 5회 잘못 입력해 10분간 잠겼습니다.\n잠시 후 다시 시도해 주세요.',
      });
      setExceed(false);
    }
  }, [error, exceed, remainingAttempts]);

  const handleRequestRfnd = async (finalNumber: string) => {
    requestRefundAcnt(refundAmt.toString(), finalNumber, idempotencyKeyRef.current).then((data) => {
      console.log('출금 요청 결과:', data);
      isSubmittingRef.current = false;

      if (data.resultCd === '0000') {
        const success = {
          mbUid: data.mbUid,
          refundAmt: data.refundAmt,
          ppRmnAmt: data.ppRmnAmt,
          ppMthdId: data.ppMthdId,
          rfndNo: data.rfndNo,
        };

        navigation.navigate('RefundSuc', { data: success, acnt: route.params.acnt });
      } else {
        confirm({
          title: '출금실패',
          message1: data.resultMsg,
          confirmText: '돌아가기',
        }).then((ok) => {
          if (ok) {
            goBackToDashboard(navigation);
          }
        });
      }
    });
  };

  return (
    <ScreenWrapper backgroundColor="white" topComponent={false}>
      <PinPad
        title="간편 비밀번호 입력"
        description={
          <>
            간편 비밀번호{' '}
            <Typography mode="subtitle3" color="primary">
              6자리
            </Typography>
            를 입력해 주세요.
          </>
        }
        dots={dots}
        topNumbers={topNumbers}
        remainingNumber={remainingNumber}
        onKeyPress={handleKeyPress}
        onShuffle={handleShuffle}
        onDelete={handleDelete}
        error={error}
      />{' '}
    </ScreenWrapper>
  );
};

export default PinPayRefundScreen;
export { PinPayRefundScreen };

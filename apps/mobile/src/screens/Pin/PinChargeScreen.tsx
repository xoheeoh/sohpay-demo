import { useCallback, useEffect, useState } from 'react';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import type { RootStackParamList } from '@typ/navigation';
import { chkPinNum } from '@apis/usrApi';
import { PinPad, ScreenWrapper, Typography } from '@components/common';

type PinChargeScreenProps = NativeStackScreenProps<RootStackParamList, 'PinCharge'>;

const PinChargeScreen: React.FC<PinChargeScreenProps> = ({ navigation, route }) => {
  const { chargeAmt } = route.params;

  const [isFocused, setIsFocused] = useState(false);

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
    if (inputCount < 6) {
      const newDots = [...dots];
      newDots[inputCount] = true;
      setDots(newDots);
      setInputCount(inputCount + 1);
      setEnteredNumbers([...enteredNumbers, num]);
    }
  };

  const handleDelete = () => {
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

      chkPinNum(finalNumber, 'PPNP').then((data) => {
        // 응답이 오기 전에 화면을 떠났으면 무시한다
        if (!isFocused) return;

        if (data.resultCd === '0000') {
          navigation.navigate('ChargeAcntWeb', { chargeAmt: chargeAmt });
        } else if (data.resultCd === '9004') {
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
    // 의존성이 없으면 렌더마다 다시 돌아 응답 대기 중 재배열만 눌러도 검증이 한 번 더 나가므로, 입력값이 바뀔 때만 확인한다
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

export default PinChargeScreen;
export { PinChargeScreen };

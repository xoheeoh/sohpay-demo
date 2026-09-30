import React, { useEffect, useState } from 'react';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import type { RootStackParamList } from '@typ/navigation';
import { validationPinNo } from '@apis/usrApi';
import { PinPad, ScreenWrapper, Typography } from '@components/common';

type EditPinNoScreenProps = NativeStackScreenProps<RootStackParamList, 'EditPinNo'>;

const EditPinNoScreen: React.FC<EditPinNoScreenProps> = ({ navigation, route }) => {
  const { usrData, pwd } = route.params;

  const [isFocused, setIsFocused] = useState(false);

  // 입력한 자릿수만큼 점을 채운다
  const [dots, setDots] = useState(Array(6).fill(false));
  const [inputCount, setInputCount] = useState<number>(0);
  const [enteredNumbers, setEnteredNumbers] = useState<number[]>([]);

  // 6자리가 채워지면 서버의 비밀번호 규칙 검사(생년월일·전화번호 포함 여부 등)를 거쳐 확인 화면으로 넘어간다
  useEffect(() => {
    if (enteredNumbers.length === 6) {
      const finalNumber = enteredNumbers.join('');

      validationPinNo(finalNumber, undefined, usrData.brthDt, usrData.hpNo).then((data) => {
        // 응답이 오기 전에 화면을 떠났으면 무시한다
        if (!isFocused) return;

        if (data.resultCd === '0000') {
          console.log('핀 번호 유효성 검증 통과! 다음 화면으로 이동...');
          navigation.navigate('EditPinNoChk', { newPin: finalNumber, pwd: pwd });
        } else {
          Toast.show({
            type: 'error',
            text1: `${data.resultMsg}`,
          });

          setDots(Array(6).fill(false));
          setInputCount(0);
          setEnteredNumbers([]);
        }
      });
    }
  }, [enteredNumbers, navigation, isFocused]);

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
    React.useCallback(() => {
      setIsFocused(true);

      setDots(Array(6).fill(false));
      setInputCount(0);
      setEnteredNumbers([]);
    }, []),
  );

  return (
    <ScreenWrapper backgroundColor="white" topComponent={false}>
      <PinPad
        title="간편 비밀번호 설정"
        description={
          <>
            새로운 간편 비밀번호{' '}
            <Typography mode="subtitle3" color="primary">
              6자리
            </Typography>
            를 입력해주세요.
          </>
        }
        dots={dots}
        topNumbers={topNumbers}
        remainingNumber={remainingNumber}
        onKeyPress={handleKeyPress}
        onShuffle={handleShuffle}
        onDelete={handleDelete}
      />
    </ScreenWrapper>
  );
};

export default EditPinNoScreen;
export { EditPinNoScreen };

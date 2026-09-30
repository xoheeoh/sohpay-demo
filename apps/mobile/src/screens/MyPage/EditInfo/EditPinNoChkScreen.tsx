import React, { useEffect, useState } from 'react';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import type { RootStackParamList } from '@typ/navigation';
import { IUserData } from '@typ/userType';
import { mergeData } from '@storages/asyncStorage';
import { useDialog } from '@contexts/DialogContext';
import { editPinNo } from '@apis/usrApi';
import { PinPad, ScreenWrapper, Typography } from '@components/common';

type EditPinNoChkScreenProps = NativeStackScreenProps<RootStackParamList, 'EditPinNoChk'>;

const EditPinNoChkScreen: React.FC<EditPinNoChkScreenProps> = ({ navigation, route }) => {
  // 확인된 계정 비밀번호와 설정 화면에서 입력한 새 간편 비밀번호
  const pwd = route.params.pwd;
  const previousNumber = route.params.newPin;

  const [isFocused, setIsFocused] = useState(false);

  const { confirm } = useDialog();

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
    React.useCallback(() => {
      setIsFocused(true);

      setDots(Array(6).fill(false));
      setEnteredNumbers([]);
    }, []),
  );

  const [enteredNumbers, setEnteredNumbers] = useState<number[]>([]);

  const handleSavePinNumData = async (finalNumber: string) => {
    const thirdStepData: Partial<IUserData> = {
      usrPin: finalNumber,
    };

    await mergeData<IUserData>('userData', thirdStepData);
  };

  // 6자리가 채워지면 설정 화면의 값과 비교한 뒤 변경을 요청한다
  useEffect(() => {
    if (enteredNumbers.length === 6) {
      const finalNumber = enteredNumbers.join('');

      if (finalNumber !== previousNumber) {
        if (!isFocused) return;

        // 두 입력이 다르면 서버를 거치지 않고 바로 다시 입력받는다
        Toast.show({
          type: 'error',
          text1: `비밀번호가 올바르지 않습니다.\n비밀번호를 확인 후 다시 입력해주세요.`,
        });

        setDots(Array(6).fill(false));
        setInputCount(0);
        setEnteredNumbers([]);
      } else {
        editPinNo(pwd, finalNumber).then((data) => {
          if (data.resultCd === '0000') {
            handleSavePinNumData(finalNumber).then(() => {
              confirm({
                title: '변경 성공',
                message1: '간편 비밀번호 변경에 성공하였습니다.',
                confirmText: '확인',
              }).then((ok) => {
                if (ok) {
                  navigation.navigate('MyPage');
                }
              });
            });
          } else {
            confirm({
              title: '변경 실패',
              message1: '간편 비밀번호 변경에 실패하였습니다.',
              message2: data.resultMsg,
              confirmText: '돌아가기',
            }).then((ok) => {
              if (ok) {
                navigation.goBack();
              }
            });

            setDots(Array(6).fill(false));
            setInputCount(0);
            setEnteredNumbers([]);
          }
        });
      }
    }
  }, [previousNumber, enteredNumbers, navigation]);

  return (
    <ScreenWrapper backgroundColor="white" topComponent={false}>
      <PinPad
        title="간편 비밀번호 확인"
        description={
          <>
            새로운 간편 비밀번호{' '}
            <Typography mode="subtitle3" color="primary">
              6자리
            </Typography>
            를 다시 입력해주세요.
          </>
        }
        dots={dots}
        topNumbers={topNumbers}
        remainingNumber={remainingNumber}
        onKeyPress={handleKeyPress}
        onShuffle={handleShuffle}
        onDelete={handleDelete}
      />{' '}
    </ScreenWrapper>
  );
};

export default EditPinNoChkScreen;
export { EditPinNoChkScreen };

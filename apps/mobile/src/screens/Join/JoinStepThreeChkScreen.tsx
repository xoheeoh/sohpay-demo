import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import type { RootStackParamList } from '@typ/navigation';
import { IUserData } from '@typ/userType';
import { getData, mergeData } from '@storages/asyncStorage';
import { PinPad, ScreenWrapper, Typography } from '@components/common';

import styles from './JoinStepScreen.styles';

type JoinStepThreeChkScreenProps = NativeStackScreenProps<RootStackParamList, 'JoinThreeChk'>;

const JoinStepThreeChkScreen: React.FC<JoinStepThreeChkScreenProps> = ({ navigation, route }) => {
  // 설정 화면에서 입력한 간편 비밀번호
  const previousNumber = route.params.number;

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

  const handleSavePinNumData = async (finalNumber: string) => {
    const thirdStepData: Partial<IUserData> = {
      usrPin: finalNumber,
    };

    console.log('[회원가입 3단계 확인 화면] 저장할 PIN 데이터:', thirdStepData);

    await mergeData<IUserData>('userData', thirdStepData);

    const savedData = await getData<IUserData>('userData');
    console.log('========================================');
    console.log('[회원가입 3단계 확인 화면] AsyncStorage 저장 완료');
    console.log('저장된 전체 userData:', JSON.stringify(savedData, null, 2));
    console.log('========================================');
  };

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
        handleSavePinNumData(finalNumber)
          .then(() => {
            navigation.navigate('JoinCompleted');
          })
          .catch((error) => console.error(error));
      }
    }
  }, [previousNumber, enteredNumbers, navigation]);

  return (
    <ScreenWrapper backgroundColor="white" topComponent={false}>
      <PinPad
        title="간편 비밀번호 확인"
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

        topSlot={
          <View style={styles.stepBox}>
            <View style={styles.stepBadge}>
              <Typography mode="caption1" color="gray900">
                1
              </Typography>
            </View>

            <View style={styles.stepLine}></View>

            <View style={styles.stepBadge}>
              <Typography mode="caption1" color="gray900">
                2
              </Typography>
            </View>

            <View style={styles.stepLine}></View>

            <View style={styles.stepBadgeActive}>
              <Typography mode="caption1" color="white">
                3
              </Typography>
            </View>
          </View>
        }
      />{' '}
    </ScreenWrapper>
  );
};

export default JoinStepThreeChkScreen;
export { JoinStepThreeChkScreen };

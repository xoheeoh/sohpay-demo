import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import type { RootStackParamList } from '@typ/navigation';
import { validationPinNo } from '@apis/usrApi';
import { PinPad, ScreenWrapper, Typography } from '@components/common';

import styles from './JoinStepScreen.styles';

type JoinStepThreeScreenProps = NativeStackScreenProps<RootStackParamList, 'JoinThree'>;

const JoinStepThreeScreen: React.FC<JoinStepThreeScreenProps> = ({ navigation, route }) => {
  // 이전 화면에서 얻어온 본인인증 키값
  const { memberAuthKey } = route.params;

  // 화면 포커스 상태 관리
  const [isFocused, setIsFocused] = useState(false);

  /**
   * dot 관련 설정
   * 숫자 입력 개수에 따라 dot이 active 상태로 변함
   */
  const [dots, setDots] = useState(Array(6).fill(false)); // dot 상태
  const [inputCount, setInputCount] = useState<number>(0); // 입력 개수
  const [enteredNumbers, setEnteredNumbers] = useState<number[]>([]); // 입력된 숫자 저장

  // 6자리 숫자를 설정하면, 간편 비밀번호 확인 화면으로 이동
  useEffect(() => {
    if (enteredNumbers.length === 6) {
      const finalNumber = enteredNumbers.join('');

      validationPinNo(finalNumber, memberAuthKey).then((data) => {
        // 화면이 포커스되어 있지 않으면 처리하지 않음 (다른 화면으로 이동한 경우)
        if (!isFocused) return;

        if (data.resultCd === '0000') {
          // 유효성 검증 통과 성공
          console.log('핀 번호 유효성 검증 통과! 다음 화면으로 이동...');
          navigation.navigate('JoinThreeChk', { number: finalNumber });
        } else {
          // 유효성 검증 통과 실패 - 에러 메시지 표시
          Toast.show({
            type: 'error',
            text1: data.resultMsg,
          });

          // 입력했던 비밀번호 초기화
          setDots(Array(6).fill(false));
          setInputCount(0);
          setEnteredNumbers([]);
        }
      });
    }
  }, [enteredNumbers, navigation, isFocused]);

  /**
   * 키패드 관련 설정
   * 3 x 4 사이즈 키패드에 0~9 사이의 숫자 랜덤으로 설정
   * 재배열 버튼 및 삭제 버튼
   */
  // 숫자 배열 생성 및 랜덤화 (0~9)
  const generateRandomKeypad = () => {
    const numbers = Array.from({ length: 10 }, (_, i) => i); // 0~9 숫자 배열
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return numbers; // 전체 배열 반환
  };

  const [keypadNumbers, setKeypadNumbers] = useState<number[]>(generateRandomKeypad()); // 키패드 랜덤 숫자 배열 (0~9)

  useEffect(() => {
    // 컴포넌트 마운트 시 초기 랜덤 키패드 생성
    setKeypadNumbers(generateRandomKeypad());
  }, []);

  // 숫자 클릭 핸들러
  const handleKeyPress = (num: number) => {
    if (inputCount < 6) {
      const newDots = [...dots];
      newDots[inputCount] = true; // dot 활성화
      setDots(newDots);
      setInputCount(inputCount + 1);
      setEnteredNumbers([...enteredNumbers, num]); // 숫자 저장
    }
  };

  // 삭제 버튼 핸들러
  const handleDelete = () => {
    if (inputCount > 0) {
      const newDots = [...dots];
      newDots[inputCount - 1] = false; // dot 비활성화
      setDots(newDots);
      setInputCount(inputCount - 1);
      setEnteredNumbers(enteredNumbers.slice(0, -1)); // 마지막 숫자 제거
    }
  };

  // 재배열 버튼 핸들러
  const handleShuffle = () => {
    setKeypadNumbers(generateRandomKeypad());
  };

  // 키패드 상단 3줄 숫자 (랜덤 9개)
  const topNumbers = keypadNumbers.slice(0, 9);

  // 마지막 줄 가운데 숫자 (0~9 중 topNumbers에 없는 숫자)
  const remainingNumber = Array.from({ length: 10 }, (_, i) => i).find((num) => !topNumbers.includes(num));

  /**
   * 다른 화면에 갔다가 간편 비밀번호 화면 재진입 시,
   * 기존에 입력해뒀던 모든 상태 초기화
   */
  useFocusEffect(
    useCallback(() => {
      // 화면 포커스 상태 설정
      setIsFocused(true);

      // 상태 초기화
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
      />
    </ScreenWrapper>
  );
};

export default JoinStepThreeScreen;
export { JoinStepThreeScreen };

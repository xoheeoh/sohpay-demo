import { useCallback, useEffect, useState } from 'react';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import type { RootStackParamList } from '@typ/navigation';
import { chkPinNum } from '@apis/usrApi';
import { PinPad, ScreenWrapper, Typography } from '@components/common';

type PinChargeScreenProps = NativeStackScreenProps<RootStackParamList, 'PinCharge'>;

const PinChargeScreen: React.FC<PinChargeScreenProps> = ({ navigation, route }) => {
  // 이전 화면에서 얻어온 결제 금액 파라미터
  const { chargeAmt } = route.params;

  // 화면 포커스 상태 관리
  const [isFocused, setIsFocused] = useState(false);

  /**
   * dot 관련 설정
   * 숫자 입력 개수에 따라 dot이 active 상태로 변함
   */
  const [dots, setDots] = useState(Array(6).fill(false)); // dot 상태
  const [inputCount, setInputCount] = useState<number>(0); // 입력 개수

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

  /**
   * 간편 비밀번호 6자리 숫자 입력이 완료되면 완성된 숫자가 비밀번호가 맞는지 확인
   * 잘못된 비밀번호라면 오류 메시지 노출
   */
  const [enteredNumbers, setEnteredNumbers] = useState<number[]>([]); // 입력된 숫자 저장
  const [error, setError] = useState<boolean>(false);
  const [exceed, setExceed] = useState<boolean>(false);

  // 6자리 숫자 입력이 완료되면 맞는지 확인
  useEffect(() => {
    if (enteredNumbers.length === 6) {
      const finalNumber = enteredNumbers.join('');

      chkPinNum(finalNumber, 'PPNP').then((data) => {
        // 화면이 포커스되어 있지 않으면 처리하지 않음
        if (!isFocused) return;

        if (data.resultCd === '0000') {
          // 핀 번호 일치 - 충전 URL 발급 화면으로 이동
          navigation.navigate('ChargeAcntWeb', { chargeAmt: chargeAmt });
        } else if (data.resultCd === '9004') {
          // 핀 번호 5회 이상 오류
          setExceed(true);
          console.log('핀 번호 불일치!', data.resultMsg);

          // 입력했던 비밀번호 초기화
          setDots(Array(6).fill(false));
          setEnteredNumbers([]);
          setInputCount(0);
        } else {
          // 핀 번호 불일치 (5회 초과 전)
          setError(true);
          console.log('핀 번호 불일치!', data.resultMsg);

          // 입력했던 비밀번호 초기화
          setDots(Array(6).fill(false));
          setEnteredNumbers([]);
          setInputCount(0);
        }
      });
    }
    // 입력된 숫자가 바뀔 때만 확인한다. 의존성 배열이 없으면 렌더마다 다시 돌아 대기 중 "재배열"만 눌러도 검증이 한 번 더 나간다
  }, [enteredNumbers]);

  // 오류 토스트 표시
  useEffect(() => {
    if (error && !exceed) {
      Toast.show({
        type: 'error',
        text1: '비밀번호가 올바르지 않습니다.\n비밀번호를 확인 후 다시 입력해 주세요.',
      });
      // Toast 표시 후 error 상태 초기화하여 다음 실패 시에도 Toast가 표시되도록 함
      setError(false);
    } else if (exceed) {
      Toast.show({
        type: 'error',
        text1: '비밀번호를 5회 이상 실패하셨습니다.\n변경 후 사용해 주세요.',
      });
      // Toast 표시 후 exceed 상태 초기화
      setExceed(false);
    }
  }, [error, exceed]);

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

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
  // 이전 화면에서 얻어온 사용자 패스워드 및 새 간편 비밀번호 정보
  const pwd = route.params.pwd;
  const previousNumber = route.params.newPin;

  // 화면 포커스 상태 관리
  const [isFocused, setIsFocused] = useState(false);

  // Dialog
  const { confirm } = useDialog();

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
    React.useCallback(() => {
      // 화면 포커스 상태 설정
      setIsFocused(true);

      // 상태 초기화
      setDots(Array(6).fill(false));
      setEnteredNumbers([]);
    }, []),
  );

  /**
   * 이전 화면에서 가져온 비밀번호와 현재 입력된 비밀번호 비교
   * 서로 다르면 오류 토스트 노출
   * 같으면 변경 시도 및 성공 모달 노출
   */
  const [enteredNumbers, setEnteredNumbers] = useState<number[]>([]); // 입력된 숫자 저장

  // PIN 번호 저장
  const handleSavePinNumData = async (finalNumber: string) => {
    const thirdStepData: Partial<IUserData> = {
      usrPin: finalNumber,
    };

    await mergeData<IUserData>('userData', thirdStepData);
  };

  // 6자리 숫자를 설정하면, 비교 후 간편 비밀번호 변경 시도
  useEffect(() => {
    if (enteredNumbers.length === 6) {
      const finalNumber = enteredNumbers.join('');

      if (finalNumber !== previousNumber) {
        if (!isFocused) return;

        // 비밀번호가 다름 - 클라이언트 측에서만 처리
        Toast.show({
          type: 'error',
          text1: `비밀번호가 올바르지 않습니다.\n비밀번호를 확인 후 다시 입력해주세요.`,
        });

        // 입력했던 비밀번호 초기화
        setDots(Array(6).fill(false));
        setInputCount(0);
        setEnteredNumbers([]);
      } else {
        // 비밀번호 일치 - 간편 비밀번호 수정 API 호출
        editPinNo(pwd, finalNumber).then((data) => {
          if (data.resultCd === '0000') {
            // 변경 성공 (핀 번호 새로 저장 및 성공 모달 노출)
            handleSavePinNumData(finalNumber).then(() => {
              // 성공 알림 모달
              confirm({
                title: '변경 성공',
                message1: '간편 비밀번호 변경에 성공하였습니다.',
                confirmText: '확인',
              }).then((ok) => {
                if (ok) {
                  navigation.navigate('MyPage'); // 마이페이지로 이동
                }
              });
            });
          } else {
            // 실패 알림 모달
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

            // 입력했던 비밀번호 초기화
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

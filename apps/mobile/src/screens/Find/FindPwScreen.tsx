import React, { useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import LottieView from 'lottie-react-native';
import checksucess from '@images/animation/checksuccess.json';

import type { RootStackParamList } from '@typ/navigation';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  Typography,
} from '@components/common';
import styles from './FindScreen.styles';

type FindPwScreenProps = NativeStackScreenProps<RootStackParamList, 'FindPw'>;

const FindPwScreen: React.FC<FindPwScreenProps> = ({ navigation, route }) => {
  // 이전 화면에서 얻은 회원 ID 값
  const mbUid = route.params.mbUid;

  // 화면 재진입 시, 애니메이션 다시 재생
  const [play, setPlay] = useState<boolean>(false);
  useFocusEffect(
    React.useCallback(() => {
      setPlay(true);
    }, []),
  );

  // 제스처 뒤로가기 방지
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
    });

    const backAction = () => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }], // 'Login' 화면으로 이동 (스택 리셋)
      });
      return true; // 기본 뒤로가기 동작 방지
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.wrap, styles.successWrap]}
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        {/* 결과 메시지 */}
        <View style={{ gap: 12 }}>
          <View style={{ alignItems: 'center' }}>
            <Typography mode="subtitle1" color="gray900">
              임시 PW 발송에 성공하였습니다.
            </Typography>
          </View>

          <View style={{ alignItems: 'center' }}>
            <Typography mode="body2" color="gray900" style={{ textAlign: 'center' }}>
              {mbUid} 계정에 대한{' '}
              <Typography mode="subtitle3" color="gray900" style={{ textAlign: 'center' }}>
                임시 PW가 이메일 주소로 발송
              </Typography>
              되었습니다.
            </Typography>
            <Typography mode="body2" color="gray900">
              로그인 후, 비밀번호를 변경해주시기 바랍니다.
            </Typography>
          </View>
        </View>

        {/* 성공 애니메이션 */}
        <LottieView
          source={checksucess}
          autoPlay={play}
          loop={false}
          style={{ width: 180, height: 180, alignSelf: 'center' }}
        />
      </KeyboardAwareScrollView>

      <BottomBtnBox
        buttonKey={'confirm'}
        disabled={false}
        label={'확인'}
        onPress={() => navigation.navigate('Login')}
      />
    </ScreenWrapper>
  );
};

export default FindPwScreen;
export { FindPwScreen };

import { useCallback, useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import LottieView from 'lottie-react-native';
import checksucess from '@images/animation/checksuccess.json';

import type { RootStackParamList } from '@typ/navigation';
import { formatYYYYMMDDDate, maskUid } from '@utils/formatter';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  Typography,
} from '@components/common';
import styles from './FindScreen.styles';

type FindIdScreenProps = NativeStackScreenProps<RootStackParamList, 'FindId'>;

const FindIdScreen: React.FC<FindIdScreenProps> = ({ navigation, route }) => {
  // 이전 화면에서 얻은 회원 ID 및 가입일시 값
  const { mbUid, regDnt } = route.params;

  // 화면 재진입 시, 애니메이션 다시 재생
  const [play, setPlay] = useState<boolean>(false);
  useFocusEffect(
    useCallback(() => {
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
              ID 찾기에
            </Typography>
            <Typography mode="subtitle1" color="gray900">
              성공하였습니다.
            </Typography>
          </View>

          <View style={{ alignItems: 'center' }}>
            <Typography mode="body2" color="gray900" style={{ textAlign: 'center' }}>
              개인정보 도용 방지를 위하여 ID 가운데 5자리를 음영처리 합니다.
            </Typography>
            <Typography mode="body2" color="gray900">
              <Typography mode="subtitle3" color="gray900">
                등록된 이메일로 ID 찾기 결과 메일이 발송
              </Typography>
              되었습니다.
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

        {/* 회원 정보 */}
        <View style={{ alignItems: 'center', gap: 16 }}>
          <Typography mode="subtitle2" color="gray900">
            회원정보
          </Typography>

          <View style={{ gap: 8 }}>
            <View style={styles.userInfoBox}>
              <Typography mode="body2" color="gray900" style={{ width: 55 }}>
                ID
              </Typography>
              <Typography mode="body2" color="gray600">
                {maskUid(mbUid)}
              </Typography>
            </View>

            <View style={styles.userInfoBox}>
              <Typography mode="body2" color="gray900" style={{ width: 55 }}>
                가입일자
              </Typography>
              <Typography mode="body2" color="gray600">
                {formatYYYYMMDDDate(regDnt)}
              </Typography>
            </View>
          </View>
        </View>
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

export default FindIdScreen;
export { FindIdScreen };

import { useEffect } from 'react';
import { BackHandler, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  SuccessAnimation,
  Typography,
} from '@components/common';
import styles from './FindScreen.styles';

type FindPwScreenProps = NativeStackScreenProps<RootStackParamList, 'FindPw'>;

const FindPwScreen: React.FC<FindPwScreenProps> = ({ navigation, route }) => {
  // 이전 화면에서 얻은 회원 ID 값. tempPwd 는 데모 전용: 메일을 보내지 않아 임시 비밀번호를 화면에 표시한다
  const { mbUid, tempPwd } = route.params;

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
        {/* ID 찾기 성공 화면과 같은 구조: 애니메이션 → 제목 → 결과 카드 */}
        <View style={styles.successBody}>
          <SuccessAnimation size={200} style={styles.successAnimation} />

          {/* 결과 메시지 */}
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Typography mode="heading3" color="gray900">
              {tempPwd ? '임시 PW 발급에 성공하였습니다.' : '임시 PW 발송에 성공하였습니다.'}
            </Typography>
            <Typography mode="body2" color="gray600" style={{ textAlign: 'center' }}>
              {tempPwd
                ? '임시 PW로 로그인한 뒤, 비밀번호를 변경해주시기 바랍니다.'
                : '이메일로 받은 임시 PW로 로그인한 뒤, 비밀번호를 변경해주시기 바랍니다.'}
            </Typography>
          </View>

          {/* 계정 정보 카드. 데모 전용으로 임시 비밀번호까지 보여준다 (메일 발송이 없어서) */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Typography mode="body2" color="gray600">
                ID
              </Typography>
              <Typography mode="subtitle2" color="gray900" selectable>
                {mbUid}
              </Typography>
            </View>
            {tempPwd ? (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Typography mode="body2" color="gray600">
                    임시 PW
                  </Typography>
                  <Typography mode="subtitle2" color="primary" selectable>
                    {tempPwd}
                  </Typography>
                </View>
              </>
            ) : null}
          </View>

          {tempPwd ? (
            <Typography mode="caption1" color="gray500" style={{ textAlign: 'center' }}>
              데모 환경은 메일을 보내지 않아 임시 PW를 화면에 표시합니다.
            </Typography>
          ) : null}
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

export default FindPwScreen;
export { FindPwScreen };

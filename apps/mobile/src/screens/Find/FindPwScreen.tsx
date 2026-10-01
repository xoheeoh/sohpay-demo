import { useEffect } from 'react';
import { BackHandler, Platform, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import {
  BottomBtnBox,
  useBottomBtnBoxHeight,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  SuccessAnimation,
  Typography,
} from '@components/common';
import styles from './FindScreen.styles';

/**
 * 하단 버튼 상자가 스크롤 영역 위에 떠 있어 단순 가운데 정렬은 아래로 치우쳐 보이므로,
 * 버튼 위 영역 기준으로 가운데를 맞추기 위한 추가 아래 여백.
 */
const CENTERING_LIFT = 24;

type FindPwScreenProps = NativeStackScreenProps<RootStackParamList, 'FindPw'>;

const FindPwScreen: React.FC<FindPwScreenProps> = ({ navigation, route }) => {
  const centeringExtraBottomPadding = useBottomBtnBoxHeight() - BOTTOM_BTN_BOX_KEYBOARD_INSET + CENTERING_LIFT;
  // tempPwd 는 데모 전용: 메일을 보내지 않아 임시 비밀번호를 화면에 표시한다
  const { mbUid, tempPwd } = route.params;

  // 완료 화면에서는 뒤로가기를 막고 로그인 화면으로 보낸다
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
    });

    const backAction = () => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      return true; // 기본 뒤로가기 동작 방지
    };

    // 웹에는 BackHandler 가 없어(콘솔 오류) 앱에서만 등록한다
    if (Platform.OS === 'web') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.wrap, styles.successWrap]}
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}
        extraBottomPadding={centeringExtraBottomPadding}>
        <View style={styles.hero}>
          <SuccessAnimation size={160} style={styles.animation} />

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
        </View>

        <View style={styles.resultBlock}>
          {/* 데모는 메일을 보내지 않아 임시 비밀번호를 카드에 함께 보여준다 */}
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

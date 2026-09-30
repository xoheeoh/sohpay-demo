import { useEffect } from 'react';
import { BackHandler, Platform, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import { formatYYYYMMDDDate } from '@utils/formatter';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_HEIGHT,
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
const CENTERING_EXTRA_BOTTOM_PADDING = BOTTOM_BTN_BOX_HEIGHT - BOTTOM_BTN_BOX_KEYBOARD_INSET + 24;

type FindIdScreenProps = NativeStackScreenProps<RootStackParamList, 'FindId'>;

const FindIdScreen: React.FC<FindIdScreenProps> = ({ navigation, route }) => {
  const { mbUid, regDnt } = route.params;

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
        extraBottomPadding={CENTERING_EXTRA_BOTTOM_PADDING}>
        <View style={styles.hero}>
          <SuccessAnimation size={160} style={styles.animation} />

          <View style={{ alignItems: 'center', gap: 6 }}>
            <Typography mode="heading3" color="gray900">
              ID 찾기에 성공하였습니다.
            </Typography>
            <Typography mode="body2" color="gray600" style={{ textAlign: 'center' }}>
              아래 ID로 로그인해 주세요.
            </Typography>
          </View>
        </View>

        <View style={styles.resultBlock}>
          {/* 본인인증을 거친 뒤라 ID 를 가리지 않고 그대로 보여준다 */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Typography mode="body2" color="gray600">
                ID
              </Typography>
              <Typography mode="subtitle2" color="gray900" selectable>
                {mbUid}
              </Typography>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Typography mode="body2" color="gray600">
                가입일자
              </Typography>
              <Typography mode="subtitle3" color="gray900">
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

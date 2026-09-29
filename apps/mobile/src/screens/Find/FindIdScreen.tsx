import { useEffect } from 'react';
import { BackHandler, View } from 'react-native';
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
 * 내용을 "버튼 위 영역"의 가운데에 놓기 위한 추가 아래 여백 (가입·충전·출금 완료 화면과 같은 계산).
 * 하단 버튼 상자는 화면 위에 떠 있어 스크롤 영역이 그 뒤까지 이어지므로, 그냥 가운데 정렬하면 아래로 치우쳐 보인다.
 */
const CENTERING_EXTRA_BOTTOM_PADDING = BOTTOM_BTN_BOX_HEIGHT - BOTTOM_BTN_BOX_KEYBOARD_INSET + 24;

type FindIdScreenProps = NativeStackScreenProps<RootStackParamList, 'FindId'>;

const FindIdScreen: React.FC<FindIdScreenProps> = ({ navigation, route }) => {
  // 이전 화면에서 얻은 회원 ID 및 가입일시 값
  const { mbUid, regDnt } = route.params;

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
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}
        extraBottomPadding={CENTERING_EXTRA_BOTTOM_PADDING}>
        {/* 체크 애니메이션 → 완료 문구 (다른 완료 화면과 같은 구성) */}
        <View style={styles.hero}>
          <SuccessAnimation size={160} style={styles.animation} />

          {/* 결과 메시지 */}
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
          {/* 회원 정보 카드. 본인인증을 거친 뒤라 ID 를 가리지 않고 그대로 보여준다 */}
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

          {/* 데모 전용 안내: 실제 서비스는 이메일로도 결과를 보내지만 데모는 메일을 보내지 않는다 */}
          <Typography mode="caption1" color="gray500" style={{ textAlign: 'center' }}>
            데모 환경은 메일을 보내지 않아 결과를 화면에만 표시합니다.
          </Typography>
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

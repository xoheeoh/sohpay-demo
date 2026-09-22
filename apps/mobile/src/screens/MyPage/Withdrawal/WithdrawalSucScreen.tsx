import React, { useCallback, useEffect } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import { goToLogin } from '@utils/navigationHelpers';
import { removeData, removeEncryptedToken } from '@storages/asyncStorage';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  SuccessAnimation,
  Typography,
} from '@components/common';

type WithdrawalSucScreenProps = NativeStackScreenProps<RootStackParamList, 'WithdrawalSuc'>;

const WithdrawalSucScreen: React.FC<WithdrawalSucScreenProps> = ({ navigation }) => {
  // 저장되어 있던 회원 정보 삭제
  useEffect(() => {
    const fetchData = async () => {
      await removeEncryptedToken(); // 암호화된 토큰 삭제
      await removeData('mbUid');
      await removeData('uid');
      await removeData('idSave');
    };

    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        gestureEnabled: false, // 제스처 뒤로가기 방지
      });

      const backAction = () => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }], // 무조건 'Login' 화면으로 이동
        });
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);

      return () => {
        subscription.remove();
      };
    }, [navigation]),
  );

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.container, { gap: 32 }]}
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        <View style={{ gap: 12 }}>
          <Typography mode="subtitle1" color="gray900">
            회원 탈퇴가 완료되었습니다.
          </Typography>

          <View>
            <Typography mode="body2" color="gray600">
              회원탈퇴 처리가 정상적으로 완료되었습니다.
            </Typography>
            <Typography mode="body2" color="gray600">
              확인 버튼 클릭 시, 로그인 화면으로 이동합니다.
            </Typography>
          </View>
        </View>

        {/* 성공 애니메이션 (웹에서도 보이도록 공용 컴포넌트 사용) */}
        <SuccessAnimation size={140} />
      </KeyboardAwareScrollView>

      <BottomBtnBox buttonKey={'confirm'} disabled={false} label={'확인'} onPress={() => goToLogin(navigation)} />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 24 },
});

export default WithdrawalSucScreen;
export { WithdrawalSucScreen };

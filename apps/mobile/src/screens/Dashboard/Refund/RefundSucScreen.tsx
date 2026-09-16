import React, { useCallback } from 'react';
import { BackHandler, Image, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import type { RootStackParamList } from '@typ/navigation';
import { formatDateTime, getTodayDateTime } from '@utils/formatter';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  Typography,
} from '@components/common';
import { layout, theme } from '@styles';

type RefundSucScreenProps = NativeStackScreenProps<RootStackParamList, 'RefundSuc'>;

const RefundSucScreen: React.FC<RefundSucScreenProps> = ({ navigation, route }) => {
  // 이전 화면에서 얻어온 출금 상세 정보
  const data = route.params.data;

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        gestureEnabled: false, // 제스처 뒤로가기 방지
      });

      const backAction = () => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }], // 무조건 'Dashboard' 화면으로 이동
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
      <KeyboardAwareScrollView keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        {/* 출금 성공 */}
        <View style={[styles.container, { gap: 32, alignItems: 'center' }]}>
          <View style={{ gap: 16, alignItems: 'center' }}>
            <View style={{ gap: 8, alignItems: 'center' }}>
              <Typography mode="subtitle1" color="gray900">
                출금완료
              </Typography>

              <Typography mode="body2" color="gray600">
                요청하신 출금이 정상적으로 완료되었습니다.
              </Typography>
            </View>

            <Typography mode="heading1" color="gray900">
              {Number(data.refundAmt).toLocaleString('ko-KR')} 원
            </Typography>
          </View>

          <Image
            source={require('@images/illust/pay_completed.png')}
            style={{ width: 174, height: 112 }}
            resizeMode="contain"
          />
        </View>

        <View style={styles.divider}></View>

        {/* 출금 정보 */}
        <View style={[styles.container, { gap: 16 }]}>
          <Typography mode="subtitle2" color="gray900">
            출금 정보
          </Typography>

          <View style={{ gap: 12 }}>
            <View style={layout.rowBetween}>
              <Typography mode="body2" color="gray900" style={{ width: 80 }}>
                요청일시
              </Typography>
              <Typography mode="body2" color="gray600">
                {formatDateTime(getTodayDateTime())}
              </Typography>
            </View>

            <View style={layout.rowBetween}>
              <Typography mode="body2" color="gray900" style={{ width: 80 }}>
                출금금액
              </Typography>
              <Typography mode="body2" color="gray600">
                {Number(data.refundAmt).toLocaleString('ko-KR')} 원
              </Typography>
            </View>

            <View style={layout.rowBetween}>
              <Typography mode="body2" color="gray900" style={{ width: 80 }}>
                출금 후 잔액
              </Typography>
              <Typography mode="body2" color="gray600">
                {Number(data.ppRmnAmt).toLocaleString('ko-KR')} 원
              </Typography>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <BottomBtnBox
        buttonKey={'confirm'}
        disabled={false}
        label={'확인'}
        onPress={() => navigation.navigate('Dashboard')}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 24 },
  divider: { backgroundColor: theme.colors.gray100, height: 1, marginHorizontal: 16 },
});

export default RefundSucScreen;
export { RefundSucScreen };

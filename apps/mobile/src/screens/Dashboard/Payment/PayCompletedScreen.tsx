import { useCallback } from 'react';
import { BackHandler, Image, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '@typ/navigation';
import { formatDateTime } from '@utils/formatter';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  Typography,
} from '@components/common';
import { layout, theme } from '@styles';

type PayCompletedScreenProps = NativeStackScreenProps<RootStackParamList, 'PayCompleted'>;

const PayCompletedScreen: React.FC<PayCompletedScreenProps> = ({ navigation, route }) => {
  // 이전 화면에서 얻어온 결제 정보 파라미터
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
        {/* 결제 성공 */}
        <View style={[styles.container, { gap: 32, alignItems: 'center' }]}>
          <View style={{ gap: 8, alignItems: 'center' }}>
            <Typography mode="subtitle1" color="gray900">
              결제완료
            </Typography>

            <Typography mode="body2" color="gray600">
              요청하신 결제가 정상적으로 완료되었습니다.
            </Typography>
          </View>

          <Image
            source={require('@images/illust/pay_completed.png')}
            style={{ width: 174, height: 112, alignSelf: 'center' }}
            resizeMode="contain"
          />
        </View>

        <View style={styles.divider}></View>

        {/* 결제 요약 */}
        <View style={[styles.container, { gap: 12 }]}>
          <View style={{ gap: 8 }}>
            <Typography mode="body1" color="gray600">
              {data.coNm}
            </Typography>
            <Typography mode="body2" color="gray600">
              {data.goodsNm}
            </Typography>
          </View>

          <Typography mode="heading1" color="primary" style={{ alignSelf: 'flex-end' }}>
            {Number(data.goodsAmt).toLocaleString('ko-KR')} 원
          </Typography>
        </View>

        <View style={styles.divider}></View>

        {/* 결제 상세 정보 */}
        <View style={[styles.container, { gap: 16 }]}>
          <Typography mode="subtitle2" color="gray900">
            결제 정보
          </Typography>

          <View style={{ gap: 12 }}>
            <View style={layout.rowBetween}>
              <Typography mode="body2" color="gray900" style={{ width: 80 }}>
                요청일시
              </Typography>
              <Typography mode="body2" color="gray600">
                {formatDateTime(`${data.ediDate}`)}
              </Typography>
            </View>

            <View style={layout.rowBetween}>
              <Typography mode="body2" color="gray900" style={{ width: 80 }}>
                거래번호
              </Typography>
              <Typography mode="body2" color="gray600">
                {data.tid}
              </Typography>
            </View>

            <View style={layout.rowBetween}>
              <Typography mode="body2" color="gray900" style={{ width: 80 }}>
                상품명
              </Typography>
              <Typography mode="body2" color="gray600">
                {data.goodsNm}
              </Typography>
            </View>

            <View style={layout.rowBetween}>
              <Typography mode="body2" color="gray900" style={{ width: 80 }}>
                금액
              </Typography>
              <Typography mode="subtitle3" color="gray600">
                {Number(data.goodsAmt).toLocaleString('ko-KR')} 원
              </Typography>
            </View>

            <View style={layout.rowBetween}>
              <Typography mode="body2" color="gray900" style={{ width: 80 }}>
                거래 후 잔액
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

export default PayCompletedScreen;
export { PayCompletedScreen };

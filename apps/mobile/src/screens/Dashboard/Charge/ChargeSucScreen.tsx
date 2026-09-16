import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import { IRmnAmt } from '@typ/paymentType';
import { formatDateTime, getTodayDateTime } from '@utils/formatter';
import { goBackToDashboard } from '@utils/navigationHelpers';
import { loadUserAmt } from '@apis/commonApi';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  Typography,
} from '@components/common';
import { layout, theme } from '@styles';

type ChargeSucScreenProps = NativeStackScreenProps<RootStackParamList, 'ChargeSuc'>;

const ChargeSucScreen: React.FC<ChargeSucScreenProps> = ({ navigation, route }) => {
  // 이전 화면에서 얻어온 충전금액 파라미터
  const { chargeAmt } = route.params;

  // 현재 잔액 조회
  const [rmnAmtData, setRmnAmtData] = useState<IRmnAmt>();

  useEffect(() => {
    loadUserAmt().then((data) => {
      console.log('회원 잔액 조회 결과:', data);

      if (data.resultCd === '0000') {
        setRmnAmtData(data);
      }
    });
  }, []);

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        {/* 충전 성공 */}
        <View style={[styles.wrap, { gap: 32, alignItems: 'center' }]}>
          <View style={{ gap: 8, alignItems: 'center' }}>
            <Typography mode="subtitle1" color="gray900">
              충전완료
            </Typography>

            <Typography mode="body2" color="gray600" style={{ textAlign: 'center' }}>
              요청하신 충전이 정상적으로 완료되었습니다.
            </Typography>

            <Typography mode="heading1" color="gray900" style={{ marginTop: 8 }}>
              {Number(chargeAmt).toLocaleString('ko-KR')} 원
            </Typography>
          </View>

          <Image
            source={require('@images/illust/pay_completed.png')}
            style={{ width: 174, height: 112, alignSelf: 'center' }}
            resizeMode="contain"
          />
        </View>

        <View style={styles.divider} />

        {/* 충전 상세 정보 */}
        <View style={[styles.wrap, { gap: 16 }]}>
          <Typography mode="subtitle2" color="gray900">
            충전 정보
          </Typography>

          <View style={{ gap: 12 }}>
            <View style={layout.rowBetween}>
              <Typography mode="body2" color="gray900">
                요청일시
              </Typography>
              <Typography mode="body2" color="gray600">
                {formatDateTime(getTodayDateTime())}
              </Typography>
            </View>

            <View style={layout.rowBetween}>
              <Typography mode="body2" color="gray900" style={{ width: 80 }}>
                충전금액
              </Typography>
              <Typography mode="subtitle3" color="gray600">
                {Number(chargeAmt).toLocaleString('ko-KR')} 원
              </Typography>
            </View>

            <View style={layout.rowBetween}>
              <Typography mode="body2" color="gray900" style={{ width: 80 }}>
                충전 후 잔액
              </Typography>
              <Typography mode="subtitle3" color="gray600">
                {Number(rmnAmtData?.sumPpRmnAmt).toLocaleString('ko-KR')} 원
              </Typography>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <BottomBtnBox
        buttonKey={'confirm'}
        disabled={false}
        label={'확인'}
        onPress={() => goBackToDashboard(navigation)}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingVertical: 24, paddingHorizontal: 16 },
  divider: { backgroundColor: theme.colors.gray100, height: 1, marginHorizontal: 16 },
});

export default ChargeSucScreen;
export { ChargeSucScreen };

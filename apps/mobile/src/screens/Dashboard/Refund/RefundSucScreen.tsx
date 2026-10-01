import React, { useCallback } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import type { RootStackParamList } from '@typ/navigation';
import { getBankName } from '@dt/bankCd';
import { formatDateTime, formatWon, getTodayDateTime, maskAccountNumber } from '@utils/formatter';
import { GlassReceiptCard, GlassReceiptRow } from '@components/dashboard';
import {
  BottomBtnBox,
  useBottomBtnBoxHeight,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  SuccessAnimation,
  Typography,
} from '@components/common';

type RefundSucScreenProps = NativeStackScreenProps<RootStackParamList, 'RefundSuc'>;

/**
 * 하단 버튼 상자가 떠 있어 스크롤 영역이 그 뒤까지 이어지므로,
 * 내용이 "버튼 위 영역"의 가운데에 오도록 아래 여백을 더한다.
 */
const CENTERING_LIFT = 24;

const RefundSucScreen: React.FC<RefundSucScreenProps> = ({ navigation, route }) => {
  const centeringExtraBottomPadding = useBottomBtnBoxHeight() - BOTTOM_BTN_BOX_KEYBOARD_INSET + CENTERING_LIFT;
  const { data, acnt } = route.params;

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

      // 웹에는 BackHandler 가 없어(콘솔 오류) 앱에서만 등록한다
      if (Platform.OS === 'web') return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);

      return () => {
        subscription.remove();
      };
    }, [navigation]),
  );

  // 결과 카드 항목. 계좌 정보가 넘어온 경우에만 출금 계좌 줄을 넣는다
  const rows: GlassReceiptRow[] = [
    ...(acnt?.rfndAcntNo && acnt.rfndBankCd
      ? [{ label: '출금 계좌', value: `${getBankName(acnt.rfndBankCd)} ${maskAccountNumber(acnt.rfndAcntNo)}` }]
      : []),
    { label: '출금 후 잔액', value: formatWon(data.ppRmnAmt) },
    { label: '요청일시', value: formatDateTime(getTodayDateTime()) },
  ];

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}
        extraBottomPadding={centeringExtraBottomPadding}>
        <View style={styles.hero}>
          <SuccessAnimation size={160} style={styles.animation} />

          <View style={{ alignItems: 'center', gap: 6 }}>
            <Typography mode="heading3" color="gray900">
              출금이 완료되었어요
            </Typography>
            <Typography mode="body2" color="gray600" style={{ textAlign: 'center' }}>
              요청하신 금액이 등록된 계좌로 출금되었습니다.
            </Typography>
          </View>
        </View>

        <GlassReceiptCard badgeLabel="출금 완료" amountLabel="출금 금액" amount={data.refundAmt} rows={rows} />
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
  // 아래 여백은 KeyboardAwareScrollView 가 덮어쓰므로 extraBottomPadding 으로 보정한다
  container: { paddingHorizontal: 16, paddingVertical: 24, gap: 50, flexGrow: 1, justifyContent: 'center' },

  hero: { gap: 12, alignItems: 'center' },
  // Lottie 상자 안의 투명 여백(위 28px·아래 35px)을 음수 여백으로 상쇄한다
  animation: { marginTop: -28, marginBottom: -32 },
});

export default RefundSucScreen;
export { RefundSucScreen };

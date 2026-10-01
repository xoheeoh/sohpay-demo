import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import { formatDateTime, formatWon, getTodayDateTime } from '@utils/formatter';
import { goBackToDashboard } from '@utils/navigationHelpers';
import { loadUserAmt } from '@apis/commonApi';
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

type ChargeSucScreenProps = NativeStackScreenProps<RootStackParamList, 'ChargeSuc'>;

/**
 * 하단 버튼 상자가 떠 있어 스크롤 영역이 그 뒤까지 이어지므로,
 * 내용이 "버튼 위 영역"의 가운데에 오도록 아래 여백을 더한다.
 */
const CENTERING_LIFT = 24;

const ChargeSucScreen: React.FC<ChargeSucScreenProps> = ({ navigation, route }) => {
  const centeringExtraBottomPadding = useBottomBtnBoxHeight() - BOTTOM_BTN_BOX_KEYBOARD_INSET + CENTERING_LIFT;
  const { chargeAmt } = route.params;

  // 뒤로 가면 PIN 입력으로 돌아가 다시 충전할 수 있으므로 뒤로가기를 막는다
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

  // 충전 후 잔액. null 이면 조회 전으로 카드에 자리표시자를 보여준다
  const [balanceAfter, setBalanceAfter] = useState<number | null>(null);

  useEffect(() => {
    loadUserAmt().then((data) => {
      console.log('회원 잔액 조회 결과:', data);

      if (data.resultCd === '0000') {
        setBalanceAfter(Number(data.sumPpRmnAmt));
      }
    });
  }, []);

  // 결과 카드 항목
  const rows: GlassReceiptRow[] = [
    { label: '충전 수단', value: '계좌이체' },
    { label: '충전 후 잔액', value: balanceAfter === null ? null : formatWon(balanceAfter) },
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
              충전이 완료되었어요
            </Typography>
            <Typography mode="body2" color="gray600" style={{ textAlign: 'center' }}>
              요청하신 금액이 내 머니에 충전되었습니다.
            </Typography>
          </View>
        </View>

        <GlassReceiptCard badgeLabel="충전 완료" amountLabel="충전 금액" amount={chargeAmt} rows={rows} />
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
  // 아래 여백은 KeyboardAwareScrollView 가 덮어쓰므로 extraBottomPadding 으로 보정한다
  container: { paddingHorizontal: 16, paddingVertical: 24, gap: 50, flexGrow: 1, justifyContent: 'center' },

  hero: { gap: 12, alignItems: 'center' },
  // Lottie 상자 안의 투명 여백(위 28px·아래 35px)을 음수 여백으로 상쇄한다
  animation: { marginTop: -28, marginBottom: -32 },
});

export default ChargeSucScreen;
export { ChargeSucScreen };

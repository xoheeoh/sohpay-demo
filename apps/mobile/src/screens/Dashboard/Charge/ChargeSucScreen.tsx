import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import { formatDateTime, getTodayDateTime } from '@utils/formatter';
import { goBackToDashboard } from '@utils/navigationHelpers';
import { loadUserAmt } from '@apis/commonApi';
import { GlassReceiptCard, GlassReceiptRow } from '@components/dashboard';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_HEIGHT,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  SuccessAnimation,
  Typography,
} from '@components/common';

type ChargeSucScreenProps = NativeStackScreenProps<RootStackParamList, 'ChargeSuc'>;

/**
 * 내용을 "버튼 위 영역"의 가운데에 놓기 위한 추가 아래 여백 (출금 완료·회원가입 완료 화면과 같은 계산).
 * 하단 버튼 상자는 화면 위에 떠 있어 스크롤 영역이 그 뒤까지 이어지므로, 그냥 가운데 정렬하면 아래로 치우쳐 보인다.
 */
const CENTERING_EXTRA_BOTTOM_PADDING = BOTTOM_BTN_BOX_HEIGHT - BOTTOM_BTN_BOX_KEYBOARD_INSET + 24;

/** 금액 숫자를 '145,500' 처럼 천 단위 콤마 문자열로 */
const formatAmount = (value: string | number) => Number(value).toLocaleString('ko-KR');

const ChargeSucScreen: React.FC<ChargeSucScreenProps> = ({ navigation, route }) => {
  // 이전 화면에서 얻어온 충전금액 파라미터
  const { chargeAmt } = route.params;

  // 완료 화면에서 뒤로 가면 PIN 입력으로 돌아가 다시 충전할 수 있으므로 막는다 (결제·출금 완료 화면과 같은 처리)
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

  // 충전 후 잔액 조회 (null: 아직 조회 전 → 카드에는 자리표시자가 보인다)
  const [balanceAfter, setBalanceAfter] = useState<number | null>(null);

  useEffect(() => {
    loadUserAmt().then((data) => {
      console.log('회원 잔액 조회 결과:', data);

      if (data.resultCd === '0000') {
        setBalanceAfter(Number(data.sumPpRmnAmt));
      }
    });
  }, []);

  // 결과 카드에 한 줄씩 놓을 항목 (출금 완료 화면과 같은 구성)
  const rows: GlassReceiptRow[] = [
    { label: '충전 수단', value: '계좌이체' },
    { label: '충전 후 잔액', value: balanceAfter === null ? null : `${formatAmount(balanceAfter)} 원` },
    { label: '요청일시', value: formatDateTime(getTodayDateTime()) },
  ];

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}
        extraBottomPadding={CENTERING_EXTRA_BOTTOM_PADDING}>
        {/* 체크 애니메이션 → 완료 문구. 출금 완료·회원가입 완료와 같은 애니메이션으로 톤을 맞춘다 */}
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
  // 세로 가운데 정렬. 아래 여백은 KeyboardAwareScrollView 가 덮어쓰므로 extraBottomPadding 으로 보정한다.
  container: { paddingHorizontal: 16, paddingVertical: 24, gap: 50, flexGrow: 1, justifyContent: 'center' },

  hero: { gap: 12, alignItems: 'center' },
  // Lottie 그림은 상자 안에 위 28px, 아래 35px 투명 여백을 두고 그려지므로 음수 여백으로 상쇄해 보이는 그림 기준으로 정렬한다
  animation: { marginTop: -28, marginBottom: -32 },
});

export default ChargeSucScreen;
export { ChargeSucScreen };

import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Icon } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { IRefundAcnt } from '@typ/paymentType';
import { getBankImage, getBankName } from '@dt/bankCd';
import { loadUserAmt } from '@apis/commonApi';
import { loadRefundAcnt } from '@apis/paymentApi';
import { AmountSummaryCard } from '@components/dashboard';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  Skeleton,
  Typography,
} from '@components/common';
import { layout, theme } from '@styles';

type RefundAcntScreenProps = NativeStackScreenProps<RootStackParamList, 'RefundAcnt'>;

const RefundAcntScreen: React.FC<RefundAcntScreenProps> = ({ navigation, route }) => {
  // 이전 화면에서 얻은 출금할 금액
  const withdrawalAmt = route.params.amt;

  // 등록된 내 계좌 조회
  const [acntData, setAcntData] = useState<IRefundAcnt | null>(null);
  // 첫 조회가 끝났는지. 끝나기 전에는 "계좌 없음" 대신 스켈레톤을 보여준다 (조회 전 1초쯤 "계좌 없음"이 깜빡이던 문제 방지)
  // 계좌 변경 뒤 돌아와 다시 조회할 때는 이전 결과를 그대로 두고 갱신만 하므로 스켈레톤이 다시 뜨지 않는다
  const [isAcntLoaded, setIsAcntLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadRefundAcnt()
        .then((data) => {
          console.log('등록된 내 계좌 조회 결과:', data);

          if (data.resultCd === '0000') {
            setAcntData(data);
          }
        })
        .finally(() => setIsAcntLoaded(true));
    }, []),
  );

  // 현재 잔액 조회
  const [usrAmt, setUsrAmt] = useState<number | null>(null); // null: 아직 조회 전

  useEffect(() => {
    loadUserAmt().then((data) => {
      console.log('회원 잔액 조회 결과:', data);

      if (data.resultCd === '0000') {
        setUsrAmt(Number(data.ppCanRfndRmnAmt));
      }
    });
  }, []);

  // 잔액 출금 계좌 등록 여부 및 버튼 활성화 여부
  const hasRefundAccount = !!(acntData?.rfndAcntNo && acntData?.rfndBankCd);
  const isButtonDisabled = !hasRefundAccount;

  return (
    <ScreenWrapper backgroundColor={theme.colors.bg} keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.wrap}
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        {/* 출금 금액 카드: 예정 금액과 출금 후 잔액을 한 카드에 (충전 확인 화면과 같은 공용 카드) */}
        <AmountSummaryCard
          label="출금 예정 금액"
          amount={withdrawalAmt}
          icon="bank-transfer-out"
          subLabel="출금 후 잔액"
          subAmount={usrAmt === null ? null : usrAmt - withdrawalAmt}
        />

        {/* 출금 계좌 카드 */}
        <View style={styles.card}>
          <View style={layout.rowBetween}>
            <Typography mode="subtitle2" color="gray900">
              출금 계좌
            </Typography>

            {/* 계좌가 있으면 변경, 없으면 등록. 자리와 모양은 같게 두어 두 상태가 한 카드로 보이게 한다 */}
            {isAcntLoaded && (
              <Pressable
                accessibilityRole="button"
                hitSlop={4}
                style={({ pressed }) => [layout.rowCenter, { gap: 2 }, pressed && { opacity: 0.5 }]}
                onPress={() => navigation.navigate('RefundAuth', { flg: hasRefundAccount ? 'edit' : 'first' })}>
                <Typography mode="subtitle3" color="blue500">
                  {hasRefundAccount ? '변경하기' : '등록하기'}
                </Typography>
                <Icon source="chevron-right" size={18} color={theme.colors.blue500} />
              </Pressable>
            )}
          </View>

          {!isAcntLoaded ? (
            /* 조회 중: 은행 로고·은행명·계좌번호 자리를 같은 크기의 회색 막대로 채운다 */
            <View style={[layout.rowCenter, styles.bankRow]}>
              <Skeleton width={44} height={44} radius={22} />
              <View style={{ gap: 8, flex: 1 }}>
                <Skeleton width={72} height={14} />
                <Skeleton width={140} height={16} />
              </View>
            </View>
          ) : hasRefundAccount ? (
            <>
              <View style={[layout.rowCenter, styles.bankRow]}>
                <Image source={getBankImage(acntData.rfndBankCd)} style={styles.bankLogo} />

                <View style={{ gap: 2, flexShrink: 1 }}>
                  <Typography mode="subtitle2" color="gray900">
                    {getBankName(acntData.rfndBankCd)}
                  </Typography>
                  <Typography mode="body1" color="gray600" style={{ letterSpacing: 0.5 }}>
                    {acntData.rfndAcntNo}
                  </Typography>
                </View>
              </View>

              <Typography mode="caption1" color="gray400">
                위 계좌로 출금됩니다. 계좌 정보가 다르면 변경 후 진행해 주세요.
              </Typography>
            </>
          ) : (
            /* 계좌 없음: 계좌가 있을 때와 같은 줄 구성(아이콘 동그라미 + 두 줄 글). 줄 전체를 누르면 등록으로 간다 (계좌관리 화면과 같은 모양) */
            <>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [layout.rowCenter, styles.bankRow, pressed && { opacity: 0.6 }]}
                onPress={() => navigation.navigate('RefundAuth', { flg: 'first' })}>
                <View style={styles.emptyIcon}>
                  <Icon source="bank-plus" size={22} color={theme.colors.gray500} />
                </View>

                <View style={{ gap: 2, flexShrink: 1 }}>
                  <Typography mode="subtitle2" color="gray900">
                    등록된 계좌가 없어요
                  </Typography>
                  <Typography mode="body2" color="gray600">
                    출금할 계좌를 먼저 등록해 주세요.
                  </Typography>
                </View>
              </Pressable>

              <Typography mode="caption1" color="gray400">
                계좌 등록에는 본인 명의 계좌의 1원 인증이 필요합니다.
              </Typography>
            </>
          )}
        </View>
      </KeyboardAwareScrollView>

      <BottomBtnBox
        backgroundColor={theme.colors.bg}
        buttonKey={hasRefundAccount.toString()}
        disabled={isButtonDisabled}
        label={'잔액 출금'}
        onPress={() => acntData && navigation.navigate('PinPayRefund', { acnt: acntData, amt: withdrawalAmt })}
      />
    </ScreenWrapper>
  );
};

// 회원정보(UsrInfoScreen)·계좌관리 화면과 같은 카드 모양
const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 24, gap: 16 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
    padding: 20,
    gap: 16,
  },
  // 계좌 없음 줄의 아이콘 자리: 은행 로고와 같은 크기의 회색 동그라미
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankRow: {
    gap: 14,
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  bankLogo: { width: 44, height: 44, borderRadius: 22 },
});

export default RefundAcntScreen;
export { RefundAcntScreen };

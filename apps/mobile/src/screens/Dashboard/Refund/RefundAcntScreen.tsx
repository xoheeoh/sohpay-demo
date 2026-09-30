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
  const withdrawalAmt = route.params.amt;

  // 등록된 내 계좌 조회
  const [acntData, setAcntData] = useState<IRefundAcnt | null>(null);
  // 첫 조회가 끝나기 전에는 "계좌 없음" 대신 스켈레톤을 보여준다. 이후 재조회는 이전 결과를 유지한 채 갱신만 한다
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

  const hasRefundAccount = !!(acntData?.rfndAcntNo && acntData?.rfndBankCd);
  const isButtonDisabled = !hasRefundAccount;

  return (
    <ScreenWrapper backgroundColor={theme.colors.bg} keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.wrap}
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        {/* 출금 금액 카드 */}
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

            {/* 계좌가 있으면 변경, 없으면 등록. 두 상태가 같은 자리에 오도록 한다 */}
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
            /* 조회 중: 계좌 줄과 같은 크기의 스켈레톤 */
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
            /* 계좌 없음: 등록 진입은 위의 "등록하기" 링크 한 곳으로 모은다 */
            <>
              <View style={[layout.rowCenter, styles.bankRow]}>
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
              </View>

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
        label={'출금하기'}
        onPress={() => acntData && navigation.navigate('PinPayRefund', { acnt: acntData, amt: withdrawalAmt })}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: theme.screen.topCard, gap: 16 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
    padding: 20,
    gap: 16,
  },
  // 은행 로고와 같은 크기의 자리표시 아이콘
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

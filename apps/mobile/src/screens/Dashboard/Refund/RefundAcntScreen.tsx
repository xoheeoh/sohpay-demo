import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import type { RootStackParamList } from '@typ/navigation';
import { IRefundAcnt } from '@typ/paymentType';
import { getBankImage, getBankName } from '@dt/bankCd';
import { loadUserAmt } from '@apis/commonApi';
import { loadRefundAcnt } from '@apis/paymentApi';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  SecondaryButton,
  Typography,
} from '@components/common';
import { layout, theme } from '@styles';

type RefundAcntScreenProps = NativeStackScreenProps<RootStackParamList, 'RefundAcnt'>;

const RefundAcntScreen: React.FC<RefundAcntScreenProps> = ({ navigation, route }) => {
  // 이전 화면에서 얻은 출금할 금액
  const withdrawalAmt = route.params.amt;

  // 등록된 내 계좌 조회
  const [acntData, setAcntData] = useState<IRefundAcnt | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadRefundAcnt().then((data) => {
        console.log('등록된 내 계좌 조회 결과:', data);

        if (data.resultCd === '0000') {
          setAcntData(data);
        }
      });
    }, []),
  );

  // 현재 잔액 조회
  const [usrAmt, setUsrAmt] = useState<number>(0);

  useEffect(() => {
    loadUserAmt().then((data) => {
      console.log('회원 잔액 조회 결과:', data);

      if (data.resultCd === '0000') {
        setUsrAmt(data.ppCanRfndRmnAmt);
      }
    });
  }, []);

  // 잔액 출금 계좌 등록 여부 및 버튼 활성화 여부
  const hasRefundAccount = !!(acntData?.rfndAcntNo && acntData?.rfndBankCd);
  const isButtonDisabled = !hasRefundAccount;

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        <View style={[styles.container, { gap: 12 }]}>
          <View style={styles.badge}>
            <Typography mode="body2" color="white">
              출금 예정 금액
            </Typography>
          </View>

          <Typography mode="heading1" color="gray900">
            {withdrawalAmt.toLocaleString('ko-KR')} 원
          </Typography>
        </View>

        <View style={styles.divider}></View>

        <View style={[styles.container, { gap: 24 }]}>
          <Typography mode="heading3" color="gray900">
            출금을 위한 계좌 정보를 확인해주세요.
          </Typography>

          {hasRefundAccount ? (
            <View style={{ gap: 12 }}>
              <View style={[layout.rowCenter, styles.bankInfoBox]}>
                <Image source={getBankImage(acntData.rfndBankCd)} style={{ width: 36, height: 36 }} />

                <View style={{ gap: 4 }}>
                  <Typography mode="subtitle2" color="gray900">
                    {getBankName(acntData.rfndBankCd)}
                  </Typography>

                  <Typography mode="subtitle2" color="gray600" style={{ letterSpacing: 0.5 }}>
                    {acntData.rfndAcntNo}
                  </Typography>
                </View>
              </View>

              <SecondaryButton
                style={{ width: '100%' }}
                label={'계좌 변경하기'}
                onPress={() => navigation.navigate('RefundAuth', { flg: 'edit' })}
                size={'xlarge'}
              />
            </View>
          ) : (
            <View style={styles.nonAcntBox}>
              <Typography mode="heading1">👋</Typography>

              <Typography mode="body2" color="gray900" style={{ textAlign: 'center' }}>
                등록된 계좌가 없습니다.{'\n'}계좌를 등록해주세요.
              </Typography>

              <SecondaryButton
                style={{ width: '100%' }}
                label={'계좌 등록하기'}
                onPress={() => navigation.navigate('RefundAuth', { flg: 'first' })}
                size={'xlarge'}
              />
            </View>
          )}
        </View>

        <View style={styles.divider}></View>

        {/* 잔액 출금 상세 내역 */}
        <View style={[styles.container, { gap: 24 }]}>
          <Typography mode="heading3" color="gray900">
            출금 상세 내역
          </Typography>

          <View style={{ gap: 12 }}>
            <View style={layout.rowBetween}>
              <Typography mode="body2" color="gray900">
                출금 예정 금액
              </Typography>

              <Typography mode="subtitle2" color="gray900">
                {withdrawalAmt.toLocaleString('ko-KR')} 원
              </Typography>
            </View>

            <View style={layout.rowBetween}>
              <Typography mode="body2" color="gray900">
                └ 출금 후 잔액
              </Typography>

              <Typography mode="body2" color="gray600">
                {(usrAmt - withdrawalAmt).toLocaleString('ko-KR')} 원
              </Typography>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <BottomBtnBox
        buttonKey={hasRefundAccount.toString()}
        disabled={isButtonDisabled}
        label={'잔액 출금'}
        onPress={() => acntData && navigation.navigate('PinPayRefund', { acnt: acntData, amt: withdrawalAmt })}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 24 },
  divider: { backgroundColor: theme.colors.gray100, height: 1, marginHorizontal: 16 },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: theme.colors.gray900,
    borderRadius: 32,
    alignSelf: 'baseline',
  },
  nonAcntBox: {
    gap: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.gray50,
    borderWidth: 2,
    borderColor: theme.colors.gray300,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  bankInfoBox: {
    gap: 12,
    borderRadius: 8,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(45, 181, 237, 0.15)',
  },
});

export default RefundAcntScreen;
export { RefundAcntScreen };

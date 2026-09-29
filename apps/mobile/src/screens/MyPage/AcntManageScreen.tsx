import React, { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { IRefundAcnt } from '@typ/paymentType';
import { loadRefundAcnt } from '@apis/paymentApi';
import { getBankImage, getBankName } from '@dt/bankCd';
import { maskAccountNumber } from '@utils/formatter';
import { ScreenWrapper, Skeleton, Typography } from '@components/common';
import { layout, theme } from '@styles';

type AcntManageScreenProps = NativeStackScreenProps<RootStackParamList, 'AcntManage'>;

const AcntManageScreen: React.FC<AcntManageScreenProps> = ({ navigation }) => {
  // 등록된 환불계좌 조회하기
  const [acntData, setAcntData] = useState<IRefundAcnt | null>(null);
  // 첫 조회가 끝났는지. 끝나기 전에는 "계좌 없음" 대신 자리표시자를 보여준다 (깜빡임 방지)
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoadData = () => {
    loadRefundAcnt()
      .then((data) => {
        console.log('등록된 환불계좌 조회 결과:', data);

        if (data.resultCd === '0000') {
          setAcntData(data);
        }
      })
      .finally(() => setIsLoaded(true));
  };

  // 환불계좌 수정 완료 후 다시 돌아왔을 때를 생각해 focus 재조회
  useFocusEffect(
    useCallback(() => {
      handleLoadData();
    }, []),
  );

  const hasAccount = !!(acntData?.rfndAcntNo && acntData?.rfndBankCd);

  return (
    <ScreenWrapper backgroundColor={theme.colors.bg} topComponent={false}>
      <View style={styles.wrap}>
        {/* 출금 계좌 카드 (출금 계좌 확인 화면과 같은 모양) */}
        <View style={styles.card}>
          <View style={layout.rowBetween}>
            <Typography mode="subtitle2" color="gray900">
              출금 계좌
            </Typography>

            {/* 계좌가 있으면 변경, 없으면 등록. 자리와 모양은 같게 두어 두 상태가 한 카드로 보이게 한다 */}
            {isLoaded && (
              <Pressable
                accessibilityRole="button"
                hitSlop={4}
                style={({ pressed }) => [layout.rowCenter, { gap: 2 }, pressed && { opacity: 0.5 }]}
                onPress={() => navigation.navigate('RefundAuth', { flg: hasAccount ? 'edit' : 'first' })}>
                <Typography mode="subtitle3" color="blue500">
                  {hasAccount ? '변경하기' : '등록하기'}
                </Typography>
                <Icon source="chevron-right" size={18} color={theme.colors.blue500} />
              </Pressable>
            )}
          </View>

          {!isLoaded ? (
            /* 조회 중: 은행 로고·은행명·계좌번호 자리를 같은 크기의 회색 막대로 채운다 */
            <View style={[layout.rowCenter, styles.bankRow]}>
              <Skeleton width={44} height={44} radius={22} />
              <View style={{ gap: 8, flex: 1 }}>
                <Skeleton width={72} height={14} />
                <Skeleton width={140} height={16} />
              </View>
            </View>
          ) : hasAccount && acntData ? (
            <>
              <View style={[layout.rowCenter, styles.bankRow]}>
                <Image source={getBankImage(acntData.rfndBankCd)} style={styles.bankLogo} />

                <View style={{ gap: 2, flexShrink: 1 }}>
                  <Typography mode="subtitle2" color="gray900">
                    {getBankName(acntData.rfndBankCd)}
                  </Typography>
                  <Typography mode="body1" color="gray600" style={{ letterSpacing: 0.5 }}>
                    {maskAccountNumber(acntData.rfndAcntNo)}
                  </Typography>
                </View>
              </View>

              <Typography mode="caption1" color="gray400">
                출금과 계좌이체 충전에 쓰는 계좌입니다. 다른 계좌로 바꾸려면 1원 인증을 다시 진행합니다.
              </Typography>
            </>
          ) : (
            /* 계좌 없음: 계좌가 있을 때와 같은 줄 구성(아이콘 동그라미 + 두 줄 글). 등록은 위의 "등록하기 >" 링크 한 곳에서만 */
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
                    출금과 계좌이체 충전에 쓸 계좌를 등록해 주세요.
                  </Typography>
                </View>
              </View>

              <Typography mode="caption1" color="gray400">
                계좌 등록에는 본인 명의 계좌의 1원 인증이 필요합니다.
              </Typography>
            </>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
};

// 출금 계좌 확인(RefundAcntScreen)·회원정보 화면과 같은 카드 모양
const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 24, gap: 16 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
    padding: 20,
    gap: 16,
  },
  bankRow: {
    gap: 14,
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  bankLogo: { width: 44, height: 44, borderRadius: 22 },
  // 계좌 없음 줄의 아이콘 자리: 은행 로고와 같은 크기의 회색 동그라미
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AcntManageScreen;
export { AcntManageScreen };

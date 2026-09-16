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
import { ScreenWrapper, SecondaryButton, Typography } from '@components/common';
import { layout, theme } from '@styles';

type AcntManageScreenProps = NativeStackScreenProps<RootStackParamList, 'AcntManage'>;

const AcntManageScreen: React.FC<AcntManageScreenProps> = ({ navigation }) => {
  // 등록된 환불계좌 조회하기
  const [acntData, setAcntData] = useState<IRefundAcnt | null>(null);

  const handleLoadData = () => {
    loadRefundAcnt().then((data) => {
      console.log('등록된 환불계좌 조회 결과:', data);

      if (data.resultCd === '0000') {
        setAcntData(data);
      }
    });
  };

  // 환불계좌 수정 완료 후 다시 돌아왔을 때를 생각해 focus 재조회
  useFocusEffect(
    useCallback(() => {
      handleLoadData();
    }, []),
  );

  return (
    <ScreenWrapper backgroundColor={theme.colors.bg} topComponent={false}>
      <View style={styles.wrap}>
        {acntData?.rfndAcntNo === null ? (
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
        ) : acntData && acntData.rfndAcntNo !== null ? (
          <View style={styles.container}>
            {/* 계좌 정보 */}
            <View style={[layout.rowBetween, { gap: 12 }]}>
              <Image source={getBankImage(acntData.rfndBankCd)} style={{ width: 48, height: 48 }} />

              <View style={{ gap: 4 }}>
                <Typography mode="subtitle2" color="gray900">
                  {getBankName(acntData.rfndBankCd)}
                </Typography>

                <Typography mode="subtitle2" color="gray600" style={{ letterSpacing: 0.5 }}>
                  {maskAccountNumber(acntData.rfndAcntNo)}
                </Typography>
              </View>
            </View>

            {/* 변경하기 버튼 */}
            <Pressable
              style={[layout.rowCenter, { gap: 4, alignSelf: 'flex-start' }]}
              onPress={() => navigation.navigate('RefundAuth', { flg: 'edit' })}>
              <Typography mode="subtitle3" color="blue500">
                변경하기
              </Typography>
              {/* 화살표 아이콘 */}
              <Icon source={'chevron-right'} size={24} color={theme.colors.blue500} />
            </Pressable>
          </View>
        ) : null}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingVertical: 24, paddingHorizontal: 16, flex: 1 },
  nonAcntBox: {
    gap: 12,
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: theme.colors.gray300,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  container: {
    backgroundColor: 'white',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
});

export default AcntManageScreen;
export { AcntManageScreen };

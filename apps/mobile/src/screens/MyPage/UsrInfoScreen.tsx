import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import type { RootStackParamList } from '@typ/navigation';
import { IRmnAmt, IRefundAcnt } from '@typ/paymentType';
import { getBankName } from '@dt/bankCd';
import { formatYYYYMMDDDate, maskAccountNumber } from '@utils/formatter';
import { loadUserAmt } from '@apis/commonApi';
import { loadRefundAcnt } from '@apis/paymentApi';
import { ScreenWrapper, SecondaryButton, Typography } from '@components/common';
import { layout, theme } from '@styles';

type UsrInfoScreenProps = NativeStackScreenProps<RootStackParamList, 'UsrInfo'>;

const UsrInfoScreen: React.FC<UsrInfoScreenProps> = ({ navigation, route }) => {
  // 이전 화면에서 얻어온 사용자 프로필 정보
  const usrData = route.params.usrData;

  // 회원 잔액 조회
  const [rmnAmtData, setRmnAmtData] = useState<IRmnAmt>();

  useEffect(() => {
    const fetchData = async () => {
      loadUserAmt().then((data) => {
        console.log('회원 잔액 조회 결과:', data);

        if (data.resultCd === '0000') {
          setRmnAmtData(data);
        }
      });
    };

    fetchData();
  }, []);

  // 등록된 내 계좌 조회
  const [rfndAcnt, setRfndAcnt] = useState<IRefundAcnt>();

  useFocusEffect(
    useCallback(() => {
      loadRefundAcnt().then((data) => {
        console.log('등록된 내 계좌 조회 결과:', data);

        if (data.resultCd === '0000') {
          setRfndAcnt(data);
        }
      });
    }, []),
  );

  return (
    <ScreenWrapper backgroundColor="white">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* 보유 잔액 */}
        <View style={[styles.container, { gap: 12 }]}>
          <Typography mode="body2" color="gray600">
            보유잔액
          </Typography>

          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Typography mode="heading1" color="primary">
              {Number(rmnAmtData?.sumPpRmnAmt).toLocaleString('ko-KR')} 원
            </Typography>
            <Typography mode="caption1" color="gray400">
              출금 가능 금액: {Number(rmnAmtData?.ppCanRfndRmnAmt).toLocaleString('ko-KR')} 원
            </Typography>
          </View>

          <SecondaryButton
            style={{ alignSelf: 'flex-end' }}
            label={'잔액환급'}
            onPress={() => navigation.navigate('Refund')}
            size={'lg'}
          />
        </View>

        <View style={styles.divider}></View>

        {/* 회원 정보 */}
        <View style={[styles.container, { gap: 16 }]}>
          <Typography mode="subtitle2" color="gray900">
            회원정보
          </Typography>

          <View style={{ gap: 12 }}>
            <View style={layout.rowCenter}>
              <Typography mode="body2" color="gray900" style={{ width: 80 }}>
                이름
              </Typography>
              <Typography mode="body2" color="gray600">
                {usrData?.usrNm}
              </Typography>
            </View>

            <View style={layout.rowCenter}>
              <Typography mode="body2" color="gray900" style={{ width: 80 }}>
                ID
              </Typography>
              <Typography mode="body2" color="gray600">
                {usrData?.mbUid}
              </Typography>
            </View>

            <View style={layout.rowCenter}>
              <Typography mode="body2" color="gray900" style={{ width: 80 }}>
                이메일
              </Typography>
              <Typography mode="body2" color="gray600">
                {usrData?.email}
              </Typography>
            </View>

            <View style={layout.rowCenter}>
              <Typography mode="body2" color="gray900" style={{ width: 80 }}>
                등록계좌
              </Typography>
              <Typography mode="body2" color="gray600">
                {rfndAcnt && rfndAcnt.rfndAcntNo !== null
                  ? `${getBankName(rfndAcnt.rfndBankCd)} (${maskAccountNumber(rfndAcnt.rfndAcntNo)})`
                  : '-'}
              </Typography>
            </View>

            <View style={layout.rowCenter}>
              <Typography mode="body2" color="gray900" style={{ width: 80 }}>
                가입일자
              </Typography>
              <Typography mode="body2" color="gray600">
                {formatYYYYMMDDDate(usrData?.joinDnt ?? '')}
              </Typography>
            </View>
          </View>
        </View>

        {/* 회원 탈퇴 */}
        <View style={{ paddingHorizontal: 16, marginTop: 48 }}>
          <SecondaryButton label={'회원탈퇴'} onPress={() => navigation.navigate('Withdrawal')} size={'lg'} />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 24 },
  divider: { backgroundColor: theme.colors.gray100, height: 1, marginHorizontal: 16 },
});

export default UsrInfoScreen;
export { UsrInfoScreen };

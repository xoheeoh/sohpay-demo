import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Icon } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { IRmnAmt, IRefundAcnt } from '@typ/paymentType';
import { getBankName } from '@dt/bankCd';
import { formatYYYYMMDDDate, maskAccountNumber } from '@utils/formatter';
import { loadUserAmt } from '@apis/commonApi';
import { loadRefundAcnt } from '@apis/paymentApi';
import { ScreenWrapper, SecondaryButton, TextButton, Typography } from '@components/common';
import { layout, theme } from '@styles';

type UsrInfoScreenProps = NativeStackScreenProps<RootStackParamList, 'UsrInfo'>;

/** 금액 숫자를 '145,500' 처럼 천 단위 콤마 문자열로. 값이 아직 없으면 0 으로 표시 */
const formatAmount = (value: string | undefined) => Number(value ?? 0).toLocaleString('ko-KR');

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

  const hasAccount = !!rfndAcnt && rfndAcnt.rfndAcntNo !== null;

  return (
    <ScreenWrapper backgroundColor={theme.colors.bg} topComponent={false}>
      <ScrollView contentContainerStyle={styles.wrap}>
        {/* 보유 잔액 카드 */}
        <View style={styles.card}>
          <View style={layout.rowBetween}>
            <Typography mode="body2" color="gray500">
              보유 잔액
            </Typography>
            <View style={styles.iconCircle}>
              <Icon source="wallet-outline" size={18} color={theme.colors.primary} />
            </View>
          </View>

          <View style={styles.amountRow}>
            <Typography mode="heading1" color="gray900">
              {formatAmount(rmnAmtData?.sumPpRmnAmt)}
            </Typography>
            <Typography mode="subtitle1" color="gray600">
              원
            </Typography>
          </View>

          {/* 출금 가능 금액: 전체 잔액과 구분되게 연한 띠로 표시 */}
          <View style={[layout.rowBetween, styles.subInfoStrip]}>
            <Typography mode="body2" color="gray600">
              출금 가능 금액
            </Typography>
            <Typography mode="subtitle3" color="primary">
              {formatAmount(rmnAmtData?.ppCanRfndRmnAmt)} 원
            </Typography>
          </View>

          <SecondaryButton label={'잔액 환급'} onPress={() => navigation.navigate('Refund')} size={'lg'} />
        </View>

        {/* 프로필 + 회원 정보 카드 */}
        <View style={styles.card}>
          <View style={styles.profile}>
            <Image source={require('@images/non_profile.png')} style={styles.avatar} resizeMode="cover" />

            <View style={{ flex: 1, gap: 2 }}>
              <Typography mode="heading3" color="gray900">
                {usrData?.usrNm} 님
              </Typography>
              <Typography mode="body2" color="gray500">
                {usrData?.mbUid}
              </Typography>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={{ gap: 14 }}>
            <InfoRow label="이메일" value={usrData?.email || '-'} />

            {/* 등록계좌: 라벨은 눌리지 않고, 오른쪽 계좌번호·화살표만 누르면 계좌관리 화면으로 이동 (없으면 등록, 있으면 변경) */}
            <View style={[layout.rowBetween, styles.infoRow]}>
              <Typography mode="body2" color="gray500">
                등록계좌
              </Typography>

              <Pressable
                accessibilityRole="button"
                hitSlop={4}
                style={({ pressed }) => [layout.rowCenter, styles.accountLink, pressed && { opacity: 0.5 }]}
                onPress={() => navigation.navigate('AcntManage')}>
                {hasAccount ? (
                  <Typography mode="body2" color="gray900" numberOfLines={1}>
                    {getBankName(rfndAcnt.rfndBankCd)} {maskAccountNumber(rfndAcnt.rfndAcntNo)}
                  </Typography>
                ) : (
                  <Typography mode="body2" color="primary">
                    계좌 등록하기
                  </Typography>
                )}
                <Icon source="chevron-right" size={18} color={theme.colors.gray400} />
              </Pressable>
            </View>

            <InfoRow label="가입일자" value={usrData?.joinDnt ? formatYYYYMMDDDate(usrData.joinDnt) : '-'} />
          </View>
        </View>

        {/* 회원 탈퇴: 자주 쓰는 동작이 아니라 눈에 덜 띄는 글자 버튼으로 둔다 */}
        <TextButton
          label={'회원탈퇴'}
          size={'sm'}
          style={{ alignSelf: 'center', marginTop: 8 }}
          onPress={() => navigation.navigate('Withdrawal')}
        />
      </ScrollView>
    </ScreenWrapper>
  );
};

/** 라벨은 왼쪽에 연하게, 값은 오른쪽에 진하게 놓는 한 줄 */
const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={[layout.rowBetween, styles.infoRow]}>
    <Typography mode="body2" color="gray500">
      {label}
    </Typography>
    <Typography mode="body2" color="gray900" style={styles.infoValue} numberOfLines={1}>
      {value}
    </Typography>
  </View>
);

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 24, gap: 16 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
    padding: 20,
    gap: 16,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: -8 },
  subInfoStrip: {
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  divider: { height: 1, backgroundColor: theme.colors.gray100 },
  infoRow: { gap: 16, minHeight: 24 },
  infoValue: { flexShrink: 1, textAlign: 'right' },
  accountLink: { gap: 6, flexShrink: 1 },
});

export default UsrInfoScreen;
export { UsrInfoScreen };

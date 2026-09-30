import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Icon } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { IRmnAmt, IRefundAcnt } from '@typ/paymentType';
import { getBankName } from '@dt/bankCd';
import { formatWon, formatYYYYMMDDDate, maskAccountNumber } from '@utils/formatter';
import { loadUserAmt } from '@apis/commonApi';
import { loadRefundAcnt } from '@apis/paymentApi';
import { ScreenWrapper, SecondaryButton, Skeleton, TextButton, Typography } from '@components/common';
import { layout, theme } from '@styles';

type UsrInfoScreenProps = NativeStackScreenProps<RootStackParamList, 'UsrInfo'>;

/** 금액 숫자를 '145,500' 처럼 천 단위 콤마 문자열로 */
const formatAmount = (value: string) => Number(value).toLocaleString('ko-KR');

const UsrInfoScreen: React.FC<UsrInfoScreenProps> = ({ navigation, route }) => {
  const usrData = route.params.usrData;

  // null 이면 조회 전이라 금액 자리에 자리표시자를 보여준다
  const [rmnAmtData, setRmnAmtData] = useState<IRmnAmt | null>(null);

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

  // 등록된 출금 계좌. 조회가 끝나기 전에는 "계좌 등록하기"가 잠깐 보이지 않게 자리표시자를 둔다
  const [rfndAcnt, setRfndAcnt] = useState<IRefundAcnt | null>(null);
  const [isAcntLoaded, setIsAcntLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadRefundAcnt().then((data) => {
        console.log('등록된 내 계좌 조회 결과:', data);

        if (data.resultCd === '0000') {
          setRfndAcnt(data);
        }
        setIsAcntLoaded(true);
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
              <Icon source="wallet-outline" size={20} color={theme.colors.primary} />
            </View>
          </View>

          {rmnAmtData === null ? (
            <View style={[styles.amountRow, { paddingVertical: 4 }]}>
              <Skeleton width={160} height={32} />
            </View>
          ) : (
            <View style={styles.amountRow}>
              <Typography mode="heading1" color="gray900">
                {formatAmount(rmnAmtData.sumPpRmnAmt)}
              </Typography>
              <Typography mode="subtitle1" color="gray600">
                원
              </Typography>
            </View>
          )}

          {/* 출금 가능 금액: 전체 잔액과 구분되게 연한 띠로 표시 */}
          <View style={[layout.rowBetween, styles.subInfoStrip]}>
            <Typography mode="body2" color="gray600">
              출금 가능 금액
            </Typography>
            {rmnAmtData === null ? (
              <Skeleton width={88} height={14} />
            ) : (
              <Typography mode="subtitle3" color="primary">
                {formatWon(rmnAmtData.ppCanRfndRmnAmt)}
              </Typography>
            )}
          </View>

          {/* 앱 전체에서 환급·환불 대신 "출금" 으로 통일한다 */}
          <SecondaryButton label={'출금하기'} onPress={() => navigation.navigate('Refund')} size={'lg'} />
        </View>

        {/* 아바타·큰 이름은 마이페이지 프로필 카드가 맡으므로 여기서는 항목 표로만 보여준다 */}
        <View style={styles.card}>
          <Typography mode="subtitle2" color="gray900">
            회원정보
          </Typography>

          <View style={{ gap: 14 }}>
            <InfoRow label="이름" value={usrData?.usrNm || '-'} />
            <InfoRow label="아이디" value={usrData?.mbUid || '-'} />
            <InfoRow label="이메일" value={usrData?.email || '-'} />

            {/* 라벨은 눌리지 않고 오른쪽 계좌번호·화살표만 눌러 계좌관리로 이동한다 */}
            <View style={[layout.rowBetween, styles.infoRow]}>
              <Typography mode="body2" color="gray500">
                등록계좌
              </Typography>

              <Pressable
                accessibilityRole="button"
                hitSlop={4}
                style={({ pressed }) => [layout.rowCenter, styles.accountLink, pressed && { opacity: 0.5 }]}
                onPress={() => navigation.navigate('AcntManage')}>
                {!isAcntLoaded ? (
                  <Skeleton width={120} height={14} />
                ) : hasAccount ? (
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
  infoRow: { gap: 16, minHeight: 24 },
  infoValue: { flexShrink: 1, textAlign: 'right' },
  accountLink: { gap: 6, flexShrink: 1 },
});

export default UsrInfoScreen;
export { UsrInfoScreen };

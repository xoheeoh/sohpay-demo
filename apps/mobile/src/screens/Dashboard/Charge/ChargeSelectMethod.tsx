import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import type { RootStackParamList } from '@typ/navigation';
import { useDialog } from '@contexts/DialogContext';
import { loadRefundAcnt } from '@apis/paymentApi';
import { ScreenWrapper, Typography } from '@components/common';
import { layout, theme } from '@styles';

type ChargeSelectMethodScreenProps = NativeStackScreenProps<RootStackParamList, 'ChargeSelectMethod'>;

const ChargeSelectMethodScreen: React.FC<ChargeSelectMethodScreenProps> = ({ navigation }) => {
  /**
   * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 선행 조건 !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
   *
   * 충전은 실시간 계좌이체로 진행됨
   * 환불계좌가 등록되어있지 않은 사용자는 충전하기 사용 불가능
   * 환불계좌 존재 여부를 검사 후 조건에 따라 화면 분기처리 해야함
   *
   * 1. 환불계좌 미존재: RefundAuth 화면으로 이동시켜서 먼저 환불계좌 등록 선행 유도
   * 2. 환불계좌 존재: ChargeAmt 화면으로 이동 후 충전 로직 진행
   *
   * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
   */

  const [hasRfndAcnt, setHasRfndAcnt] = useState<boolean>(false);
  const { confirm } = useDialog();

  // 등록된 환불계좌 조회
  useFocusEffect(
    useCallback(() => {
      loadRefundAcnt().then((data) => {
        console.log('환불계좌 조회 결과:', data);

        if (data.resultCd === '0000') {
          if (data.rfndAcntNo === null) {
            setHasRfndAcnt(false);

            confirm({
              title: '알림',
              message1: '충전하기 사용 전, 내 출금계좌 등록이 필요합니다.',
              message2: '계좌 등록 화면으로 이동할까요?',
              confirmText: '확인',
              cancelText: '나중에',
            }).then((ok) => {
              if (ok) {
                navigation.navigate('RefundAuth', { flg: 'first' });
              } else {
                if (navigation.canGoBack()) navigation.goBack();
                else navigation.navigate('Dashboard');
              }
            });
          } else {
            setHasRfndAcnt(true);
          }
        }
      });
    }, []),
  );

  return (
    <ScreenWrapper backgroundColor={theme.colors.bg}>
      <View style={styles.wrap}>
        <Typography mode="heading3" color="gray900">
          충전수단을 선택해주세요.
        </Typography>

        <View style={{ gap: 12, ...layout.rowCenter }}>
          <Pressable
            style={[styles.selectBtn, layout.rowBetween]}
            onPress={() => {
              if (hasRfndAcnt) {
                // 환불계좌가 있는 모든 케이스는 바로 금액 입력 화면으로 이동
                navigation.navigate('ChargeAmt');
              } else {
                // 없는 경우는 화면 진입 시 뜨는 alert에서 처리
              }
            }}>
            <View style={[layout.rowCenter, { gap: 12 }]}>
              <Image
                source={require('@images/icon/money_transfer.png')}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
              <Typography mode="subtitle2" color="gray900">
                계좌이체
              </Typography>
            </View>

            <Icon source="chevron-right" size={24} color={theme.colors.gray600} />
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, gap: 24, paddingVertical: 24 },
  selectBtn: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderRadius: theme.radius.lg,
    backgroundColor: 'white',
    boxShadow: theme.shadow.card,
  },
});

export default ChargeSelectMethodScreen;
export { ChargeSelectMethodScreen };

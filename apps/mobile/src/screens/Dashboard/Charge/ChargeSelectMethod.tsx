import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import type { RootStackParamList } from '@typ/navigation';
import { useDialog } from '@contexts/DialogContext';
import { loadRefundAcnt } from '@apis/paymentApi';
import { Badge, ScreenWrapper, Typography } from '@components/common';
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

        {/* 충전 수단 카드 두 장을 가로로 나란히. 카드 안은 [아이콘 … 화살표/배지] 줄 아래에 이름을 둔다 */}
        <View style={[layout.rowCenter, { gap: 12, alignItems: 'stretch' }]}>
          {/* 계좌이체 */}
          <Pressable
            style={({ pressed }) => [styles.selectBtn, pressed && styles.pressed]}
            onPress={() => {
              if (hasRfndAcnt) {
                // 환불계좌가 있는 모든 케이스는 바로 금액 입력 화면으로 이동
                navigation.navigate('ChargeAmt');
              } else {
                // 없는 경우는 화면 진입 시 뜨는 alert에서 처리
              }
            }}>
            <View style={layout.rowBetween}>
              <View style={styles.iconCircle}>
                <Image
                  source={require('@images/icon/money_transfer.png')}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
              </View>
              <Icon source="chevron-right" size={22} color={theme.colors.gray400} />
            </View>

            <View style={{ gap: 2 }}>
              <Typography mode="subtitle2" color="gray900">
                계좌이체
              </Typography>
              <Typography mode="caption1" color="gray500">
                실시간 이체로 바로 충전
              </Typography>
            </View>
          </Pressable>

          {/* 가상계좌: 아직 준비되지 않아 눌리지 않게 두고 "준비중" 배지만 보여준다 */}
          <View
            style={[styles.selectBtn, styles.selectBtnDisabled]}
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            accessibilityLabel="가상계좌, 준비중">
            <View style={layout.rowBetween}>
              {/* 계좌이체와 같은 파랑 두 톤으로 맞춘 png. 준비중이라 아이콘도 연하게 보이도록 투명도를 준다 */}
              <View style={[styles.iconCircle, styles.iconCircleDisabled]}>
                <Image
                  source={require('@images/icon/virtual_account.png')}
                  style={{ width: 24, height: 24, opacity: 0.55 }}
                  resizeMode="contain"
                />
              </View>
              <Badge label="준비중" tone="gray" />
            </View>

            <View style={{ gap: 2 }}>
              <Typography mode="subtitle2" color="gray400">
                가상계좌
              </Typography>
              <Typography mode="caption1" color="gray400">
                곧 제공될 예정이에요
              </Typography>
            </View>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, gap: 24, paddingVertical: 24 },
  selectBtn: {
    flex: 1,
    padding: 16,
    gap: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: 'white',
    boxShadow: theme.shadow.card,
  },
  pressed: { backgroundColor: theme.colors.gray50 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleDisabled: { backgroundColor: theme.colors.gray100 },
  // 준비중 항목: 그림자 대신 연한 테두리만 두어 카드 모양은 유지하되 누를 수 없다는 게 보이게 한다 (화면 배경과 같은 회색을 쓰면 카드 윤곽이 사라진다)
  selectBtnDisabled: { boxShadow: 'none', borderWidth: 1, borderColor: theme.colors.gray150, opacity: 0.85 },
});

export default ChargeSelectMethodScreen;
export { ChargeSelectMethodScreen };

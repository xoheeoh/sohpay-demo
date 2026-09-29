import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import { Badge, ScreenWrapper, Typography } from '@components/common';
import { layout, theme } from '@styles';

type ChargeSelectMethodScreenProps = NativeStackScreenProps<RootStackParamList, 'ChargeSelectMethod'>;

/**
 * 충전수단 선택.
 *
 * 전신 앱은 출금(환불) 계좌가 등록된 사용자만 충전할 수 있게 여기서 막았지만, 이 앱에서는 그 조건을 두지 않는다.
 * 실시간 계좌이체 충전은 결제창에서 은행 인증을 거치며 이체가 일어나는 계좌 자체가 본인 확인을 대신하기 때문이다.
 * 1원 인증으로 등록하는 출금 계좌는 돈이 나가는 출금에서만 요구한다 (RefundAcntScreen).
 * 서버(create_charge)도 계좌 없이 충전 거래를 만들 수 있고, 등록된 계좌가 있으면 결제창에 참고로 표시만 한다.
 */
const ChargeSelectMethodScreen: React.FC<ChargeSelectMethodScreenProps> = ({ navigation }) => {
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
            onPress={() => navigation.navigate('ChargeAmt')}>
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

import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import { Badge, ScreenWrapper, Typography, useScreenBottomPadding } from '@components/common';
import { layout, theme } from '@styles';

type ChargeSelectMethodScreenProps = NativeStackScreenProps<RootStackParamList, 'ChargeSelectMethod'>;

/**
 * 충전수단 선택.
 * 출금 계좌 등록 여부는 확인하지 않는다. 계좌이체 충전은 결제창의 은행 인증이 본인 확인을 대신하고,
 * 1원 인증 계좌는 돈이 나가는 출금에서만 요구한다 (RefundAcntScreen).
 */
const ChargeSelectMethodScreen: React.FC<ChargeSelectMethodScreenProps> = ({ navigation }) => {
  const screenBottom = useScreenBottomPadding();
  return (
    <ScreenWrapper backgroundColor={theme.colors.bg}>
      <View style={[styles.wrap, screenBottom]}>
        <Typography mode="heading3" color="gray900">
          충전수단을 선택해주세요.
        </Typography>

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

          {/* 가상계좌: 아직 제공하지 않아 눌리지 않는 카드로 두고 "준비중" 배지를 보여준다 */}
          <View
            style={[styles.selectBtn, styles.selectBtnDisabled]}
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            accessibilityLabel="가상계좌, 준비중">
            <View style={layout.rowBetween}>
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
  wrap: { paddingHorizontal: 16, gap: 24, paddingTop: theme.screen.topForm },
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
  // 준비중 카드: 그림자 대신 연한 테두리로 카드 윤곽만 남겨 비활성임을 드러낸다
  selectBtnDisabled: { boxShadow: 'none', borderWidth: 1, borderColor: theme.colors.gray150, opacity: 0.85 },
});

export default ChargeSelectMethodScreen;
export { ChargeSelectMethodScreen };

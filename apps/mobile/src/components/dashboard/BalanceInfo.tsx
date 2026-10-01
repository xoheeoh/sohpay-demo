import { Pressable, StyleSheet, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { Icon } from 'react-native-paper';

import { Typography } from '@components/common';
import { IRmnAmt } from '@typ/paymentType';
import { IUserProfile } from '@typ/userType';
import type { RootStackParamList } from '@typ/navigation';
import { theme } from '@styles';

interface BalanceInfoProps {
  usrData: IUserProfile | undefined;
  rmnAmtData: IRmnAmt | undefined;
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
}

/** 대시보드 상단 잔액 카드 - 브랜드 그라디언트 + 충전/출금 바로가기 */
const BalanceInfo: React.FC<BalanceInfoProps> = ({ usrData, rmnAmtData, navigation }) => {
  const balance = Number(rmnAmtData?.moneyAmt ?? 0).toLocaleString('ko-KR');

  return (
    // 그림자는 바깥 View 가, 둥근 모서리 안쪽 잘라내기는 그라디언트가 맡는다. iOS 는 한 뷰에 둘을 함께 걸면 모서리가 둥글게 잘리지 않는다
    <View style={styles.cardShadow}>
      <LinearGradient
        colors={[theme.colors.blue500, theme.colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}>
        {/* 장식용 원 */}
        <View style={styles.decoLarge} />
        <View style={styles.decoSmall} />

        <View style={{ gap: 4 }}>
          <Typography mode="body2" color="white" style={{ opacity: 0.8 }}>
            {usrData?.usrNm}님의 보유 머니
          </Typography>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Typography mode="heading1" color="white" style={styles.amount}>
              {balance}
            </Typography>
            <Typography mode="subtitle1" color="white" style={{ opacity: 0.9 }}>
              원
            </Typography>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
            onPress={() => navigation.navigate('ChargeSelectMethod')}>
            <Icon source="plus-circle-outline" size={18} color="white" />
            <Typography mode="subtitle3" color="white">
              충전
            </Typography>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
            onPress={() => navigation.navigate('Refund')}>
            <Icon source="bank-transfer-out" size={20} color="white" />
            <Typography mode="subtitle3" color="white">
              출금
            </Typography>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardShadow: { borderRadius: theme.radius.xl, boxShadow: theme.shadow.primary },
  card: {
    borderRadius: theme.radius.xl,
    padding: 22,
    gap: 24,
    overflow: 'hidden',
  },
  decoLarge: {
    position: 'absolute',
    right: -40,
    top: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decoSmall: {
    position: 'absolute',
    right: 60,
    bottom: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  amount: { fontSize: 34, lineHeight: 42, letterSpacing: -1 },
  actions: { flexDirection: 'row', gap: 8 },
  action: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionPressed: { backgroundColor: 'rgba(255, 255, 255, 0.28)' },
});

export default BalanceInfo;
export { BalanceInfo };

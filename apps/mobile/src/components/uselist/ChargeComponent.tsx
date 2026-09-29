import type { RootStackParamList } from '@typ/navigation';
import { Pressable, StyleSheet, View } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Icon } from 'react-native-paper';
import { Badge, Typography, getTrxAmountColor, getTrxTone } from '@components/common';
import { formatDateTime, formatWon } from '@utils/formatter';
import { IChargeList } from '@typ/paymentType';
import { layout, theme } from '@styles';

interface ChargeComponentProps {
  item: IChargeList;
  getCd: string;
}

const ChargeComponent: React.FC<ChargeComponentProps> = ({ item, getCd }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // 모의 결제창에서 승인 거절·취소된 건은 "충전실패"로, 금액은 취소 건처럼 회색 취소선 (돈이 들어오지 않았음)
  const isFailed = item.chrgStCd === '2';
  const categoryNm = isFailed ? '충전실패' : '충전';

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={() => navigation.navigate('UseDetail', { item: item, getCd: getCd })}>
      {/* 좌측: 충전수단 / 일시 · 거래구분 */}
      <View style={styles.info}>
        <Typography mode="subtitle2" color={isFailed ? 'gray400' : 'gray900'} numberOfLines={1}>
          {item.chrgPmCdNm}
        </Typography>

        <View style={[layout.rowCenter, { gap: 8 }]}>
          <Badge label={categoryNm} tone={getTrxTone(categoryNm)} />
          <Typography mode="caption1" color="gray500">
            {formatDateTime(`${item.trDt}${item.trTm}`).slice(0, 16)}
          </Typography>
        </View>
      </View>

      {/* 우측: 금액 */}
      <View style={styles.amountBox}>
        <Typography
          mode="subtitle1"
          color={isFailed ? 'gray400' : getTrxAmountColor('charge')}
          style={isFailed ? styles.struck : undefined}>
          {isFailed ? '' : '+ '}
          {formatWon(item.chrgAmt)}
        </Typography>
      </View>

      <Icon source="chevron-right" size={20} color={theme.colors.gray300} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { ...layout.rowCenter, gap: 8, paddingVertical: 18 },
  pressed: { opacity: 0.6 },
  info: { flex: 1, gap: 4 },
  amountBox: { alignItems: 'flex-end', gap: 2 },
  struck: { textDecorationLine: 'line-through' },
});

export default ChargeComponent;
export { ChargeComponent };

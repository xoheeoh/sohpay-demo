import type { RootStackParamList } from '@typ/navigation';
import { Pressable, StyleSheet, View } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Icon } from 'react-native-paper';
import { Badge, Typography, getTrxAmountColor, getTrxTone } from '@components/common';
import { formatDateTime, formatWon } from '@utils/formatter';
import { getBankName } from '@dt/bankCd';
import { IRefundList } from '@typ/paymentType';
import { layout, theme } from '@styles';

interface RefundComponentProps {
  item: IRefundList;
  getCd: string;
}

const RefundComponent: React.FC<RefundComponentProps> = ({ item, getCd }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const categoryNm =
    item.rfndStCd === '0' ? '출금요청' : item.rfndStCd === '1' ? '출금성공' : item.rfndStCd === '2' ? '출금실패' : '';

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={() => navigation.navigate('UseDetail', { item: item, getCd: getCd })}>
      {/* 좌측: 출금 계좌 / 일시 · 상태 */}
      <View style={styles.info}>
        <Typography mode="subtitle2" color="gray900" numberOfLines={1}>
          {getBankName(item.rfndBankCd)} {item.rfndAcntNo}
        </Typography>

        <View style={[layout.rowCenter, { gap: 8 }]}>
          <Badge label={categoryNm} tone={getTrxTone(categoryNm)} />
          <Typography mode="caption1" color="gray500">
            {formatDateTime(`${item.rfndReqDt}${item.rfndReqTm}`).slice(0, 16)}
          </Typography>
        </View>
      </View>

      {/* 우측: 금액 */}
      <View style={styles.amountBox}>
        <Typography mode="subtitle1" color={getTrxAmountColor('refund')}>
          - {formatWon(item.rfndAmt)}
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
});

export default RefundComponent;
export { RefundComponent };

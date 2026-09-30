import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Icon } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { IMidInfo, IUseList } from '@typ/paymentType';
import { formatDateTime, formatWon } from '@utils/formatter';
import { loadMidInfo } from '@apis/commonApi';
import { Badge, Typography, getTrxAmountColor, getTrxTone } from '@components/common';
import { layout, theme } from '@styles';

interface UseComponentProps {
  getCd: string;
  item: IUseList;
}

const UseComponent: React.FC<UseComponentProps> = ({ getCd, item }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const isCancel = item.trxStCd === '1' || item.trxStCd === '2';

  const categoryNm =
    item.trxStCd === '0'
      ? '결제'
      : isCancel && item.partCanFlg === '0'
        ? '취소'
        : item.partCanFlg === '1'
          ? '부분취소'
          : '';

  const amountText =
    item.trxStCd === '0'
      ? `- ${formatWon(item.goodsAmt)}`
      : isCancel
        ? `+ ${formatWon(item.moneyAmt + item.pointAmt)}`
        : '';

  // 목록 행에 가맹점명을 보여주기 위해 mid 로 가맹점 정보를 조회한다
  const [midInfo, setMidInfo] = useState<IMidInfo>();

  useEffect(() => {
    loadMidInfo(item.mid).then((data) => {
      console.log('가맹점 정보 조회 결과:', data);

      if (data.resultCd === '0000') {
        setMidInfo(data);
      }
    });
  }, [item.mid]);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={() => navigation.navigate('UseDetail', { item: item, getCd: getCd })}>
      {/* 좌측: 가맹점명 / 일시 · 거래구분 (취소 건은 가맹점명을 흐리게) */}
      <View style={styles.info}>
        <Typography mode="subtitle2" color={isCancel ? 'gray400' : 'gray900'} numberOfLines={1}>
          {midInfo?.coNm ?? ' '}
        </Typography>

        <View style={[layout.rowCenter, { gap: 8 }]}>
          <Badge label={categoryNm} tone={getTrxTone(categoryNm)} />
          <Typography mode="caption1" color="gray500">
            {formatDateTime(`${item.trDt}${item.trTm}`).slice(0, 16)}
          </Typography>
        </View>
      </View>

      {/* 우측: 금액 / 승인번호 */}
      <View style={styles.amountBox}>
        <Typography mode="subtitle1" color={getTrxAmountColor(isCancel ? 'cancel' : 'pay')}>
          {amountText}
        </Typography>
        <Typography mode="caption2" color="gray400">
          #{item.appNo}
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

export default UseComponent;
export { UseComponent };

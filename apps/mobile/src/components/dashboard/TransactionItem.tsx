import { StyleSheet, View } from 'react-native';

import { ListDataItem, TransType, TransTypeEnum } from '@typ/paymentType';
import { getBankName } from '@dt/bankCd';
import { formatWon } from '@utils/formatter';
import { Typography, getTrxAmountColor } from '@components/common';

interface TransactionItemProps {
  data: ListDataItem | null;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ data }) => {
  // PAY:결제, CANCEL:취소, PARTCANCEL:부분취소, RFND:출금, PPNP:충전
  const getContent = (ctgr: TransType) => {
    if (ctgr === 'CANCEL' || ctgr === 'PARTCANCEL' || ctgr === 'PAY') {
      return data?.coNm; // 결제·취소는 상점명
    } else if (ctgr === 'PPNP') {
      return data?.coNm || '충전'; // 충전은 수단 이름(계좌이체 / 가상계좌)
    } else if (ctgr === 'RFND') {
      return getBankName(data?.rfndBankCd || '') + ' ' + (data?.rfndAcntNo || '');
    }
  };

  const isCancel = data?.transType === 'CANCEL' || data?.transType === 'PARTCANCEL';

  // 금액 표기·색은 이용내역과 같은 규칙(formatWon · getTrxAmountColor)을 쓴다
  const amountKind = isCancel
    ? 'cancel'
    : data?.transType === 'PPNP'
      ? 'charge'
      : data?.transType === 'RFND'
        ? 'refund'
        : 'pay';
  const amountText = isCancel
    ? `+ ${formatWon(data?.ccAmt)}`
    : data?.transType === 'PPNP'
      ? `+ ${formatWon(data?.goodsAmt)}`
      : data?.transType === 'RFND'
        ? `- ${formatWon(data?.rfndAmt)}`
        : `- ${formatWon(data?.goodsAmt)}`;

  return (
    <View style={styles.container}>
      {/* 거래일 (MM/DD). 점으로 이으면 시각처럼 읽혀 빗금을 쓴다 */}
      <Typography mode="caption1" color="gray400" style={styles.date}>
        {data?.trDt.slice(4, 6)}/{data?.trDt.slice(6, 8)}
      </Typography>

      {/* 가맹점 / 거래구분 */}
      <View style={styles.info}>
        <Typography mode="subtitle3" color="gray900" numberOfLines={1}>
          {getContent(data?.transType as TransType)}
        </Typography>

        <Typography mode="caption1" color={isCancel ? 'blue500' : 'gray500'}>
          {TransTypeEnum[data?.transType as 'PAY']}
        </Typography>
      </View>

      {/* 금액 */}
      <Typography mode="subtitle2" color={getTrxAmountColor(amountKind)} style={styles.amount}>
        {amountText}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  date: { width: 40 },
  info: { flex: 1, gap: 2 },
  amount: { textAlign: 'right' },
});

export default TransactionItem;
export { TransactionItem };

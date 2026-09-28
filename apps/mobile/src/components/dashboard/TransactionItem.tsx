import { StyleSheet, View } from 'react-native';

import { ListDataItem, TransType, TransTypeEnum } from '@typ/paymentType';
import { getBankName } from '@dt/bankCd';
import { Typography } from '@components/common';

interface TransactionItemProps {
  data: ListDataItem | null;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ data }) => {
  // PAY:결제, CANCEL:취소, PARTCANCEL:부분취소, RFND:출금, PPNP:충전
  const getContent = (ctgr: TransType) => {
    if (ctgr === 'CANCEL' || ctgr === 'PARTCANCEL' || ctgr === 'PAY') {
      return data?.coNm; // 결제, 취소에 관한 내역은 상점명 표시
    } else if (ctgr === 'PPNP') {
      // transType이 PPNP인 경우 존재
      // 원래 02:출금이제, 03:가상계좌 이지만 이 앱은 출금이체 고정이므로 그냥 계좌번호 노출
      return '계좌이체';
    } else if (ctgr === 'RFND') {
      return getBankName(data?.rfndBankCd || '') + ' ' + (data?.rfndAcntNo || '');
    }
  };

  const isCancel = data?.transType === 'CANCEL' || data?.transType === 'PARTCANCEL';

  return (
    <View style={styles.container}>
      {/* 거래일 (MM/DD) - 점(.)으로 이으면 시각처럼 읽혀서 빗금으로 구분 */}
      <Typography mode="caption1" color="gray400" style={styles.date}>
        {data?.trDt.slice(4, 6)}/{data?.trDt.slice(6, 8)}
      </Typography>

      {/* 가맹점 / 거래구분 */}
      <View style={styles.info}>
        <Typography mode="subtitle3" color="gray900" numberOfLines={1}>
          {getContent(data?.transType as TransType)}
        </Typography>

        <Typography mode="caption1" color={isCancel ? 'blue800' : 'gray500'}>
          {TransTypeEnum[data?.transType as 'PAY']}
        </Typography>
      </View>

      {/* 금액 */}
      <Typography mode="subtitle2" color={isCancel ? 'blue800' : 'gray900'} style={styles.amount}>
        {
          isCancel
            ? '+ ' + Number(data?.ccAmt ?? 0).toLocaleString() // 취소, 부분취소 금액
            : data?.transType === 'PPNP'
              ? '+ ' + Number(data?.goodsAmt ?? 0).toLocaleString() // 충전 금액
              : data?.transType === 'RFND'
                ? '- ' + Number(data?.rfndAmt ?? 0).toLocaleString() // 출금 금액
                : '- ' + Number(data?.goodsAmt ?? 0).toLocaleString() // 결제 금액
        }
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

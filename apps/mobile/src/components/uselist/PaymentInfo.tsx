import { IChargeList, IRefundList, IUseList } from '@typ/paymentType';
import { getBankName } from '@dt/bankCd';
import { formatDateTime } from '@utils/formatter';

import { InfoRow } from './InfoRow';

interface PaymentInfoProps {
  getCd: string;
  dateTime: string;
  item: IRefundList | IUseList | IChargeList;
  stateNm: string;
}

const PaymentInfo: React.FC<PaymentInfoProps> = ({ getCd, dateTime, item, stateNm }) => {
  const isUseList = (item: IRefundList | IUseList | IChargeList): item is IUseList => {
    return (item as IUseList).goodsNm !== undefined;
  };

  const isRefundList = (item: IRefundList | IUseList | IChargeList): item is IRefundList => {
    return (item as IRefundList).rfndNo !== undefined;
  };

  const isChargeList = (item: IRefundList | IUseList | IChargeList): item is IChargeList => {
    return (item as IChargeList).chrgPmCd !== undefined;
  };

  const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

  const totalAmt =
    getCd === 'USE' && isUseList(item)
      ? item.goodsAmt
      : getCd === 'CHRG' && isChargeList(item)
        ? item.chrgAmt
        : getCd === 'RFND' && isRefundList(item)
          ? item.rfndAmt
          : 0;

  // 취소·실패한 거래만 취소선. 정상 완료된 출금 금액에는 긋지 않는다
  const isStruck = stateNm.includes('취소') || stateNm.includes('실패');

  return (
    <>
      <InfoRow
        label={getCd === 'USE' ? '거래일시' : getCd === 'CHRG' ? '충전일시' : getCd === 'RFND' ? '요청일시' : ''}
        value={formatDateTime(dateTime)}
      />

      {/* 환불 - 출금 성공 케이스에만 보이는 부분 */}
      {getCd === 'RFND' && isRefundList(item) && item.rfndStCd === '1' && (
        <InfoRow label="처리일시" value={formatDateTime(`${item.rfndDt}${item.rfndTm}`)} />
      )}

      <InfoRow
        label={getCd === 'RFND' ? '요청번호' : getCd === 'CHRG' ? '충전번호' : '승인번호'}
        value={
          getCd === 'RFND' && isRefundList(item)
            ? item.rfndNo
            : isUseList(item)
              ? item.appNo
              : isChargeList(item)
                ? item.chrgTid
                : ''
        }
      />

      {/* 결제 내역의 경우에만 보이는 부분 */}
      {getCd === 'USE' && isUseList(item) && (
        <>
          <InfoRow label="공급가액" value={won(item.goodsSplAmt)} />
          <InfoRow label="부가세" value={won(item.goodsVat)} />
          <InfoRow label="봉사료" value={won(item.goodsSvsAmt)} />
        </>
      )}

      {/* 환불 내역의 경우에만 보이는 부분 */}
      {getCd === 'RFND' && isRefundList(item) && (
        <>
          <InfoRow label="출금은행" value={getBankName(item.rfndBankCd)} />
          <InfoRow label="출금계좌" value={item.rfndAcntNo} />
          <InfoRow label="예금주명" value={item.rfndAcntNm} />
        </>
      )}

      <InfoRow
        label={getCd === 'USE' ? '합계금액' : getCd === 'CHRG' ? '충전금액' : getCd === 'RFND' ? '출금금액' : ''}
        value={won(totalAmt)}
        emphasis
        valueStyle={{ textDecorationLine: isStruck ? 'line-through' : 'none' }}
      />
    </>
  );
};

export default PaymentInfo;
export { PaymentInfo };

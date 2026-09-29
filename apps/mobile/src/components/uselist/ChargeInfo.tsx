import { IChargeList } from '@typ/paymentType';

import { InfoRow } from './InfoRow';

interface ChargeInfoProps {
  item: IChargeList;
}

const ChargeInfo: React.FC<ChargeInfoProps> = ({ item }) => {
  return (
    <>
      {/* 옛 API 의 "선불 카드번호"(ppMthdId) 는 이 앱에 해당 값이 없어 보여주지 않는다 */}
      <InfoRow label="충전수단" value={item.chrgPmCdNm} />
    </>
  );
};

export default ChargeInfo;
export { ChargeInfo };

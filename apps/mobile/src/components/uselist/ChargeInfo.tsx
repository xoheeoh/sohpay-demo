import { IChargeList } from '@typ/paymentType';

import { InfoRow } from './InfoRow';

interface ChargeInfoProps {
  item: IChargeList;
}

const ChargeInfo: React.FC<ChargeInfoProps> = ({ item }) => {
  return (
    <>
      <InfoRow label="충전수단" value={item.chrgPmCdNm} />
    </>
  );
};

export default ChargeInfo;
export { ChargeInfo };

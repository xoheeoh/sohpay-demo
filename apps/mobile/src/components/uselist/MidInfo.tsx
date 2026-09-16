import { IMidInfo } from '@typ/paymentType';
import { formatBusinessNumber, formatPhoneNumber } from '@utils/formatter';

import { InfoRow } from './InfoRow';

interface MidInfoProps {
  midInfo: IMidInfo;
}

const MidInfo: React.FC<MidInfoProps> = ({ midInfo }) => {
  const address =
    [midInfo?.postNo ? `(${midInfo.postNo})` : '', midInfo?.addrNo1, midInfo?.addrNo2].filter(Boolean).join(' ') || '-';

  return (
    <>
      <InfoRow label="가맹점 상호" value={midInfo?.coNm} />
      <InfoRow label="사업자등록번호" value={formatBusinessNumber(midInfo?.coNo)} />
      <InfoRow label="가맹점 대표자명" value={midInfo?.repNm || '-'} />
      <InfoRow label="가맹점 전화번호" value={midInfo?.telNo ? formatPhoneNumber(midInfo.telNo) : '-'} />
      <InfoRow label="가맹점 주소" value={address} />
    </>
  );
};

export default MidInfo;
export { MidInfo };

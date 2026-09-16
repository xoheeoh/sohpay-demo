// 은행명 매핑
export const bankMapping: Record<string, string> = {
  '004': 'KB국민은행',
  '088': '신한은행',
  '081': '하나은행',
  '020': '우리은행',
  '011': 'NH농협은행',
  '090': '카카오뱅크',
  '092': '토스뱅크',
  '089': '케이뱅크',
  '003': 'IBK기업은행',
  '002': 'KDB산업은행',
  '007': 'SH수협은행',
};

// 은행 이미지 매핑
export const bankImageMapping: Record<string, any> = {
  '004': require('@images/bank/kb.png'),
  '088': require('@images/bank/shinhan.png'),
  '081': require('@images/bank/hana.png'),
  '020': require('@images/bank/woori.png'),
  '011': require('@images/bank/nh.png'),
  '090': require('@images/bank/kakao.png'),
  '092': require('@images/bank/toss.png'),
  '089': require('@images/bank/kbank.png'),
  '003': require('@images/bank/ibk.png'),
  '002': require('@images/bank/kdb.png'),
  '007': require('@images/bank/sh.png'),
  // 이후에 추가...
};

export const getBankName = (code: string): string => {
  return bankMapping[code] || '';
};

export const getBankImage = (code: string): any => {
  return bankImageMapping[code] || '';
};

export const getBankCodes = (): string[] => {
  return Object.keys(bankMapping).sort((a, b) => parseInt(a) - parseInt(b));
};

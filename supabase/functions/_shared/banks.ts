/** 은행 코드 → 이름. 앱의 apps/mobile/src/svc/data/bankCd.ts 와 같은 표 (모의 결제창에 출금 계좌를 표시할 때 쓴다) */
export const BANK_NAME: Record<string, string> = {
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

export function bankName(code: string | null | undefined) {
  return (code && BANK_NAME[code]) || code || '';
}

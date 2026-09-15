export type Bank = { code: string; name: string; color: string };

/** 은행 로고는 각사 저작물이라 쓰지 않고, 이니셜 + 브랜드 톤 색상으로 배지를 그린다. */
export const BANKS: Bank[] = [
  { code: '004', name: 'KB국민', color: '#5A4B2E' },
  { code: '088', name: '신한', color: '#1F4FD8' },
  { code: '020', name: '우리', color: '#0B6FB8' },
  { code: '081', name: '하나', color: '#0A8A6C' },
  { code: '011', name: 'NH농협', color: '#1C7C3D' },
  { code: '003', name: 'IBK기업', color: '#0D5FAE' },
  { code: '090', name: '카카오뱅크', color: '#C9A400' },
  { code: '092', name: '토스뱅크', color: '#1B64DA' },
  { code: '089', name: '케이뱅크', color: '#7A4DD8' },
  { code: '007', name: 'SH수협', color: '#1859A8' },
  { code: '002', name: 'KDB산업', color: '#0E5A9A' },
];

export const bankOf = (code: string) => BANKS.find((b) => b.code === code) ?? { code, name: '은행', color: '#6B7280' };

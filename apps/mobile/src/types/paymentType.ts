/* 회원 잔액 */
export interface IRmnAmt {
  sumPpRmnAmt: string;
  ppNeverRfndRmnAmt: string;
  ppCanRfndRmnAmt: string;
  pointAmt: string;
  moneyAmt: string;
}

/* 결제내역 */
export interface IPaymentList {
  goodsAmt: number;
  goodsNm: string;
  trDt: string;
  trTm: string;
  trxStCd: '0' | '1' | '2'; // 0: 승인, 1: 전취소, 2: 후취소
  appNo: string;
  mid: string;
}

/* 이용타입 */
export enum TransTypeEnum {
  PAY = '결제',
  CANCEL = '취소',
  PARTCANCEL = '부분취소',
  RFND = '출금',
  PPNP = '충전',
}

export type TransType = keyof typeof TransTypeEnum;

export interface ListDataItem {
  /** 이용타입 PAY:사용, CANCEL:취소, PARTCANCEL:부분취소, RFND:환불, PPNP:충전 (필수) */
  transType: TransType; // 1

  /** 결제 총 금액 (선택) */
  goodsAmt?: string; // 2

  /** 취소 금액 (선택) */
  ccAmt?: string; // 3

  /** 출금 금액 (선택) */
  rfndAmt?: string; // 4

  /** 잔여 금액 (선택) */
  ppRmnAmt?: string; // 5

  /** 가맹점 ID (선택) */
  mid?: string; // 6

  /** 거래일자 yyyyMMdd (필수) */
  trDt: string; // 7

  /** 종료일 yyyyMMdd (필수) */
  toDt: string; // 8

  /** 가맹점 상호명 (필수) */
  coNm: string; // 9

  /** 충전지불수단 (transType이 PPNP인 경우 존재, 선택) */
  chrgPmCd?: string; // 10

  /** 출금계좌 (transType이 RFND인 경우 존재, 선택) */
  rfndAcntNo?: string; // 11

  /** 출금은행 (transType이 RFND인 경우 존재, 선택) */
  rfndBankCd?: string; // 12

  /** 선불회원ID (필수) */
  mbUid: string; // 13

  /** 참조값 (선택) */
  note?: string; // 14
}

/* 충전 계좌 */
export interface ITransferAcntList {
  mainAcntFlg: string; // 0: 메인계좌 x, 1: 메인계좌 o
  acntNo: string;
  bankCd: string;
}

/* 환불 계좌 */
export interface IRefundAcnt {
  rfndBankCdNm: string;
  rfndBankCd: string;
  mbUid: string;
  rfndAcntNo: string;
  rfndAcntNm: string;
}

/* 환불 결과 */
export interface IWithdrawalSuc {
  mbUid: string;
  refundAmt: string;
  ppRmnAmt: string;
  ppMthdId: string;
  rfndNo: string;
}

/* 이용내역 - CHRG */
export interface IChargeList {
  tid: string;
  trDt: string;
  trTm: string;
  mid: string;
  chrgTid: string;
  ordNo: string;
  chrgPmCd: string;
  chrgPmCdNm: string;
  ppMthdId: string;
  chrgAmt: number;
  rmnAmt: number;
}

/* 이용내역 - RFND */
export interface IRefundList {
  rfndNo: string;
  rfndReqDt: string;
  rfndReqTm: string;
  rfndStCd: string; // 0: 요청, 1: 출금, 2: 실패
  rfndBankCd: string;
  rfndAcntNo: string;
  rfndAcntNm: string;
  rfndAmt: number;
  rmnAmt: number;
  rfndDt?: string;
  rfndTm?: string;
}

/* 이용내역 - USE */
export interface IUseList {
  tid: string;
  trDt: string;
  trTm: string;
  reqNo: string;
  appNo: string;
  ordNo: string;
  reqDt: string;
  reqTm: string;
  trxStCd: string;
  appDt: string;
  appTm: string;
  mid: string;
  goodsNm: string;
  goodsAmt: number;
  goodsSplAmt: number;
  goodsVat: number;
  goodsSvsAmt: number;
  ordNm: string;
  ordTel: string;
  ordEmail: string;
  ccMsg: string;
  cpxTid: string;
  stid: string;
  partCanFlg: '0' | '1'; // 0: 아니오, 1: 예
  moneyAmt: number;
  pointAmt: number;
}

/**
 * 이용내역 조회 결과 한 건.
 * "모두" 조회 시 결제·충전·출금이 한 목록에 섞여 내려오므로, 각 건이 자기 종류(getCd)를 갖는다.
 * 화면은 이 getCd 로 행 컴포넌트와 상세 화면 표시 방식을 고른다.
 */
export type TransactionListItem =
  | (IUseList & { getCd: 'USE' })
  | (IChargeList & { getCd: 'CHRG' })
  | (IRefundList & { getCd: 'RFND' });

/* 가맹점 정보 */
export interface IMidInfo {
  coNo: string;
  coNm: string;
  hostingCd: string;
  repNm: string;
  useFlg: string;
  postNo: string;
  addrNo1: string;
  addrNo2: string;
  rpostNo: string;
  raddrNo1: string;
  raddrNo2: string;
  telNo: string;
  faxNo: string;
  email: string;
}

/* QR 거래 데이터 */
export interface IQRdata {
  authNo: string;
  coNm: string;
  goodsAmt: number;
  goodsNm: string;
  goodsSplAmt: number;
  goodsSvsAmt: number;
  goodsVat: number;
  goodsTaxfreeAmt: number;
  mid: string;
  reqDt: string;
  reqStCd: string;
  reqTm: string;
  rid: string;
  tid: string;
}

/* 결제 성공 데이터 */
export interface IPaySuccess {
  appNo: string;
  ediDate: string;
  goodsAmt: string;
  goodsNm: string;
  mbsReserved: string;
  mid: string;
  ordNm: string;
  ordNo: string;
  pmCd: string;
  ppRmnAmt: string;
  spmCd: string;
  tid: string;
  trDt: string;
  trTm: string;
  trxStCd: string;
  coNm: string;
}

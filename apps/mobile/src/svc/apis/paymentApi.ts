/**
 * 결제·충전·출금·계좌 API 어댑터.
 * 화면은 원본과 같은 함수 시그니처와 { resultCd, ... } 응답을 그대로 쓴다.
 */
import Toast from 'react-native-toast-message';
import { ChargeTypeEnum } from '@dt/enum';
import { getBankName } from '@dt/bankCd';
import type {
  IChargeList,
  IPaySuccess,
  IQRdata,
  IRefundAcnt,
  IRefundList,
  ITransferAcntList,
  IUseList,
  IWithdrawalSuc,
  ListDataItem,
  TransactionListItem,
} from '@typ/paymentType';
import { getData } from '@storages/asyncStorage';
import {
  callFunction,
  fail,
  fromRpc,
  fromYmd,
  hms,
  newIdempotencyKey,
  ok,
  supabase,
  toFail,
  unwrap,
  ymd,
  ymdhms,
} from './client';
import { takeVerifiedPin } from './usrApi';

type TxRow = {
  id: string;
  type: 'CHARGE' | 'PAYMENT' | 'REFUND';
  status: 'PENDING' | 'APPROVED' | 'PARTIALLY_CANCELED' | 'CANCELED' | 'FAILED';
  amount: number;
  canceled_amount: number;
  balance_after: number | null;
  charge_method: 'BANK_TRANSFER' | 'VIRTUAL_ACCOUNT' | null;
  failure_code: string | null;
  order_no: string;
  goods_name: string | null;
  approved_at: string | null;
  canceled_at: string | null;
  created_at: string;
  merchant: { mid: string; name: string } | null;
  bank_account: { bank_code: string; account_no_masked: string; holder_name: string } | null;
};

const TX_SELECT =
  '*, merchant:merchants(mid, name), bank_account:bank_accounts(bank_code, account_no_masked, holder_name)';
const CHARGE_NM: Record<string, string> = { BANK_TRANSFER: '계좌이체', VIRTUAL_ACCOUNT: '가상계좌' };
const CHARGE_CD: Record<string, string> = {
  BANK_TRANSFER: ChargeTypeEnum.Transfer,
  VIRTUAL_ACCOUNT: ChargeTypeEnum.Virtual,
};
/** 실패한 충전·출금의 사유 코드 → 화면 문구 */
const FAILURE_NM: Record<string, string> = {
  PG_DECLINED: '승인 거절',
  USER_CANCELED: '결제창에서 취소',
  MAX_BALANCE_EXCEEDED: '보유 한도 초과',
  BANK_ERROR: '은행 점검으로 이체 실패',
};
const failMsgOf = (t: TxRow) => (t.status === 'FAILED' ? (FAILURE_NM[t.failure_code ?? ''] ?? '처리 실패') : undefined);

/* ── 이용내역 ─────────────────────────────────────────────────── */
const toUse = (t: TxRow): IUseList => {
  const supply = Math.round(t.amount / 1.1);
  // 화면 상태 코드: 0 승인 | 1 전체 취소 | 2 부분 취소 (행·상세 컴포넌트가 이 값으로 배지와 색을 정한다)
  const trxStCd = t.status === 'CANCELED' ? '1' : t.status === 'PARTIALLY_CANCELED' ? '2' : '0';
  const isCanceled = t.canceled_amount > 0;
  return {
    tid: t.id,
    trDt: ymd(t.approved_at ?? t.created_at),
    trTm: hms(t.approved_at ?? t.created_at),
    reqNo: t.order_no,
    appNo: t.order_no.slice(-8),
    ordNo: t.order_no,
    reqDt: ymd(t.created_at),
    reqTm: hms(t.created_at),
    trxStCd,
    appDt: ymd(t.approved_at ?? t.created_at),
    appTm: hms(t.approved_at ?? t.created_at),
    mid: t.merchant?.mid ?? '',
    goodsNm: t.goods_name ?? '',
    goodsAmt: t.amount,
    goodsSplAmt: supply,
    goodsVat: t.amount - supply,
    goodsSvsAmt: 0,
    ordNm: '',
    ordTel: '',
    ordEmail: '',
    ccMsg: t.status === 'CANCELED' ? '결제 취소' : t.status === 'PARTIALLY_CANCELED' ? '부분 취소' : '',
    cpxTid: '',
    stid: '',
    partCanFlg: t.status === 'PARTIALLY_CANCELED' ? '1' : '0',
    // 취소 건은 돌려받은 금액 (목록에서 "+ 금액"으로 표시), 승인 건은 결제 금액
    moneyAmt: isCanceled ? t.canceled_amount : t.amount,
    pointAmt: 0,
  };
};

const toCharge = (t: TxRow): IChargeList => ({
  tid: t.id,
  trDt: ymd(t.approved_at ?? t.created_at),
  trTm: hms(t.approved_at ?? t.created_at),
  mid: '',
  chrgTid: t.id,
  ordNo: t.order_no,
  chrgPmCd: CHARGE_CD[t.charge_method ?? ''] ?? '',
  chrgPmCdNm: CHARGE_NM[t.charge_method ?? ''] ?? '충전',
  ppMthdId: '',
  chrgAmt: t.amount,
  rmnAmt: t.balance_after ?? 0,
  chrgStCd: t.status === 'FAILED' ? '2' : '1',
  failMsg: failMsgOf(t),
});

const toRefund = (t: TxRow): IRefundList => ({
  rfndNo: t.order_no,
  rfndReqDt: ymd(t.created_at),
  rfndReqTm: hms(t.created_at),
  rfndStCd: t.status === 'FAILED' ? '2' : '1', // 1 출금 완료 | 2 실패
  failMsg: failMsgOf(t),
  rfndBankCd: t.bank_account?.bank_code ?? '',
  rfndAcntNo: t.bank_account?.account_no_masked ?? '',
  rfndAcntNm: t.bank_account?.holder_name ?? '',
  rfndAmt: t.amount,
  rmnAmt: t.balance_after ?? 0,
  rfndDt: ymd(t.approved_at ?? t.created_at),
  rfndTm: hms(t.approved_at ?? t.created_at),
});

/* 조회 종류 코드(getCd) → 실제로 가져올 거래 타입 */
const GET_CD_TYPES: Record<string, TxRow['type'][]> = {
  ALL: ['PAYMENT', 'CHARGE', 'REFUND'], // 모두
  USE: ['PAYMENT'], // 결제
  CHRG: ['CHARGE'], // 충전
  RFND: ['REFUND'], // 출금
};

/* DB 거래 한 건을 화면용 항목으로 바꾸고, 어떤 종류인지 getCd 를 붙인다 */
const toListItem = (t: TxRow): TransactionListItem =>
  t.type === 'PAYMENT'
    ? { ...toUse(t), getCd: 'USE' }
    : t.type === 'CHARGE'
      ? { ...toCharge(t), getCd: 'CHRG' }
      : { ...toRefund(t), getCd: 'RFND' };

/**
 * 선불 거래 조회
 * - getCd: ALL 모두 | USE 결제 | CHRG 충전 | RFND 출금
 * - trxStCds: 결제는 0 승인 | 1 취소, 충전·출금은 1 성공 | 2 실패, 9 는 모두
 * 실패(FAILED) 건도 목록에 넣는다. 모의 결제창에서 승인 거절·취소된 충전이 여기에 해당한다. 처리 중(PENDING)만 뺀다.
 */
export const loadTransactionList = async (
  getCd: string,
  trxStCds: string,
  frDt: string,
  toDt: string,
  stRow: number,
  cntRows: number,
) => {
  try {
    const types = GET_CD_TYPES[getCd] ?? GET_CD_TYPES.USE;
    let q = supabase
      .from('transactions')
      .select(TX_SELECT)
      .in('type', types)
      .neq('status', 'PENDING')
      .gte('created_at', fromYmd(frDt))
      .lte('created_at', fromYmd(toDt, true))
      .order('created_at', { ascending: false })
      .range(stRow, stRow + cntRows - 1);
    if (getCd === 'USE' && trxStCds === '0') q = q.eq('status', 'APPROVED');
    if (getCd === 'USE' && trxStCds === '1') q = q.in('status', ['CANCELED', 'PARTIALLY_CANCELED']);
    if ((getCd === 'CHRG' || getCd === 'RFND') && trxStCds === '1') q = q.eq('status', 'APPROVED');
    if ((getCd === 'CHRG' || getCd === 'RFND') && trxStCds === '2') q = q.eq('status', 'FAILED');

    const rows = unwrap(await q) as unknown as TxRow[];
    const listData = rows.map(toListItem);
    return ok({ listData });
  } catch (e) {
    return toFail(e);
  }
};

/* 최근 이력 조회 (20건) — 대시보드 */
export const getUseList = async () => {
  try {
    const mbUid = (await getData<string>('mbUid')) ?? '';
    const rows = unwrap(
      await supabase
        .from('transactions')
        .select(TX_SELECT)
        .neq('status', 'PENDING')
        .neq('status', 'FAILED')
        .order('created_at', { ascending: false })
        .limit(20),
    ) as unknown as TxRow[];

    const listData: ListDataItem[] = rows.map((t) => {
      const base = {
        trDt: ymd(t.created_at),
        toDt: ymd(t.created_at),
        mbUid,
        ppRmnAmt: String(t.balance_after ?? ''),
        mid: t.merchant?.mid,
      };
      if (t.type === 'CHARGE')
        return {
          ...base,
          transType: 'PPNP',
          goodsAmt: String(t.amount),
          coNm: CHARGE_NM[t.charge_method ?? ''] ?? '충전',
          chrgPmCd: CHARGE_CD[t.charge_method ?? ''],
        };
      if (t.type === 'REFUND')
        return {
          ...base,
          transType: 'RFND',
          rfndAmt: String(t.amount),
          coNm: '출금',
          rfndAcntNo: t.bank_account?.account_no_masked,
          rfndBankCd: t.bank_account?.bank_code,
        };
      const transType = t.status === 'CANCELED' ? 'CANCEL' : t.status === 'PARTIALLY_CANCELED' ? 'PARTCANCEL' : 'PAY';
      return {
        ...base,
        transType,
        goodsAmt: String(t.amount),
        ccAmt: t.canceled_amount ? String(t.canceled_amount) : undefined,
        coNm: t.merchant?.name ?? t.goods_name ?? '결제',
      };
    });
    return ok({ listData });
  } catch (e) {
    return toFail(e);
  }
};

/* ── 출금(환불) 계좌 ──────────────────────────────────────────── */
type AcntRow = {
  id: string;
  bank_code: string;
  account_no_masked: string;
  holder_name: string;
  is_primary: boolean;
  verified_at: string | null;
  purpose: string;
};

const primaryRefundAcnt = async () => {
  const rows = unwrap(
    await supabase
      .from('bank_accounts')
      .select('*')
      .eq('purpose', 'REFUND')
      .not('verified_at', 'is', null)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1),
  ) as AcntRow[];
  return rows[0] ?? null;
};

/* 환불 계좌 조회 — 없으면 rfndAcntNo: null (화면이 이 값으로 미등록을 판단) */
export const loadRefundAcnt = async () => {
  try {
    const mbUid = (await getData<string>('mbUid')) ?? '';
    const a = await primaryRefundAcnt();
    const acnt: IRefundAcnt = a
      ? {
          mbUid,
          rfndBankCd: a.bank_code,
          rfndBankCdNm: getBankName(a.bank_code),
          rfndAcntNo: a.account_no_masked,
          rfndAcntNm: a.holder_name,
        }
      : { mbUid, rfndBankCd: '', rfndBankCdNm: '', rfndAcntNo: null as unknown as string, rfndAcntNm: '' };
    return ok(acnt);
  } catch (e) {
    return toFail(e);
  }
};

/** 1원 인증 → 계좌 등록 사이에서 인증 id 를 넘기기 위해 잠시 기억한다. */
let lastVerification: string | null = null;

/* 계좌 1원 인증 요청 — 화면은 data.nonce 를 다음 화면에 넘긴다 */
export const requestAcntConfirm = async (bankCd: string, acntNo: string, usrNm: string) => {
  const res = await callFunction<{ verificationId: string; depositorName: string; demoCode: string }>(
    'account-verify/start',
    { bankCode: bankCd, accountNo: acntNo, holderName: usrNm },
  );
  if (res.resultCd !== '0000') return res;
  // 실제 서비스라면 통장 입금 내역에서 보는 값. 데모라 안내로 띄운다.
  Toast.show({
    type: 'success',
    text1: `1원이 입금되었습니다 · 입금자명 ${res.depositorName}`,
    text2: '입금자명의 숫자 3자리를 입력하세요',
  });
  return ok({ nonce: res.verificationId });
};

/* 계좌 1원 인증 확인 */
export const chkAcntConfirmNo = async (authNo: string, nonce: string) => {
  const res = await callFunction<{ verificationId: string }>('account-verify/confirm', {
    verificationId: nonce,
    code: authNo,
  });
  if (res.resultCd === '0000') lastVerification = nonce;
  return res;
};

const registerRefundAcnt = async () => {
  if (!lastVerification) return fail('ACCOUNT_NOT_VERIFIED');
  try {
    return fromRpc(
      unwrap(
        await supabase.rpc('register_bank_account', {
          p_verification_id: lastVerification,
          p_purpose: 'REFUND',
          p_set_primary: true,
        }),
      ) as { ok: boolean; code?: string },
    );
  } catch (e) {
    return toFail(e);
  }
};

/* 환불 계좌 등록 / 수정 (인증 직후 호출) */
export const enrollRefundAcnt = async (_rfndBankCd: string, _rfndAcntNo: string, _rfndAcntNm: string) =>
  registerRefundAcnt();
export const editRefundAcnt = async (_rfndBankCd: string, _rfndAcntNo: string, _rfndAcntNm: string) =>
  registerRefundAcnt();

/* 출금 계좌 등록 or 해지 (미사용 — 호환용) */
export const editTransferAcnt = async (_acntNo: string, _acntNm: string, _bankCd: string, type: string) => {
  if (type === '2') {
    const a = await primaryRefundAcnt();
    if (!a) return fail('BANK_ACCOUNT_NOT_FOUND');
    try {
      return fromRpc(unwrap(await supabase.rpc('remove_bank_account', { p_bank_account_id: a.id })) as { ok: boolean });
    } catch (e) {
      return toFail(e);
    }
  }
  return registerRefundAcnt();
};

export const changeMainAcnt = async (_acntNo: string, _bankCd: string) => ok();

/* 충전계좌 내역 조회 — 이 앱은 출금계좌를 충전 출금계좌로도 쓴다 */
export const loadTransferAcnt = async () => {
  try {
    const a = await primaryRefundAcnt();
    const listData: ITransferAcntList[] = a
      ? [{ mainAcntFlg: '1', acntNo: a.account_no_masked, bankCd: a.bank_code }]
      : [];
    return ok({ listData });
  } catch (e) {
    return toFail(e);
  }
};
export const loadChargeAcntList = loadTransferAcnt;

/* ── 충전 ─────────────────────────────────────────────────────── */
/* 선불 충전 URL 호출 — 화면은 data.returnUrl 을 웹뷰로 연다 */
export const requestChargeUrl = async (
  goodsAmt: number,
  chrgPmCd: ChargeTypeEnum,
  _acntNo?: string,
  _bankCd?: string,
) => {
  const method = chrgPmCd === ChargeTypeEnum.Virtual ? 'VIRTUAL_ACCOUNT' : 'BANK_TRANSFER';
  let bankAccountId: string | null = null;
  if (method === 'BANK_TRANSFER') {
    const a = await primaryRefundAcnt().catch(() => null);
    bankAccountId = a?.id ?? null;
  }
  const res = await callFunction<{ transactionId: string; checkoutUrl: string }>('charges', {
    amount: goodsAmt,
    method,
    bankAccountId,
    idempotencyKey: newIdempotencyKey(),
  });
  if (res.resultCd !== '0000') return res;
  return ok({ returnUrl: res.checkoutUrl, transactionId: res.transactionId });
};

/**
 * 출금(환불) 요청.
 * idempotencyKey: 화면이 진입 시 한 번 만들어 재시도에도 같은 값을 넘기는 중복 방지 키.
 * 서버(request_refund)는 같은 키의 거래가 이미 있으면 새로 처리하지 않고 그 결과를 돌려준다.
 */
export const requestRefundAcnt = async (refundAmt: string, usrPin: string, idempotencyKey: string) => {
  try {
    const mbUid = (await getData<string>('mbUid')) ?? '';
    const a = await primaryRefundAcnt();
    const data = fromRpc(
      unwrap(
        await supabase.rpc('request_refund', {
          p_amount: Number(refundAmt),
          p_pin: usrPin,
          p_bank_account_id: a?.id ?? null,
          p_idempotency_key: idempotencyKey || newIdempotencyKey(),
        }),
      ) as { ok: boolean; code?: string; transactionId: string; amount: number; balance: number },
    );
    if (data.resultCd !== '0000') return data;
    const suc: IWithdrawalSuc = {
      mbUid,
      refundAmt: String(data.amount),
      ppRmnAmt: String(data.balance),
      ppMthdId: '',
      rfndNo: data.transactionId ?? '',
    };
    return ok(suc);
  } catch (e) {
    return toFail(e);
  }
};

/* ── QR 결제 ──────────────────────────────────────────────────── */
type ResolveResult = {
  paymentRequestId: string;
  orderNo: string;
  goodsName: string;
  amount: number;
  supplyAmount: number;
  vat: number;
  expiresAt: string;
  reusable?: boolean;
  /** 이번 결제 시도의 멱등성 키 (서버 발급). PIN 재시도는 같은 키, 새 스캔은 새 키 */
  attemptKey?: string;
  merchant: { mid: string; name: string };
};

/* 결제 QR 조회 — otpCode 는 QR 토큰 */
export const chkPaymentQR = async (otpCode: string) => {
  try {
    const r = unwrap(await supabase.rpc('resolve_payment_request', { p_qr_token: otpCode.trim() })) as ResolveResult;
    const now = new Date().toISOString();
    const qr: IQRdata = {
      // authNo 자리에 멱등성 키를 실어 결제 화면까지 전달한다 (원본 화면 코드 변경 없이)
      authNo: r.attemptKey ?? `PAY-${r.paymentRequestId}`,
      coNm: r.merchant.name,
      goodsAmt: r.amount,
      goodsNm: r.goodsName,
      goodsSplAmt: r.supplyAmount,
      goodsSvsAmt: 0,
      goodsVat: r.vat,
      goodsTaxfreeAmt: 0,
      mid: r.merchant.mid,
      reqDt: ymd(now),
      reqTm: hms(now),
      reqStCd: '0',
      rid: otpCode.trim(),
      tid: r.paymentRequestId,
      expiresAt: r.expiresAt,
      reusable: r.reusable === true,
    };
    return ok(qr);
  } catch (e) {
    return toFail(e);
  }
};

/* QR 결제 — 직전 chkPinNum 에서 검증한 PIN 을 사용한다 */
export const paymentQR = async (
  attemptKey: string,
  rid: string,
  ordNo: string,
  mid: string,
  goodsNm: string,
  goodsAmt: string,
  _goodsSplAmt: string,
  _goodsVat: string,
  _goodsSvsAmt: string,
  _goodsTaxfreeAmt: string,
) => {
  const pin = takeVerifiedPin();
  if (!pin) return fail('PIN_REQUIRED', '간편 비밀번호 확인이 필요합니다.');
  try {
    const usrNm = (await getData<string>('usrNm')) ?? '';
    const data = fromRpc(
      unwrap(
        await supabase.rpc('execute_payment', {
          p_qr_token: rid,
          p_pin: pin,
          p_idempotency_key: attemptKey || `PAY-${rid}`,
        }),
      ) as {
        ok: boolean;
        code?: string;
        transactionId: string;
        amount: number;
        balance: number;
        approvedAt: string;
      },
    );
    if (data.resultCd !== '0000') return data;
    const approved = data.approvedAt ?? new Date().toISOString();
    const merchant = unwrap(await supabase.from('merchants').select('name').eq('mid', mid).maybeSingle()) as {
      name: string;
    } | null;
    const suc: IPaySuccess = {
      appNo: (data.transactionId ?? '').slice(-8).toUpperCase(),
      ediDate: ymdhms(approved),
      goodsAmt: String(data.amount ?? goodsAmt),
      goodsNm,
      mbsReserved: '',
      mid,
      ordNm: usrNm,
      ordNo,
      pmCd: 'PP',
      ppRmnAmt: String(data.balance),
      spmCd: '',
      tid: data.transactionId ?? '',
      trDt: ymd(approved),
      trTm: hms(approved),
      trxStCd: '0',
      coNm: merchant?.name ?? '',
    };
    return ok(suc);
  } catch (e) {
    return toFail(e);
  }
};

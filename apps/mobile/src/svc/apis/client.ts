/**
 * Supabase 클라이언트와 API 어댑터 공통 헬퍼.
 *
 * 화면 코드는 { resultCd, resultMsg, ...data } 형태의 응답을 기대한다.
 * 어댑터(usrApi / commonApi / paymentApi)는 Supabase 호출 결과를 그 모양으로 바꿔 돌려준다.
 */
import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';
import { secureStorage } from '@storages/asyncStorage';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY 가 설정되지 않았습니다. apps/mobile/.env 확인',
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

/** 아이디 → 로그인 이메일 (서버는 이메일만 알고, 화면은 아이디만 다룬다) */
export const emailFor = (mbUid: string) => `${mbUid.trim().toLowerCase()}@demo.sohpay.app`;

export const hasSession = async () => !!(await supabase.auth.getSession()).data.session;

/* ── 응답 모양 ─────────────────────────────────────────────────── */
// 원본은 axios 의 response.data(any) 를 그대로 돌려줬고 화면도 그 전제로 짜여 있다.
// 어댑터도 같은 계약을 지키기 위해 any 로 돌려준다. 내부에서는 T 로 모양을 맞춘다.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiResult<T = {}> = any;
type Result<T> = { resultCd: string; resultMsg: string } & Partial<T>;

export const ok = <T extends object>(data?: T): ApiResult<T> =>
  ({ resultCd: '0000', resultMsg: '정상 처리되었습니다.', ...(data ?? ({} as T)) }) as Result<T>;

/** 서버 오류 코드 → 화면 문구 */
const MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: '로그인이 필요합니다.',
  MEMBER_NOT_ACTIVE: '이용할 수 없는 계정입니다.',
  ALREADY_REGISTERED: '이미 가입된 계정입니다.',
  ALREADY_JOINED_MEMBER: '이미 가입 이력이 있는 사용자입니다.',
  MB_UID_TAKEN: '이미 사용 중인 아이디입니다.',
  INVALID_MB_UID: '아이디는 영문 소문자·숫자 6~20자로 입력해 주세요.',
  INVALID_PIN_FORMAT: '간편 비밀번호는 숫자 6자리입니다.',
  PIN_TOO_SIMPLE: '같은 숫자를 반복한 비밀번호는 사용할 수 없습니다.',
  PIN_MISMATCH: '간편 비밀번호가 일치하지 않습니다.',
  PIN_LOCKED: '간편 비밀번호를 5회 잘못 입력해 10분간 잠겼습니다.',
  IDENTITY_NOT_VERIFIED: '본인인증을 먼저 완료해 주세요.',
  IDENTITY_EXPIRED: '본인인증이 만료되었습니다. 다시 진행해 주세요.',
  IDENTITY_NAME_MISMATCH: '본인 인증 정보가 입력하신 이름과 일치하지 않습니다.',
  MEMBER_NOT_FOUND: '일치하는 가입자가 존재하지 않습니다.',
  RESET_PASSWORD_FAILED: '임시 비밀번호 발급에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  TEMP_PASSWORD: '임시 비밀번호입니다. 비밀번호를 변경해 주세요.',
  INVALID_AMOUNT: '금액을 확인해 주세요.',
  MAX_BALANCE_EXCEEDED: '보유 한도(200만 원)를 초과합니다.',
  INSUFFICIENT_BALANCE: '잔액이 부족합니다.',
  PER_TX_LIMIT_EXCEEDED: '1회 결제 한도(50만 원)를 초과했습니다.',
  DAILY_LIMIT_EXCEEDED: '1일 결제 한도(200만 원)를 초과했습니다.',
  REQUEST_NOT_FOUND: '유효하지 않은 결제 코드입니다.',
  REQUEST_ALREADY_USED: '이미 결제된 코드입니다.',
  REQUEST_EXPIRED: '결제 코드가 만료되었습니다. 가맹점에 다시 요청해 주세요.',
  TRANSACTION_NOT_FOUND: '거래를 찾을 수 없습니다.',
  NOT_CANCELABLE: '취소할 수 없는 거래입니다.',
  REFUND_ACCOUNT_NOT_REGISTERED: '출금 계좌를 먼저 등록해 주세요.',
  BANK_ACCOUNT_NOT_FOUND: '계좌를 찾을 수 없습니다.',
  ACCOUNT_NOT_VERIFIED: '계좌 인증이 완료되지 않았습니다.',
  UNSUPPORTED_BANK: '지원하지 않는 은행입니다.',
  INVALID_ACCOUNT_NO: '계좌번호를 확인해 주세요.',
  INVALID_HOLDER_NAME: '예금주명을 확인해 주세요.',
  CODE_MISMATCH: '인증번호가 일치하지 않습니다.',
  TOO_MANY_ATTEMPTS: '인증 시도 횟수를 초과했습니다. 처음부터 다시 진행해 주세요.',
  TOO_MANY_REQUESTS: '요청 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요.',
  VERIFICATION_EXPIRED: '인증 유효시간이 만료 되었습니다.',
  VERIFICATION_NOT_FOUND: '인증 정보를 찾을 수 없습니다.',
  BALANCE_REMAINING: '잔액이 남아 있으면 탈퇴할 수 없습니다. 먼저 출금해 주세요.',
  invalid_credentials: '아이디 또는 비밀번호가 올바르지 않습니다.',
  'Invalid login credentials': '아이디 또는 비밀번호가 올바르지 않습니다.',
  user_already_exists: '이미 가입된 아이디입니다.',
  'User already registered': '이미 가입된 아이디입니다.',
  weak_password: '비밀번호는 8자 이상으로 설정해 주세요.',
};

/** 원본 앱이 분기에 쓰던 특수 코드는 유지한다. 그 외는 코드 문자열을 그대로 resultCd 로 돌려준다. */
const LEGACY_CODES: Record<string, string> = {
  PIN_LOCKED: '9004', // 핀 5회 초과
  TEMP_PASSWORD: '9003', // 임시 비밀번호로 로그인 → 비밀번호 변경 화면으로
};

export const fail = (code: string, msg?: string): ApiResult =>
  ({
    resultCd: LEGACY_CODES[code] ?? code ?? '9999',
    resultMsg: msg ?? MESSAGES[code] ?? '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  }) as Result<{}>;

/** supabase { data, error } → 값. 실패는 throw. */
export function unwrap<T>(res: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (res.error) {
    const e = new Error(res.error.message) as Error & { code?: string };
    e.code = res.error.code && MESSAGES[res.error.code] ? res.error.code : res.error.message;
    throw e;
  }
  return res.data as T;
}

/** throw 된 오류 → ApiResult */
export const toFail = (e: unknown): ApiResult => {
  const code = (e as { code?: string })?.code ?? (e as Error)?.message ?? '9999';
  return fail(code);
};

/** RPC 가 ok:false 를 값으로 돌려주는 경우(PIN 계열) */
export const fromRpc = <T extends { ok?: boolean; code?: string }>(data: T): ApiResult<T> => {
  if (data && data.ok === false) return fail(data.code ?? '9999') as ApiResult<T>;
  return ok(data);
};

/** Edge Function 호출 */
export async function callFunction<T>(path: string, body: unknown, auth = true): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY };
  if (auth) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return fail('UNAUTHENTICATED');
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  try {
    const res = await fetch(`${FUNCTIONS_URL}/${path}`, { method: 'POST', headers, body: JSON.stringify(body ?? {}) });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: string } & T;
    if (!res.ok || json.ok === false) return fail(json.code ?? `HTTP_${res.status}`);
    return ok(json);
  } catch {
    return fail('NETWORK', '네트워크 연결을 확인해 주세요.');
  }
}

/* ── 날짜 유틸 (원본 API 가 yyyyMMdd / HHmmss 문자열을 쓴다) ────── */
const pad = (n: number) => String(n).padStart(2, '0');

export const ymd = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
};
export const hms = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};
export const ymdhms = (iso: string) => ymd(iso) + hms(iso);

/** 'yyyyMMdd' → 그 날 00:00 (로컬) ISO */
export const fromYmd = (s: string, endOfDay = false) => {
  const y = Number(s.slice(0, 4)),
    m = Number(s.slice(4, 6)) - 1,
    d = Number(s.slice(6, 8));
  const dt = endOfDay ? new Date(y, m, d, 23, 59, 59, 999) : new Date(y, m, d, 0, 0, 0, 0);
  return dt.toISOString();
};

export const newIdempotencyKey = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

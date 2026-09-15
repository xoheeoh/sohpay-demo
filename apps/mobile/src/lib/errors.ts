/**
 * 서버 오류 코드 → 사용자 문구.
 * 서버는 코드만 보내고, 문구는 전부 여기서 정한다. (다국어·문구 수정이 클라이언트에서 끝난다)
 */
const MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: '로그인이 필요합니다.',
  MEMBER_NOT_ACTIVE: '이용할 수 없는 계정입니다.',
  ALREADY_REGISTERED: '이미 가입된 계정입니다.',
  ALREADY_JOINED_MEMBER: '이미 가입된 사용자입니다. 로그인해 주세요.',
  MB_UID_TAKEN: '이미 사용 중인 아이디입니다.',
  INVALID_MB_UID: '아이디는 영문 소문자·숫자 6~20자로 입력해 주세요.',
  INVALID_PIN_FORMAT: '결제 비밀번호는 숫자 6자리입니다.',
  PIN_TOO_SIMPLE: '같은 숫자를 반복한 비밀번호는 사용할 수 없습니다.',
  PIN_MISMATCH: '결제 비밀번호가 일치하지 않습니다.',
  PIN_LOCKED: '비밀번호를 5회 잘못 입력해 10분간 잠겼습니다.',
  IDENTITY_NOT_VERIFIED: '본인인증을 먼저 완료해 주세요.',
  IDENTITY_EXPIRED: '본인인증이 만료되었습니다. 다시 진행해 주세요.',

  INVALID_AMOUNT: '금액을 확인해 주세요.',
  MAX_BALANCE_EXCEEDED: '보유 한도(200만원)를 초과합니다.',
  INSUFFICIENT_BALANCE: '잔액이 부족합니다.',
  PER_TX_LIMIT_EXCEEDED: '1회 결제 한도(50만원)를 초과했습니다.',
  DAILY_LIMIT_EXCEEDED: '1일 결제 한도(200만원)를 초과했습니다.',

  REQUEST_NOT_FOUND: '유효하지 않은 결제 코드입니다.',
  REQUEST_ALREADY_USED: '이미 결제된 코드입니다.',
  REQUEST_EXPIRED: '결제 코드가 만료되었습니다. 가맹점에 다시 요청해 주세요.',
  TRANSACTION_NOT_FOUND: '거래를 찾을 수 없습니다.',
  NOT_CANCELABLE: '취소할 수 없는 거래입니다.',
  INVALID_CANCEL_AMOUNT: '취소 가능한 금액을 초과했습니다.',

  REFUND_ACCOUNT_NOT_REGISTERED: '환불 계좌를 먼저 등록해 주세요.',
  BANK_ACCOUNT_NOT_FOUND: '계좌를 찾을 수 없습니다.',
  ACCOUNT_NOT_VERIFIED: '계좌 인증이 완료되지 않았습니다.',
  UNSUPPORTED_BANK: '지원하지 않는 은행입니다.',
  INVALID_ACCOUNT_NO: '계좌번호를 확인해 주세요.',
  INVALID_HOLDER_NAME: '예금주명을 확인해 주세요.',
  CODE_MISMATCH: '인증번호가 일치하지 않습니다.',
  TOO_MANY_ATTEMPTS: '인증 시도 횟수를 초과했습니다. 처음부터 다시 진행해 주세요.',
  TOO_MANY_REQUESTS: '잠시 후 다시 시도해 주세요.',
  VERIFICATION_EXPIRED: '인증 시간이 지났습니다. 다시 요청해 주세요.',
  VERIFICATION_NOT_FOUND: '인증 정보를 찾을 수 없습니다.',
  BALANCE_REMAINING: '잔액이 남아 있으면 탈퇴할 수 없습니다. 먼저 환불해 주세요.',

  invalid_credentials: '아이디 또는 비밀번호가 올바르지 않습니다.',
  'Invalid login credentials': '아이디 또는 비밀번호가 올바르지 않습니다.',
  user_already_exists: '이미 가입된 아이디입니다.',
  'User already registered': '이미 가입된 아이디입니다.',
  weak_password: '비밀번호는 8자 이상으로 설정해 주세요.',
  'Network request failed': '네트워크 연결을 확인해 주세요.',
  'Failed to fetch': '네트워크 연결을 확인해 주세요.',
};

export class AppError extends Error {
  constructor(public code: string, public detail?: unknown) {
    super(MESSAGES[code] ?? '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    this.name = 'AppError';
  }
}

export function messageOf(err: unknown): string {
  if (err instanceof AppError) return err.message;
  if (err && typeof err === 'object') {
    const code = (err as { code?: string }).code;
    const msg = (err as { message?: string }).message;
    if (code && MESSAGES[code]) return MESSAGES[code];
    if (msg && MESSAGES[msg]) return MESSAGES[msg];
  }
  return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

/** supabase 응답 { data, error } 를 값 또는 AppError 로 바꾼다. */
export function unwrap<T>(res: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (res.error) throw new AppError(res.error.code && MESSAGES[res.error.code] ? res.error.code : res.error.message, res.error);
  return res.data as T;
}

/** ok:false 를 돌려주는 RPC(PIN 계열) 결과를 검사한다. */
export function assertOk<T extends { ok?: boolean; code?: string }>(data: T): T {
  if (data && data.ok === false) throw new AppError(data.code ?? 'UNKNOWN', data);
  return data;
}

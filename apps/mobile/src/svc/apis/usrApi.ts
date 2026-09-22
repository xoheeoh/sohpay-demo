/**
 * 회원 API 어댑터.
 * 화면은 원본과 같은 함수 이름·응답 모양({ resultCd, resultMsg, ... })을 그대로 쓴다.
 * 내부만 Supabase Auth / RPC / Edge Function 호출로 바뀌었다.
 */
import { IUserData } from '@typ/userType';
import { getData } from '@storages/asyncStorage';
import { callFunction, emailFor, fail, fromRpc, ok, supabase, toFail, unwrap } from './client';

/* ── 로그인 ───────────────────────────────────────────────────── */
export const memberLogin = async (mbUid: string, pwd: string) => {
  const res = await supabase.auth.signInWithPassword({ email: emailFor(mbUid), password: pwd });
  if (res.error) return fail(res.error.code ?? res.error.message);

  // 비밀번호 찾기로 받은 임시 비밀번호면 로그인시키지 않고 비밀번호 변경으로 보낸다 (원본 코드 9003)
  if (res.data.user?.user_metadata?.temp_password) {
    await supabase.auth.signOut();
    return fail('TEMP_PASSWORD');
  }

  const { data: profile } = await supabase.from('profiles').select('status').maybeSingle();
  if (profile?.status === 'WITHDRAWN') {
    await supabase.auth.signOut();
    return fail('MEMBER_NOT_ACTIVE');
  }
  return ok({ at: res.data.session?.access_token ?? '', rt: res.data.session?.refresh_token ?? '' });
};

/* ── 비밀번호 규칙 (원본은 서버 검증. 여기서는 같은 규칙을 클라이언트에서 적용) ── */
const PWD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,20}$/;

export const validationPwd = async (
  pwd: string,
  usrId: string,
  _memberAuthKey?: string,
  brthDt?: string,
  hpNo?: string,
) => {
  if (!PWD_RULE.test(pwd)) return fail('PWD_RULE', '비밀번호는 영문, 숫자, 특수문자를 포함한 8~20자로 설정해 주세요.');
  if (usrId && pwd.toLowerCase().includes(usrId.toLowerCase()))
    return fail('PWD_RULE', '아이디가 포함된 비밀번호는 사용할 수 없습니다.');
  if (brthDt && pwd.includes(brthDt.slice(-6)))
    return fail('PWD_RULE', '생년월일이 포함된 비밀번호는 사용할 수 없습니다.');
  if (hpNo && pwd.includes(hpNo.replace(/\D/g, '').slice(-4)))
    return fail('PWD_RULE', '휴대폰 번호가 포함된 비밀번호는 사용할 수 없습니다.');
  if (/(.)\1\1/.test(pwd)) return fail('PWD_RULE', '같은 문자를 3번 이상 연속해서 사용할 수 없습니다.');
  return ok();
};

export const changeTempPwd = async (uid: string, tempPwd: string, newPwd: string) => {
  // memberLogin 은 임시 비밀번호를 9003 으로 막으므로 여기서는 직접 로그인한다
  const login = await supabase.auth.signInWithPassword({ email: emailFor(uid), password: tempPwd });
  if (login.error) return fail(login.error.code ?? login.error.message);

  // 새 비밀번호로 바꾸고 임시 비밀번호 표시를 끈다. 변경 후에는 새 비밀번호로 다시 로그인하게 한다.
  const res = await supabase.auth.updateUser({ password: newPwd, data: { temp_password: false } });
  await supabase.auth.signOut();
  if (res.error) return fail(res.error.code ?? res.error.message);
  return ok();
};

/* ── 토큰 재발급: Supabase SDK 가 자동 처리. 호환용으로만 남겨둔다. ── */
export const reissuedToken = async () => {
  const { data } = await supabase.auth.refreshSession();
  return data.session ? { at: data.session.access_token, rt: data.session.refresh_token } : null;
};

/* ── 아이디/비밀번호 찾기 ───────────────────────────────────────
 * 본인인증(certData = verificationId)을 마친 뒤에만 가능하다.
 * 서버(account-recovery)가 인증된 이름·입력한 이름·회원 이름이 같은지 대조하고, 쓴 인증은 소진시킨다.
 */
export const findUserId = async (email: string, usrNm: string) => {
  const verificationId = await getData<string>('certData');
  if (!verificationId) return fail('IDENTITY_NOT_VERIFIED');

  const res = await callFunction<{ mbUid: string; joinedAt: string }>(
    'account-recovery/find-id',
    { email, name: usrNm, verificationId },
    false,
  );
  if (res.resultCd !== '0000') return res;
  return ok({ mbUid: res.mbUid, regDnt: res.joinedAt });
};

/** 임시 비밀번호 발급. 실제 서비스는 이메일로 보내지만 데모는 응답으로 받아 화면에 보여준다. */
export const findUserPw = async (email: string, mbUid: string, usrNm: string) => {
  const verificationId = await getData<string>('certData');
  if (!verificationId) return fail('IDENTITY_NOT_VERIFIED');

  const res = await callFunction<{ mbUid: string; tempPassword: string }>(
    'account-recovery/reset-password',
    { email, mbUid, name: usrNm, verificationId },
    false,
  );
  if (res.resultCd !== '0000') return res;
  return ok({ mbUid: res.mbUid, tempPwd: res.tempPassword });
};

/* ── 본인인증 ─────────────────────────────────────────────────── */
/** 인증 화면 URL 발급. 화면은 data.returnUrl 을 웹뷰로 연다. */
export const requestCertifyUrl = async (identCd: '01' | '02' | '03') => {
  const method = identCd === '02' ? 'SIMPLE' : identCd === '03' ? 'IPIN' : 'MOBILE';
  const res = await callFunction<{ verificationId: string; checkoutUrl: string }>('identity/start', { method }, false);
  if (res.resultCd !== '0000') return res;
  return ok({ returnUrl: res.checkoutUrl, verificationId: res.verificationId });
};

/**
 * 인증 결과 확정. 웹뷰가 postMessage 로 넘긴 certData(=verificationId) 를 서버에서 확인한다.
 * 입력한 이름과 인증 이름이 다르면 원본과 같은 코드('9999' + '입력하신 이름…')로 돌려준다.
 */
export const handleCertifyResult = async (usrNm: string, msg: string) => {
  const res = await callFunction<{ name: string; birthDate: string; phone: string; memberAuthKey: string }>(
    'identity/result',
    { verificationId: msg },
    false,
  );
  if (res.resultCd !== '0000') return res;
  if (res.name && usrNm && res.name.trim() !== usrNm.trim()) {
    return fail('9999', '본인 인증 정보가 입력하신 이름과 일치하지 않습니다.');
  }
  return ok({
    memberAuthKey: res.memberAuthKey,
    verificationId: msg,
    brthDt: (res.birthDate ?? '').replace(/-/g, ''),
    hpNo: res.phone,
  });
};

/* ── 가입 ─────────────────────────────────────────────────────── */
/** 서버(complete_signup)가 받아주는 아이디 규칙. 여기서 먼저 걸러야 "이미 있는 아이디"와 "규칙 위반"을 구분해 안내할 수 있다. */
const MB_UID_RULE = /^[a-z0-9_]{6,20}$/;

/** 아이디 사용 가능 여부. 사용 가능 → 0000, 이미 있음 → MB_UID_TAKEN, 규칙 위반 → INVALID_MB_UID */
export const chkDuplicateUid = async (id: string, _nonce: string) => {
  if (!MB_UID_RULE.test(id)) return fail('INVALID_MB_UID');
  try {
    const data = unwrap(await supabase.rpc('is_mb_uid_available', { p_mb_uid: id })) as { available: boolean };
    return data.available ? ok() : fail('MB_UID_TAKEN');
  } catch (e) {
    return toFail(e);
  }
};

/** 같은 사람(본인인증 키)이 이미 가입했는지. 가입 시 서버가 다시 검사하므로 여기서는 통과시킨다. */
export const chkMemberAuthKey = async (_memberAuthKey: string) => ok();

const PIN_SIMPLE = /^(\d)\1{5}$/;
const PIN_SEQ = /^(012345|123456|234567|345678|456789|567890|987654|876543|765432|654321|543210)$/;

export const validationPinNo = async (usrPin: string, _memberAuthKey?: string, brthDt?: string, hpNo?: string) => {
  if (!/^\d{6}$/.test(usrPin)) return fail('INVALID_PIN_FORMAT');
  if (PIN_SIMPLE.test(usrPin)) return fail('PIN_TOO_SIMPLE', '같은 숫자를 반복한 비밀번호는 사용할 수 없습니다.');
  if (PIN_SEQ.test(usrPin)) return fail('PIN_TOO_SIMPLE', '연속된 숫자는 비밀번호로 사용할 수 없습니다.');
  if (brthDt && brthDt.length >= 6 && usrPin === brthDt.slice(-6))
    return fail('PIN_TOO_SIMPLE', '생년월일은 비밀번호로 사용할 수 없습니다.');
  if (hpNo && hpNo.replace(/\D/g, '').endsWith(usrPin))
    return fail('PIN_TOO_SIMPLE', '휴대폰 번호 뒷자리는 비밀번호로 사용할 수 없습니다.');
  return ok();
};

/** 회원가입 확정: Auth 계정 생성 → 프로필·지갑 생성 */
export const joinService = async (userData: IUserData) => {
  const res = await supabase.auth.signUp({ email: emailFor(userData.mbUid), password: userData.pwd });
  if (res.error) return fail(res.error.code ?? res.error.message);
  if (!res.data.session) return fail('UNAUTHENTICATED');

  try {
    unwrap(
      await supabase.rpc('complete_signup', {
        p_mb_uid: userData.mbUid.trim().toLowerCase(),
        p_name: userData.usrNm,
        p_pin: userData.usrPin,
        p_verification_id: userData.nonce || null, // 가입 플로우에서 nonce 자리에 verificationId 를 담아 둔다
        p_marketing_opt_in: !!userData.optionAgree,
      }),
    );
  } catch (e) {
    await supabase.auth.signOut();
    return toFail(e);
  }

  // complete_signup 은 프로필 이메일을 로그인용 주소(아이디@demo.sohpay.app)로 채운다.
  // 가입 화면에서 입력받은 실제 이메일로 바꿔 둔다. 아이디 찾기가 이 이메일로 회원을 찾는다.
  // 계정은 이미 만들어졌으므로 여기서 실패해도 가입 자체는 성공으로 본다.
  if (userData.email) {
    const { error } = await supabase.from('profiles').update({ email: userData.email.trim().toLowerCase() }).select('id').single();
    if (error) console.warn('가입 이메일 저장 실패:', error.message);
  }

  // 가입 완료 화면은 로그인 상태를 가정하지 않는다(다시 로그인). 세션은 정리한다.
  await supabase.auth.signOut();
  return ok({ mbUid: userData.mbUid });
};

/* ── PIN ──────────────────────────────────────────────────────── */
/** 결제·출금 화면은 PIN 검증 → 실행을 두 번의 호출로 나눈다. 검증한 PIN 을 다음 호출에 넘기기 위해 잠시 기억한다. */
let verifiedPin: string | null = null;
export const takeVerifiedPin = () => {
  const p = verifiedPin;
  verifiedPin = null;
  return p;
};

export const chkPinNum = async (usrPin: string, _transType: 'PAY' | 'CANCEL' | 'PARTCANCEL' | 'RFND' | 'PPNP') => {
  try {
    const res = fromRpc(unwrap(await supabase.rpc('verify_pin', { p_pin: usrPin })) as { ok: boolean; code?: string });
    if (res.resultCd === '0000') verifiedPin = usrPin;
    return res;
  } catch (e) {
    return toFail(e);
  }
};

/* ── 비밀번호 확인 / 탈퇴 / 정보 수정 ────────────────────────── */
export const checkUsrPwd = async (pwd: string) => {
  const mbUid = await getData<string>('mbUid');
  if (!mbUid) return fail('UNAUTHENTICATED');
  const res = await supabase.auth.signInWithPassword({ email: emailFor(mbUid), password: pwd });
  return res.error ? fail('PWD_MISMATCH', '비밀번호가 일치하지 않습니다.') : ok();
};

export const withdrawalUser = async (pwd: string) => {
  const chk = await checkUsrPwd(pwd);
  if (chk.resultCd !== '0000') return chk;
  try {
    return fromRpc(unwrap(await supabase.rpc('withdraw_member_confirmed')) as { ok: boolean; code?: string });
  } catch (e) {
    return toFail(e);
  }
};

export const editUsrProfile = async (pwd: string, email?: string, newPwd?: string) => {
  const chk = await checkUsrPwd(pwd);
  if (chk.resultCd !== '0000') return chk;
  try {
    if (newPwd) {
      const res = await supabase.auth.updateUser({ password: newPwd });
      if (res.error) return fail(res.error.code ?? res.error.message);
    }
    if (email) unwrap(await supabase.from('profiles').update({ email }).select('id').single());
    return ok();
  } catch (e) {
    return toFail(e);
  }
};

export const editPinNo = async (pwd: string, newUsrPin: string) => {
  const chk = await checkUsrPwd(pwd);
  if (chk.resultCd !== '0000') return chk;
  try {
    return fromRpc(unwrap(await supabase.rpc('set_pin', { p_new_pin: newUsrPin })) as { ok: boolean; code?: string });
  } catch (e) {
    return toFail(e);
  }
};

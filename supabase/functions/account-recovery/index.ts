/**
 * 아이디 찾기 / 비밀번호 찾기 (로그인 전 화면).
 *
 *   POST /functions/v1/account-recovery/find-id
 *        { email, name, verificationId }          → { mbUid, joinedAt }
 *   POST /functions/v1/account-recovery/reset-password
 *        { email, mbUid, name, verificationId }   → { mbUid, tempPassword }
 *
 * 로그인 전이라 verify_jwt = false 로 둔다. 대신
 *   1) 방금 마친 본인인증(verificationId 가 VERIFIED, 10분 이내)이 있어야 하고
 *   2) 인증된 이름 = 입력한 이름 = 회원 이름 이어야 하며
 *   3) 한 번 쓴 인증은 CONSUMED 로 바꿔 같은 인증으로 반복 조회하지 못하게 한다.
 *
 * 실제 서비스라면 임시 비밀번호를 이메일로 보내지만, 데모는 메일 발송이 없어 응답으로 돌려주고 앱 화면에 표시한다.
 * 임시 비밀번호로 로그인하면 앱이 먼저 비밀번호를 바꾸게 하도록 auth 사용자의 user_metadata.temp_password 를 켠다.
 */
import { asService } from '../_shared/clients.ts';
import { json, fail, preflight } from '../_shared/http.ts';

/** created_at(ISO) → 'YYYYMMDDHHmmss' (한국 시간). 앱의 joinDnt/regDnt 형식과 같다. */
function yyyymmddhhmmss(iso: string) {
  return new Date(iso).toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).replace(/\D/g, '').slice(0, 14);
}

/**
 * 앱의 비밀번호 규칙(영문+숫자+특수문자, 8~20자, 같은 문자 3연속 금지)을 만족하는 임시 비밀번호.
 * 헷갈리는 글자(0/O, 1/l/I)는 뺐다. 예) Kd4829!qz
 */
function makeTempPassword() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const pick = (pool: string, n: number) => {
    const buf = crypto.getRandomValues(new Uint8Array(n));
    return [...buf].map((b) => pool[b % pool.length]).join('');
  };
  for (;;) {
    const pw = `${pick(letters, 2)}${pick(digits, 4)}!${pick(letters, 2)}`;
    if (!/(.)\1\1/.test(pw)) return pw;
  }
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  const step = new URL(req.url).pathname.split('/').filter(Boolean).pop();
  if (req.method !== 'POST' || (step !== 'find-id' && step !== 'reset-password')) return fail('NOT_FOUND', 404);

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '').trim().toLowerCase();
  const name = String(body.name ?? '').trim();
  const verificationId = String(body.verificationId ?? '').trim();
  const mbUid = String(body.mbUid ?? '').trim().toLowerCase();
  if (!email || !name || !verificationId) return fail('INVALID_BODY');
  if (step === 'reset-password' && !mbUid) return fail('INVALID_BODY');

  const supabase = asService();

  // ── 1) 본인인증 확인 ────────────────────────────────────────────────
  const { data: verification } = await supabase
    .from('identity_verifications')
    .select('status, name, expires_at')
    .eq('id', verificationId)
    .maybeSingle();

  if (!verification || verification.status !== 'VERIFIED') return fail('IDENTITY_NOT_VERIFIED');
  if (new Date(verification.expires_at) <= new Date()) return fail('IDENTITY_EXPIRED');
  if ((verification.name ?? '').trim() !== name) return fail('IDENTITY_NAME_MISMATCH');

  // ── 2) 회원 조회 (이메일 + 이름, 비밀번호 찾기는 아이디까지) ──────────
  let query = supabase
    .from('profiles')
    .select('id, mb_uid, created_at')
    .eq('status', 'ACTIVE')
    .eq('email', email)
    .eq('name', name);
  if (step === 'reset-password') query = query.eq('mb_uid', mbUid);

  const { data: profile } = await query.maybeSingle();
  // 회원이 없으면 인증은 남겨 둔다 → 10분 안에 이메일을 고쳐 다시 시도할 수 있다
  if (!profile) return fail('MEMBER_NOT_FOUND', 404);

  // ── 3) 인증 소진 ───────────────────────────────────────────────────
  await supabase.from('identity_verifications').update({ status: 'CONSUMED' }).eq('id', verificationId);

  if (step === 'find-id') {
    return json({ ok: true, mbUid: profile.mb_uid, joinedAt: yyyymmddhhmmss(profile.created_at) });
  }

  // ── 4) 임시 비밀번호 발급 ──────────────────────────────────────────
  const tempPassword = makeTempPassword();
  const { error } = await supabase.auth.admin.updateUserById(profile.id, {
    password: tempPassword,
    user_metadata: { temp_password: true },
  });
  if (error) return fail('RESET_PASSWORD_FAILED', 500);

  return json({ ok: true, mbUid: profile.mb_uid, tempPassword });
});

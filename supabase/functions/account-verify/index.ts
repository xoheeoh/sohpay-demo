/**
 * 계좌 1원 인증 (모의).
 *
 *   POST /functions/v1/account-verify/start    { bankCode, accountNo, holderName }
 *        → { verificationId, depositorName, demoCode }
 *   POST /functions/v1/account-verify/confirm  { verificationId, code }
 *        → { ok: true }
 *
 * 실제 1원 인증은 계좌로 1원을 보내면서 입금자명 끝에 인증번호를 붙인다.
 * 여기서는 그 인증번호를 응답으로 같이 돌려준다(데모라서).
 *
 * 금융결제원 오픈뱅킹 테스트베드로 갈아탈 지점이 여기다.
 *   · start   → 출금이체(1원) API 호출
 *   · confirm → 사용자가 통장에서 확인한 번호와 대조
 * 계약(요청/응답 모양)은 그대로 두고 이 파일 안쪽만 바꾸면 앱은 손댈 필요가 없다.
 */
import { asCaller, asService } from '../_shared/clients.ts';
import { json, fail, preflight } from '../_shared/http.ts';

const BANK_NAMES: Record<string, string> = {
  '004': 'KB국민', '011': 'NH농협', '020': '우리', '081': '하나',
  '088': '신한', '003': 'IBK기업', '007': 'SH수협', '002': 'KDB산업',
  '090': '카카오뱅크', '092': '토스뱅크', '089': '케이뱅크',
};

async function fingerprint(bankCode: string, accountNo: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${bankCode}:${accountNo}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function mask(accountNo: string) {
  if (accountNo.length <= 6) return '*'.repeat(accountNo.length);
  return `${accountNo.slice(0, 3)}${'*'.repeat(accountNo.length - 7)}${accountNo.slice(-4)}`;
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return fail('METHOD_NOT_ALLOWED', 405);

  const step = new URL(req.url).pathname.split('/').filter(Boolean).pop();

  // 호출자 신원은 사용자 토큰으로 확인하고, 쓰기만 서비스 롤로 한다.
  const { data: auth } = await asCaller(req).auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return fail('UNAUTHENTICATED', 401);

  const body = await req.json().catch(() => ({}));
  const supabase = asService();

  // ── 1원 입금 요청 ──────────────────────────────────────────────────
  if (step === 'start') {
    const bankCode = String(body.bankCode ?? '');
    const accountNo = String(body.accountNo ?? '').replace(/\D/g, '');
    const holderName = String(body.holderName ?? '').trim();

    if (!BANK_NAMES[bankCode]) return fail('UNSUPPORTED_BANK');
    if (accountNo.length < 10 || accountNo.length > 16) return fail('INVALID_ACCOUNT_NO');
    if (holderName.length < 2) return fail('INVALID_HOLDER_NAME');

    // 본인 명의 확인: 예금주명이 회원 이름과 다르면 거절한다 (출금 계좌는 돈이 나가는 곳). 공백 차이는 무시한다.
    // 앱도 같은 검사를 먼저 하지만, 앱을 우회한 요청까지 막기 위해 서버에서 한 번 더 본다.
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', userId).maybeSingle();
    const normalize = (s: string) => s.replace(/\s+/g, '');
    if (!profile || normalize(profile.name) !== normalize(holderName)) return fail('HOLDER_NAME_MISMATCH');

    // 짧은 시간에 반복 요청하는 것을 막는다.
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count } = await supabase
      .from('account_verifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since);

    if ((count ?? 0) >= 3) return fail('TOO_MANY_REQUESTS', 429);

    const code = String(Math.floor(100 + Math.random() * 900));

    const { data, error } = await supabase
      .from('account_verifications')
      .insert({
        user_id: userId,
        bank_code: bankCode,
        account_no_masked: mask(accountNo),
        account_fingerprint: await fingerprint(bankCode, accountNo),
        holder_name: holderName,
        // 인증번호도 해시로 보관한다. 원문을 남기지 않는다.
        code_hash: [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code)))]
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
      })
      .select('id, expires_at')
      .single();

    if (error) return fail('VERIFY_START_FAILED', 500);

    return json({
      ok: true,
      verificationId: data.id,
      bankName: BANK_NAMES[bankCode],
      accountNo: mask(accountNo),
      depositorName: `소페이${code}`,
      expiresAt: data.expires_at,
      // 데모용. 실제 서비스라면 절대 내려주지 않는다.
      demoCode: code,
    });
  }

  // ── 인증번호 확인 ──────────────────────────────────────────────────
  if (step === 'confirm') {
    const id = String(body.verificationId ?? '');
    const code = String(body.code ?? '').replace(/\D/g, '');
    if (!id || code.length !== 3) return fail('INVALID_CODE_FORMAT');

    const { data: row } = await supabase
      .from('account_verifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!row) return fail('VERIFICATION_NOT_FOUND', 404);
    if (row.verified_at) return json({ ok: true, verificationId: id, replayed: true });
    if (new Date(row.expires_at) <= new Date()) return fail('VERIFICATION_EXPIRED');
    if (row.attempts >= 3) return fail('TOO_MANY_ATTEMPTS');

    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code)))]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (hash !== row.code_hash) {
      await supabase
        .from('account_verifications')
        .update({ attempts: row.attempts + 1 })
        .eq('id', id);
      return fail('CODE_MISMATCH', 400, { remainingAttempts: 2 - row.attempts });
    }

    await supabase
      .from('account_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', id);

    return json({ ok: true, verificationId: id, holderName: row.holder_name });
  }

  return fail('NOT_FOUND', 404);
});

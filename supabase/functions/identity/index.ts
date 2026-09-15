/**
 * 모의 본인인증.
 *
 *   POST /functions/v1/identity/start      → { verificationId, checkoutUrl }
 *   GET  /functions/v1/identity/page?id=&sig=   인증 화면
 *   POST /functions/v1/identity/page?id=&sig=   인증 완료 → 앱 딥링크
 *   POST /functions/v1/identity/result     → { name, birthDate, phone, memberAuthKey }
 *
 * 가입 전 단계라 로그인 세션이 없다. 그래서 verify_jwt = false 로 두고,
 * 대신 URL 서명과 짧은 만료로 접근을 제한한다.
 *
 * 실제 PASS/NICE 본인인증으로 갈아탈 때는 이 파일 하나만 바꾸면 된다.
 * start 가 인증기관 URL 을 돌려주고, result 가 CI 를 돌려주는 계약은 그대로다.
 */
import { asService, DEEP_LINK, FUNCTIONS_URL } from '../_shared/clients.ts';
import { json, fail, html, redirect, preflight } from '../_shared/http.ts';
import { sign, verify, TTL_MS } from '../_shared/signature.ts';
import { shell, esc } from '../_shared/page.ts';

async function memberAuthKey(name: string, birth: string, phone: string) {
  const raw = `${name}|${birth}|${phone.replace(/\D/g, '')}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  const url = new URL(req.url);
  const step = url.pathname.split('/').filter(Boolean).pop();
  const supabase = asService();

  // ── 1) 인증 세션 생성 ──────────────────────────────────────────────
  if (step === 'start' && req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    const method = ['MOBILE', 'SIMPLE', 'IPIN'].includes(body.method) ? body.method : 'MOBILE';

    const { data, error } = await supabase
      .from('identity_verifications')
      .insert({ method })
      .select('id')
      .single();

    if (error) return fail('IDENTITY_START_FAILED', 500);

    const sig = await sign(data.id, Date.now() + TTL_MS);
    return json({
      ok: true,
      verificationId: data.id,
      checkoutUrl: `${FUNCTIONS_URL}/identity/page?id=${data.id}&sig=${sig}`,
    });
  }

  // ── 2) 인증 화면 ───────────────────────────────────────────────────
  if (step === 'page') {
    const id = url.searchParams.get('id') ?? '';
    if (!id || !(await verify(id, url.searchParams.get('sig')))) {
      return html(shell('본인인증', '모의 본인인증', '<h1>인증 주소가 만료되었습니다</h1><p class="sub">앱에서 다시 시도해 주세요.</p>'), 400);
    }

    if (req.method === 'POST') {
      const form = await req.formData();
      const name = String(form.get('name') ?? '').trim();
      const birth = String(form.get('birth') ?? '').trim();
      const phone = String(form.get('phone') ?? '').trim();

      if (!/^.{2,20}$/.test(name) || !/^\d{8}$/.test(birth) || !/^01\d{8,9}$/.test(phone.replace(/\D/g, ''))) {
        return redirect(`${FUNCTIONS_URL}/identity/page?id=${id}&sig=${url.searchParams.get('sig')}&err=1`);
      }

      await supabase
        .from('identity_verifications')
        .update({
          status: 'VERIFIED',
          name,
          birth_date: `${birth.slice(0, 4)}-${birth.slice(4, 6)}-${birth.slice(6, 8)}`,
          phone: phone.replace(/\D/g, ''),
          member_auth_key: await memberAuthKey(name, birth, phone),
        })
        .eq('id', id)
        .eq('status', 'PENDING');

      return redirect(`${DEEP_LINK}join/identity?verificationId=${id}&status=VERIFIED`);
    }

    const err = url.searchParams.get('err')
      ? '<p class="sub" style="color:#E32622">입력값을 다시 확인해 주세요.</p>'
      : '';

    return html(
      shell(
        '본인인증',
        '모의 본인인증 · SohPay Demo',
        `<h1>본인확인을 진행합니다</h1>
         <p class="sub">실제 통신사 인증 대신, 입력한 값을 그대로 인증 결과로 사용합니다.<br>
         아무 값이나 넣어도 됩니다.</p>${err}
         <form method="post">
           <label for="name">이름</label>
           <input id="name" name="name" placeholder="홍길동" required>
           <label for="birth">생년월일 8자리</label>
           <input id="birth" name="birth" inputmode="numeric" placeholder="19940321" required>
           <label for="phone">휴대폰 번호</label>
           <input id="phone" name="phone" inputmode="numeric" placeholder="01012345678" required>
           <div class="actions"><button class="primary" type="submit">인증 완료</button></div>
         </form>`
      )
    );
  }

  // ── 3) 인증 결과 조회 ──────────────────────────────────────────────
  if (step === 'result' && req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    const id = String(body.verificationId ?? '');
    if (!id) return fail('INVALID_BODY');

    const { data } = await supabase
      .from('identity_verifications')
      .select('status, name, birth_date, phone, member_auth_key, expires_at')
      .eq('id', id)
      .maybeSingle();

    if (!data) return fail('IDENTITY_NOT_FOUND', 404);
    if (data.status !== 'VERIFIED') return fail('IDENTITY_NOT_VERIFIED');
    if (new Date(data.expires_at) <= new Date()) return fail('IDENTITY_EXPIRED');

    return json({
      ok: true,
      verificationId: id,
      name: data.name,
      birthDate: data.birth_date,
      // 번호는 마스킹해서 돌려준다. 앱 화면에 그대로 뿌려도 되도록.
      phone: String(data.phone).replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-****-$3'),
      memberAuthKey: data.member_auth_key,
    });
  }

  return fail('NOT_FOUND', 404);
});

/**
 * 모의 본인인증.
 *
 *   POST /functions/v1/identity/start      → { verificationId, checkoutUrl }
 *   GET  /functions/v1/identity/page?id=&sig=   인증 화면
 *   POST /functions/v1/identity/page?id=&sig=   인증 완료 → 결과를 앱에 postMessage
 *   POST /functions/v1/identity/result     → { name, birthDate, phone, memberAuthKey }
 *
 * 가입 전 단계라 로그인 세션이 없다. 그래서 verify_jwt = false 로 두고,
 * 대신 URL 서명과 짧은 만료로 접근을 제한한다.
 *
 * 실제 PASS/NICE 본인인증으로 갈아탈 때는 이 파일 하나만 바꾸면 된다.
 * start 가 인증기관 URL 을 돌려주고, result 가 CI 를 돌려주는 계약은 그대로다.
 */
import { asService, DEEP_LINK, FUNCTIONS_URL } from '../_shared/clients.ts';
import { json, fail, html, preflight } from '../_shared/http.ts';
import { bridgePage } from '../_shared/bridge.ts';
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
    const sig = url.searchParams.get('sig');
    if (!id || !(await verify(id, sig))) {
      return html(shell('본인인증', '모의 본인인증', '<h1>인증 주소가 만료되었습니다</h1><p class="sub">앱에서 다시 시도해 주세요.</p>'), 400);
    }

    // 앱은 이 HTML 을 주소로 여는 대신 fetch 로 받아 WebView 에 직접 넣는다 (GET 응답이 text/plain 으로 바뀌는 문제 우회).
    // 그 경우 문서에 기준 주소가 없어 상대 경로로는 폼을 제출할 곳을 모르므로, 제출 주소를 절대 주소로 박아 둔다.
    const pageUrl = `${FUNCTIONS_URL}/identity/page?id=${id}&sig=${sig}`;

    // 인증 입력 폼. 오류 메시지와 이전 입력값을 넘기면 그대로 다시 그린다.
    const formPage = (errorMessage = '', prev = { name: '', birth: '', phone: '' }) =>
      shell(
        '본인인증',
        '모의 본인인증 · SohPay Demo',
        `<h1>본인확인을 진행합니다</h1>
         <p class="sub">실제 통신사 인증 대신, 입력한 값을 그대로 인증 결과로 사용합니다.<br>
         아무 값이나 넣어도 됩니다.</p>
         ${errorMessage ? `<p class="sub" style="color:#E32622">${esc(errorMessage)}</p>` : ''}
         <form method="post" action="${esc(pageUrl)}">
           <label for="name">이름</label>
           <input id="name" name="name" placeholder="홍길동" value="${esc(prev.name)}" required>
           <label for="birth">생년월일 8자리</label>
           <input id="birth" name="birth" inputmode="numeric" placeholder="19940321" value="${esc(prev.birth)}" required>
           <label for="phone">휴대폰 번호</label>
           <input id="phone" name="phone" inputmode="numeric" placeholder="01012345678" value="${esc(prev.phone)}" required>
           <div class="actions"><button class="primary" type="submit">인증 완료</button></div>
         </form>`
      );

    if (req.method === 'POST') {
      const form = await req.formData();
      const name = String(form.get('name') ?? '').trim();
      const birth = String(form.get('birth') ?? '').trim();
      const phone = String(form.get('phone') ?? '').trim();

      if (!/^.{2,20}$/.test(name) || !/^\d{8}$/.test(birth) || !/^01\d{8,9}$/.test(phone.replace(/\D/g, ''))) {
        // GET 으로 되돌려 보내면 그 응답이 text/plain 으로 바뀌어 화면이 깨진다. POST 응답으로 바로 폼을 다시 그린다.
        return html(formPage('입력값을 다시 확인해 주세요.', { name, birth, phone }), 400);
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

      // 앱 웹뷰에는 postMessage(certData/nonce = 인증 id) 로, 그 외에는 딥링크로 결과를 돌려준다.
      return bridgePage(
        '본인인증 완료',
        '모의 본인인증',
        '본인인증이 완료되었습니다',
        '앱으로 돌아가 가입을 계속합니다.',
        { resultCd: '0000', resultMsg: '본인인증 성공', certData: id, nonce: id },
        `${DEEP_LINK}join/identity?verificationId=${id}&status=VERIFIED`
      );
    }

    return html(formPage());
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

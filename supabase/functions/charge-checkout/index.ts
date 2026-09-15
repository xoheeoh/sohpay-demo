/**
 * 모의 결제대행사(PG) 결제창.
 *
 *   GET  /functions/v1/charge-checkout?tx=&sig=   결제창 HTML
 *   POST /functions/v1/charge-checkout?tx=&sig=   승인/실패/취소 처리 후 앱으로 복귀
 *
 * 실제 PG 연동에서 지켜야 할 두 가지를 그대로 흉내 냈다.
 *   1. 결제창은 로그인 세션 없이 열리므로 URL 자체에 서명을 붙인다.
 *   2. 잔액 반영은 앱으로 돌아가는 딥링크가 아니라 이 서버가 직접 확정한다.
 *      → 앱이 조작된 딥링크를 받아도 돈은 움직이지 않는다.
 *
 * config.toml 에서 verify_jwt = false 로 둔다 (브라우저가 직접 여는 주소).
 */
import { asService, DEEP_LINK } from '../_shared/clients.ts';
import { html, redirect } from '../_shared/http.ts';
import { verify } from '../_shared/signature.ts';
import { shell, won, esc } from '../_shared/page.ts';

const METHOD_LABEL: Record<string, string> = {
  BANK_TRANSFER: '계좌이체',
  VIRTUAL_ACCOUNT: '가상계좌',
};

function errorPage(message: string) {
  return html(
    shell(
      '결제창 오류',
      '모의 결제창',
      `<h1>결제창을 열 수 없습니다</h1><p class="sub">${esc(message)}</p>
       <div class="actions"><button class="ghost" onclick="location.href='${DEEP_LINK}charge/result?status=ERROR'">앱으로 돌아가기</button></div>`
    ),
    400
  );
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const tx = url.searchParams.get('tx') ?? '';
  const sig = url.searchParams.get('sig');

  if (!tx || !(await verify(tx, sig))) {
    return errorPage('주소가 유효하지 않거나 만료되었습니다. 앱에서 다시 시도해 주세요.');
  }

  const supabase = asService();
  const { data: trx } = await supabase
    .from('transactions')
    .select('id, amount, status, order_no, charge_method')
    .eq('id', tx)
    .eq('type', 'CHARGE')
    .maybeSingle();

  if (!trx) return errorPage('거래를 찾을 수 없습니다.');

  // ── 승인 처리 ──────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const form = await req.formData();
    const action = String(form.get('action') ?? '');

    if (action === 'cancel') {
      await supabase.rpc('settle_charge', {
        p_transaction_id: tx,
        p_approved: false,
        p_failure_code: 'USER_CANCELED',
      });
      return redirect(`${DEEP_LINK}charge/result?tx=${tx}&status=CANCELED`);
    }

    const approved = action === 'approve';
    const { data, error } = await supabase.rpc('settle_charge', {
      p_transaction_id: tx,
      p_approved: approved,
      p_failure_code: approved ? null : 'PG_DECLINED',
    });

    if (error) return errorPage(error.message);

    return redirect(`${DEEP_LINK}charge/result?tx=${tx}&status=${data.status}`);
  }

  // ── 이미 끝난 거래 ─────────────────────────────────────────────────
  if (trx.status !== 'PENDING') {
    return html(
      shell(
        '결제 완료',
        '모의 결제창',
        `<h1>이미 처리된 거래입니다</h1><p class="sub">상태: ${esc(trx.status)}</p>
         <div class="actions"><button class="primary" onclick="location.href='${DEEP_LINK}charge/result?tx=${esc(tx)}&status=${esc(trx.status)}'">앱으로 돌아가기</button></div>`
      )
    );
  }

  // ── 결제창 ─────────────────────────────────────────────────────────
  return html(
    shell(
      '소페이 충전',
      '모의 결제창 · SohPay Demo PG',
      `<h1>충전 금액을 확인해 주세요</h1>
       <p class="sub">아래 버튼은 결제대행사의 승인 결과를 흉내 냅니다.<br>
       실패·취소를 눌러 앱의 예외 처리도 확인해 보세요.</p>
       <dl>
         <div class="row"><dt>결제수단</dt><dd>${esc(METHOD_LABEL[trx.charge_method] ?? trx.charge_method)}</dd></div>
         <div class="row"><dt>주문번호</dt><dd>${esc(trx.order_no)}</dd></div>
         <div class="row"><dt>결제금액</dt><dd class="amount">${won(trx.amount)}</dd></div>
       </dl>
       <form method="post" class="actions">
         <button class="primary" name="action" value="approve">결제 승인</button>
         <button class="danger"  name="action" value="decline">승인 거절 (한도 초과 등)</button>
         <button class="ghost"   name="action" value="cancel">결제 취소</button>
       </form>`
    )
  );
});

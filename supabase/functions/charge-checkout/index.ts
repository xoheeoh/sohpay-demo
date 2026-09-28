/**
 * 모의 결제대행사(PG) 결제창.
 *
 *   GET  /functions/v1/charge-checkout?tx=&sig=   결제창 HTML
 *   POST /functions/v1/charge-checkout?tx=&sig=   승인/실패/취소 처리 후 결과를 앱에 postMessage
 *
 * 실제 PG 연동에서 지켜야 할 두 가지를 그대로 흉내 냈다.
 *   1. 결제창은 로그인 세션 없이 열리므로 URL 자체에 서명을 붙인다.
 *   2. 잔액 반영은 앱으로 돌아가는 딥링크가 아니라 이 서버가 직접 확정한다.
 *      → 앱이 조작된 딥링크를 받아도 돈은 움직이지 않는다.
 *
 * config.toml 에서 verify_jwt = false 로 둔다 (브라우저가 직접 여는 주소).
 */
import { asService, DEEP_LINK, FUNCTIONS_URL } from '../_shared/clients.ts';
import { html } from '../_shared/http.ts';
import { bridgePage } from '../_shared/bridge.ts';
import { verify } from '../_shared/signature.ts';
import { shell, won, esc } from '../_shared/page.ts';
import { bankName } from '../_shared/banks.ts';

const METHOD_LABEL: Record<string, string> = {
  BANK_TRANSFER: '실시간 계좌이체',
  VIRTUAL_ACCOUNT: '가상계좌',
};

function errorPage(message: string) {
  return html(
    shell(
      '결제창 오류',
      '모의 결제창',
      `<h1>결제창을 열 수 없습니다</h1><p class="sub">${esc(message)}</p>
       <div class="actions"><button class="ghost center" onclick="location.href='${DEEP_LINK}charge/result?status=ERROR'">앱으로 돌아가기</button></div>`
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
    .select('id, amount, status, order_no, charge_method, bank_account_id')
    .eq('id', tx)
    .eq('type', 'CHARGE')
    .maybeSingle();

  if (!trx) return errorPage('거래를 찾을 수 없습니다.');

  // 출금 계좌(있으면 결제창에 함께 보여준다). 계좌번호는 DB 에 마스킹된 값만 저장되어 있다.
  const { data: acnt } = trx.bank_account_id
    ? await supabase.from('bank_accounts').select('bank_code, account_no_masked').eq('id', trx.bank_account_id).maybeSingle()
    : { data: null };

  // ── 승인 처리 ──────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const form = await req.formData();
    const action = String(form.get('action') ?? '');

    const approved = action === 'approve';
    const failureCode = action === 'cancel' ? 'USER_CANCELED' : 'PG_DECLINED';
    const { data, error } = await supabase.rpc('settle_charge', {
      p_transaction_id: tx,
      p_approved: approved,
      p_failure_code: approved ? null : failureCode,
    });

    if (error) return errorPage(error.message);

    const success = data.status === 'APPROVED';
    const resultMsg = success
      ? '충전이 완료되었습니다.'
      : action === 'cancel' ? '결제를 취소했습니다.'
      : data.code === 'MAX_BALANCE_EXCEEDED' ? '보유 한도를 초과해 충전할 수 없습니다.'
      : '결제사에서 승인을 거절했습니다.';

    // 앱 웹뷰에는 postMessage 로, 그 외에는 딥링크로 결과를 돌려준다.
    return bridgePage(
      '충전 결과',
      '모의 결제창',
      success ? '충전이 완료되었습니다' : '충전하지 못했습니다',
      resultMsg,
      { resultCd: success ? '0000' : '9999', resultMsg, transactionId: tx, amount: trx.amount },
      `${DEEP_LINK}charge/result?tx=${tx}&status=${data.status}`
    );
  }

  // ── 이미 끝난 거래 ─────────────────────────────────────────────────
  if (trx.status !== 'PENDING') {
    return html(
      shell(
        '결제 완료',
        '모의 결제창',
        `<h1>이미 처리된 거래입니다</h1><p class="sub">상태: ${esc(trx.status)}</p>
         <div class="actions"><button class="primary center" onclick="location.href='${DEEP_LINK}charge/result?tx=${esc(tx)}&status=${esc(trx.status)}'">앱으로 돌아가기</button></div>`
      )
    );
  }

  // ── 결제창 ─────────────────────────────────────────────────────────
  // 앱은 이 HTML 을 fetch 로 받아 WebView 에 직접 넣으므로(GET 응답이 text/plain 으로 바뀌는 문제 우회),
  // 폼 제출 주소를 절대 주소로 명시해야 한다. (identity/index.ts 와 같은 이유)
  const checkoutUrl = `${FUNCTIONS_URL}/charge-checkout?tx=${tx}&sig=${sig}`;
  const accountRow = acnt
    ? `<div class="row"><dt>출금 계좌</dt><dd>${esc(bankName(acnt.bank_code))} ${esc(acnt.account_no_masked)}</dd></div>`
    : '';
  return html(
    shell(
      'SohPay 충전 · 모의 결제창',
      'SohPay Demo PG · 계좌이체',
      `<h1>결과를 골라 충전을 진행해 보세요</h1>
       <p class="sub">실제 서비스라면 여기서 은행 앱이나 결제대행사 창이 열립니다.<br>
       이 데모에서는 아래 버튼 중 하나를 눌러 결제대행사의 응답을 대신 만듭니다. 앱은 그 결과를 실제 연동과 같은 방식으로 받아 처리합니다.</p>
       <dl>
         <div class="row"><dt>충전 금액</dt><dd class="amount">${won(trx.amount)}</dd></div>
         <div class="row"><dt>결제 수단</dt><dd>${esc(METHOD_LABEL[trx.charge_method] ?? trx.charge_method)}</dd></div>
         ${accountRow}
         <div class="row"><dt>주문번호</dt><dd>${esc(trx.order_no)}</dd></div>
       </dl>
       <form method="post" class="actions" action="${esc(checkoutUrl)}">
         <button class="primary" name="action" value="approve">결제 승인<small>충전 금액이 앱 잔액에 바로 반영됩니다</small></button>
         <button class="danger"  name="action" value="decline">승인 거절<small>결제대행사가 거절한 상황을 재현합니다 (한도 초과 등)</small></button>
         <button class="ghost"   name="action" value="cancel">결제 취소<small>사용자가 결제창을 닫은 상황을 재현합니다</small></button>
       </form>`
    )
  );
});

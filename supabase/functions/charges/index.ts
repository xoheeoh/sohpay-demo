/**
 * POST /functions/v1/charges
 *   { amount, method, bankAccountId?, idempotencyKey? }
 *   → { transactionId, orderNo, amount, checkoutUrl }
 *
 * 승인 대기 거래를 만들고, 서명된 모의 결제창 주소를 돌려준다.
 * 잔액은 여기서 늘지 않는다. charge-checkout 의 서버 통지에서만 늘어난다.
 */
import { asCaller, FUNCTIONS_URL } from '../_shared/clients.ts';
import { json, fail, preflight } from '../_shared/http.ts';
import { sign, TTL_MS } from '../_shared/signature.ts';

const METHODS = new Set(['BANK_TRANSFER', 'VIRTUAL_ACCOUNT']);

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return fail('METHOD_NOT_ALLOWED', 405);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return fail('INVALID_BODY');
  }

  const amount = Number(payload.amount);
  const method = String(payload.method ?? '');

  if (!Number.isInteger(amount) || amount <= 0) return fail('INVALID_AMOUNT');
  if (!METHODS.has(method)) return fail('INVALID_METHOD');

  const supabase = asCaller(req);
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) return fail('UNAUTHENTICATED', 401);

  const { data, error } = await supabase.rpc('create_charge', {
    p_amount: amount,
    p_method: method,
    p_bank_account_id: payload.bankAccountId ?? null,
    p_idempotency_key: payload.idempotencyKey ?? null,
  });

  // 도메인 함수가 던진 오류 코드를 그대로 전달한다.
  if (error) return fail(error.message, 400);

  const expiresAt = Date.now() + TTL_MS;
  const sig = await sign(data.transactionId, expiresAt);

  return json({
    ...data,
    checkoutUrl: `${FUNCTIONS_URL}/charge-checkout?tx=${data.transactionId}&sig=${sig}`,
  });
});

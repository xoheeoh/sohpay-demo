import { supabase } from '../supabase';
import { assertOk, unwrap } from '../errors';
import type { PaymentRequest } from './types';

export async function resolvePaymentRequest(qrToken: string): Promise<PaymentRequest> {
  return unwrap(await supabase.rpc('resolve_payment_request', { p_qr_token: qrToken }));
}

export type PaymentResult = { ok: boolean; code?: string; transactionId: string; status: string; amount: number; balance: number; approvedAt: string; replayed: boolean };

export async function executePayment(input: { qrToken: string; pin: string; idempotencyKey: string }): Promise<PaymentResult> {
  const data = unwrap(
    await supabase.rpc('execute_payment', { p_qr_token: input.qrToken, p_pin: input.pin, p_idempotency_key: input.idempotencyKey })
  );
  return assertOk(data as PaymentResult);
}

export async function cancelPayment(transactionId: string, amount?: number) {
  return unwrap(await supabase.rpc('cancel_payment', { p_transaction_id: transactionId, p_amount: amount ?? null }));
}

/** 데모용: 가맹점 포스기 대신 앱에서 QR 을 발급해 본다. */
export async function issueDemoQr(mid: string, amount: number, goodsName: string): Promise<{ qrToken: string; merchant: string; amount: number; expiresAt: string }> {
  return unwrap(await supabase.rpc('issue_payment_request', { p_mid: mid, p_amount: amount, p_goods_name: goodsName, p_ttl_seconds: 300 }));
}

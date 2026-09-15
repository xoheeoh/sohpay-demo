import { supabase } from '../supabase';
import { assertOk, unwrap } from '../errors';

export type RefundResult = { ok: boolean; code?: string; transactionId: string; amount: number; balance: number; bankCode: string; accountNo: string; replayed: boolean };

export async function requestRefund(input: { amount: number; pin: string; bankAccountId?: string | null; idempotencyKey: string }): Promise<RefundResult> {
  const data = unwrap(
    await supabase.rpc('request_refund', {
      p_amount: input.amount,
      p_pin: input.pin,
      p_bank_account_id: input.bankAccountId ?? null,
      p_idempotency_key: input.idempotencyKey,
    })
  );
  return assertOk(data as RefundResult);
}

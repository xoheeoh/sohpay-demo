import { supabase } from '../supabase';
import { unwrap } from '../errors';
import { callFunction } from './functions';
import type { ChargeMethod, TransactionStatus } from './types';

export type ChargeStart = { transactionId: string; orderNo: string; amount: number; status: string; checkoutUrl: string };

export function startCharge(input: { amount: number; method: ChargeMethod; bankAccountId?: string | null; idempotencyKey: string }) {
  return callFunction<ChargeStart>('charges', input);
}

/** 결제창이 열려 있는 동안 상태를 폴링한다. 딥링크가 못 돌아오는 웹에서도 이걸로 결과를 안다. */
export async function getChargeStatus(id: string): Promise<{ status: TransactionStatus; failure_code: string | null; balance_after: number | null }> {
  return unwrap(await supabase.from('transactions').select('status, failure_code, balance_after').eq('id', id).single());
}

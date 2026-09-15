import { supabase } from '../supabase';
import { unwrap } from '../errors';
import { callFunction } from './functions';
import type { BankAccount } from './types';

export async function listBankAccounts(): Promise<BankAccount[]> {
  return unwrap(await supabase.from('bank_accounts').select('*').order('is_primary', { ascending: false }).order('created_at'));
}

export type VerifyStart = { verificationId: string; bankName: string; accountNo: string; depositorName: string; expiresAt: string; demoCode: string };

export function startAccountVerify(input: { bankCode: string; accountNo: string; holderName: string }) {
  return callFunction<VerifyStart>('account-verify/start', input);
}

export function confirmAccountVerify(input: { verificationId: string; code: string }) {
  return callFunction<{ ok: true; verificationId: string; holderName: string }>('account-verify/confirm', input);
}

export async function registerBankAccount(verificationId: string, purpose: 'REFUND' | 'CHARGE', setPrimary = true) {
  return unwrap(await supabase.rpc('register_bank_account', { p_verification_id: verificationId, p_purpose: purpose, p_set_primary: setPrimary }));
}

export async function setPrimaryBankAccount(id: string) {
  return unwrap(await supabase.rpc('set_primary_bank_account', { p_bank_account_id: id }));
}

export async function removeBankAccount(id: string) {
  return unwrap(await supabase.rpc('remove_bank_account', { p_bank_account_id: id }));
}

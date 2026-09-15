import { supabase } from '../supabase';
import { unwrap } from '../errors';
import type { RecentTransaction, Transaction, TransactionType, Wallet } from './types';

export async function getWallet(): Promise<Wallet> {
  return unwrap(await supabase.from('wallets').select('balance, currency, daily_limit, per_tx_limit, max_balance, updated_at').single());
}

export async function getRecent(): Promise<RecentTransaction[]> {
  return unwrap(await supabase.from('recent_transactions').select('*'));
}

export type TxFilter = {
  type?: TransactionType | 'ALL';
  status?: 'ALL' | 'APPROVED' | 'CANCELED';
  from: Date;
  to: Date;
  page: number;
  size?: number;
};

export async function listTransactions(f: TxFilter): Promise<{ rows: Transaction[]; hasMore: boolean }> {
  const size = f.size ?? 20;
  let q = supabase
    .from('transactions')
    .select('*, merchant:merchants(id, mid, name, category, address, logo_emoji)')
    .neq('status', 'PENDING')
    .gte('created_at', f.from.toISOString())
    .lte('created_at', new Date(f.to.getTime() + 86_399_999).toISOString())
    .order('created_at', { ascending: false })
    .range(f.page * size, f.page * size + size); // 한 건 더 가져와 다음 페이지 유무를 판단

  if (f.type && f.type !== 'ALL') q = q.eq('type', f.type);
  if (f.status === 'APPROVED') q = q.eq('status', 'APPROVED');
  if (f.status === 'CANCELED') q = q.in('status', ['CANCELED', 'PARTIALLY_CANCELED']);

  const rows = unwrap(await q) as Transaction[];
  return { rows: rows.slice(0, size), hasMore: rows.length > size };
}

export async function getTransaction(id: string): Promise<Transaction> {
  return unwrap(
    await supabase
      .from('transactions')
      .select('*, merchant:merchants(id, mid, name, category, address, logo_emoji)')
      .eq('id', id)
      .single()
  );
}

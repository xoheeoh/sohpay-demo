export type TransactionType = 'CHARGE' | 'PAYMENT' | 'REFUND';
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'PARTIALLY_CANCELED' | 'CANCELED' | 'FAILED';
export type ChargeMethod = 'BANK_TRANSFER' | 'VIRTUAL_ACCOUNT';

export type Profile = {
  id: string;
  mb_uid: string;
  name: string;
  email: string;
  phone: string | null;
  birth_date: string | null;
  status: 'ACTIVE' | 'DORMANT' | 'WITHDRAWN';
  marketing_opt_in: boolean;
  created_at: string;
};

export type Wallet = {
  balance: number;
  currency: string;
  daily_limit: number;
  per_tx_limit: number;
  max_balance: number;
  updated_at: string;
};

export type Merchant = {
  id: string;
  mid: string;
  name: string;
  category: string | null;
  address: string | null;
  logo_emoji: string | null;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  canceled_amount: number;
  balance_after: number | null;
  charge_method: ChargeMethod | null;
  order_no: string;
  goods_name: string | null;
  failure_code: string | null;
  approved_at: string | null;
  canceled_at: string | null;
  created_at: string;
  merchant?: Merchant | null;
};

export type RecentTransaction = {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  canceled_amount: number;
  balance_after: number | null;
  goods_name: string | null;
  created_at: string;
  merchant_name: string | null;
  merchant_emoji: string | null;
};

export type BankAccount = {
  id: string;
  bank_code: string;
  account_no_masked: string;
  holder_name: string;
  purpose: 'REFUND' | 'CHARGE';
  is_primary: boolean;
  verified_at: string | null;
};

export type PaymentRequest = {
  paymentRequestId: string;
  orderNo: string;
  goodsName: string;
  amount: number;
  supplyAmount: number;
  vat: number;
  expiresAt: string;
  merchant: { mid: string; name: string; category: string | null; address: string | null; emoji: string | null };
};

export type Notice = { id: string; title: string; body: string; is_pinned: boolean; published_at: string };
export type Faq = { id: string; category: string; question: string; answer: string; sort_no: number };
export type Term = { code: string; title: string; body: string; is_required: boolean; version: string; sort_no: number };

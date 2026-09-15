/**
 * 여러 화면에 걸친 플로우의 임시 상태.
 * 서버에 저장할 값이 아니고, 플로우를 벗어나면 버린다.
 */
import { create } from 'zustand';
import type { PaymentRequest } from './api/types';
import type { IdentityResult } from './api/identity';

type JoinFlow = {
  agreedRequired: boolean;
  marketing: boolean;
  identity: IdentityResult | null;
  mbUid: string;
  password: string;
  set: (p: Partial<Omit<JoinFlow, 'set' | 'reset'>>) => void;
  reset: () => void;
};

const joinInit = { agreedRequired: false, marketing: false, identity: null, mbUid: '', password: '' };
export const useJoinFlow = create<JoinFlow>((set) => ({ ...joinInit, set: (p) => set(p), reset: () => set(joinInit) }));

type PayFlow = {
  qrToken: string | null;
  request: PaymentRequest | null;
  idempotencyKey: string | null;
  set: (p: Partial<Omit<PayFlow, 'set' | 'reset'>>) => void;
  reset: () => void;
};

const payInit = { qrToken: null, request: null, idempotencyKey: null };
export const usePayFlow = create<PayFlow>((set) => ({ ...payInit, set: (p) => set(p), reset: () => set(payInit) }));

type ChargeFlow = {
  amount: number;
  method: 'BANK_TRANSFER' | 'VIRTUAL_ACCOUNT' | null;
  bankAccountId: string | null;
  set: (p: Partial<Omit<ChargeFlow, 'set' | 'reset'>>) => void;
  reset: () => void;
};

const chargeInit = { amount: 0, method: null, bankAccountId: null };
export const useChargeFlow = create<ChargeFlow>((set) => ({ ...chargeInit, set: (p) => set(p), reset: () => set(chargeInit) }));

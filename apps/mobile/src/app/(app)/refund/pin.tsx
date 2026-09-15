import { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PinEntry, Screen } from '@/components/ui';
import { refunds } from '@/lib/api';
import { AppError, messageOf } from '@/lib/errors';
import { invalidateMoney } from '@/lib/query';
import { won, newIdempotencyKey } from '@/lib/format';

export default function RefundPinScreen() {
  const router = useRouter();
  const { amount, accountId } = useLocalSearchParams<{ amount: string; accountId: string }>();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const idem = useRef(newIdempotencyKey());

  const onComplete = async (pin: string) => {
    setBusy(true); setError(null);
    try {
      const res = await refunds.requestRefund({ amount: Number(amount), pin, bankAccountId: accountId, idempotencyKey: idem.current });
      invalidateMoney();
      router.replace({ pathname: '/(app)/refund/done', params: { amount, balance: String(res.balance), bank: res.bankCode, acct: res.accountNo } });
    } catch (e) {
      const code = e instanceof AppError ? e.code : '';
      setError(messageOf(e));
      if (code !== 'PIN_MISMATCH' && code !== 'PIN_LOCKED') setTimeout(() => router.back(), 1200);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll={false}>
      <PinEntry title="결제 비밀번호" subtitle={`${won(Number(amount))}을 등록된 계좌로 환불합니다`} error={error} onComplete={onComplete} busy={busy} />
    </Screen>
  );
}

import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { PinEntry, Screen } from '@/components/ui';
import { payments } from '@/lib/api';
import { AppError, messageOf } from '@/lib/errors';
import { invalidateMoney } from '@/lib/query';
import { won } from '@/lib/format';
import { usePayFlow } from '@/lib/flows';

export default function PayPinScreen() {
  const router = useRouter();
  const flow = usePayFlow();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!flow.request || !flow.qrToken || !flow.idempotencyKey) return <Redirect href="/(app)/pay/scan" />;

  const onComplete = async (pin: string) => {
    setBusy(true); setError(null);
    try {
      const res = await payments.executePayment({ qrToken: flow.qrToken!, pin, idempotencyKey: flow.idempotencyKey! });
      invalidateMoney();
      router.replace({ pathname: '/(app)/pay/done', params: { tx: res.transactionId, balance: String(res.balance) } });
    } catch (e) {
      const code = e instanceof AppError ? e.code : '';
      const remaining = e instanceof AppError ? (e.detail as { remainingAttempts?: number })?.remainingAttempts : undefined;
      if (code === 'PIN_MISMATCH' && remaining != null) setError(`${messageOf(e)} (${remaining}회 남음)`);
      else if (code === 'PIN_LOCKED' || code === 'PIN_MISMATCH') setError(messageOf(e));
      else {
        // 잔액 부족·만료 등은 재입력해도 소용없으니 이전 화면으로
        setError(messageOf(e));
        setTimeout(() => router.back(), 1200);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll={false}>
      <PinEntry title="결제 비밀번호" subtitle={`${flow.request.merchant.name}에 ${won(flow.request.amount)}을 결제합니다`} error={error} onComplete={onComplete} busy={busy} />
    </Screen>
  );
}

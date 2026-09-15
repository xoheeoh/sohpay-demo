import { useState } from 'react';
import { PinEntry, Screen, toast } from '@/components/ui';
import { useAuth } from '@/lib/auth/store';
import { messageOf } from '@/lib/errors';
import { useJoinFlow } from '@/lib/flows';

export default function JoinPinScreen() {
  const flow = useJoinFlow();
  const signUp = useAuth((s) => s.signUp);
  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onComplete = async (pin: string) => {
    setError(null);
    if (/^(.)\1{5}$/.test(pin)) return setError('같은 숫자를 반복할 수 없어요');
    if (!first) return setFirst(pin);
    if (first !== pin) { setFirst(null); return setError('비밀번호가 달라요. 처음부터 다시 입력해 주세요'); }

    setBusy(true);
    try {
      await signUp({
        mbUid: flow.mbUid,
        password: flow.password,
        pin,
        name: flow.identity?.name ?? '회원',
        verificationId: flow.identity?.verificationId ?? null,
        marketing: flow.marketing,
      });
      flow.reset();
      toast.info('가입이 완료되었어요. 환영합니다!');
      // 로그인 상태가 되면 라우터의 Protected 가드가 (app) 으로 자동 전환한다.
    } catch (e) {
      setError(messageOf(e));
      setFirst(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll={false}>
      <PinEntry
        title={first ? '한 번 더 입력해 주세요' : '결제 비밀번호를 만들어 주세요'}
        subtitle="결제·환불할 때 사용하는 숫자 6자리예요"
        error={error}
        onComplete={onComplete}
        busy={busy}
      />
    </Screen>
  );
}

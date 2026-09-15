import { useState } from 'react';
import { useRouter } from 'expo-router';
import { PinEntry, Screen, toast } from '@/components/ui';
import { profile as profileApi } from '@/lib/api';
import { messageOf } from '@/lib/errors';

type Step = 'current' | 'new' | 'confirm';

export default function ChangePinScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('current');
  const [current, setCurrent] = useState('');
  const [fresh, setFresh] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onComplete = async (pin: string) => {
    setError(null);
    if (step === 'current') {
      setBusy(true);
      try { await profileApi.verifyPin(pin); setCurrent(pin); setStep('new'); }
      catch (e) { setError(messageOf(e)); }
      finally { setBusy(false); }
      return;
    }
    if (step === 'new') {
      if (/^(.)\1{5}$/.test(pin)) return setError('같은 숫자를 반복할 수 없어요');
      if (pin === current) return setError('기존 비밀번호와 달라야 해요');
      setFresh(pin); setStep('confirm'); return;
    }
    if (pin !== fresh) { setStep('new'); return setError('비밀번호가 달라요. 다시 입력해 주세요'); }
    setBusy(true);
    try {
      await profileApi.changePin(current, pin);
      toast.info('결제 비밀번호를 변경했어요');
      router.back();
    } catch (e) { setError(messageOf(e)); setStep('current'); }
    finally { setBusy(false); }
  };

  const title = { current: '현재 비밀번호를 입력해 주세요', new: '새 비밀번호를 입력해 주세요', confirm: '한 번 더 입력해 주세요' }[step];

  return (
    <Screen scroll={false}>
      <PinEntry title={title} error={error} onComplete={onComplete} busy={busy} />
    </Screen>
  );
}

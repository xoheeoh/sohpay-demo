import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Screen, TextField, Typography } from '@/components/ui';
import { useTheme } from '@/theme';
import { payments } from '@/lib/api';
import { messageOf } from '@/lib/errors';
import { usePayFlow } from '@/lib/flows';

export default function CodeScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const token = code.trim();
    if (!token) return;
    setBusy(true); setError(null);
    try {
      const req = await payments.resolvePaymentRequest(token);
      usePayFlow.getState().set({ qrToken: token, request: req, idempotencyKey: null });
      router.replace('/(app)/pay/confirm');
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen footer={<Button title="다음" onPress={submit} loading={busy} disabled={!code.trim()} />}>
      <View style={{ paddingTop: space.lg, gap: space.xl }}>
        <View style={{ gap: space.sm }}>
          <Typography variant="h1">결제 코드를 입력해 주세요</Typography>
          <Typography variant="body2" color="textSub">가맹점 화면의 QR 아래 코드, 또는 데모 가맹점에서 발급한 토큰을 붙여 넣으세요.</Typography>
        </View>
        <TextField value={code} onChangeText={setCode} placeholder="SOHPAY:…" autoCapitalize="none" autoCorrect={false} error={error} onSubmitEditing={submit} returnKeyType="done" />
      </View>
    </Screen>
  );
}

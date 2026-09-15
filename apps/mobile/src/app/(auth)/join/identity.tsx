import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Screen, Typography } from '@/components/ui';
import { useTheme } from '@/theme';
import { identity } from '@/lib/api';
import { messageOf } from '@/lib/errors';
import { useJoinFlow } from '@/lib/flows';
import { CheckoutView } from '@/components/CheckoutView';

/**
 * 본인인증.
 * 웹뷰가 sohpay://join/identity?verificationId=&status=VERIFIED 로 돌아오면 결과를 받아온다.
 * 웹에서는 딥링크가 오지 않으므로 2초마다 결과를 확인한다.
 */
export default function IdentityScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const params = useLocalSearchParams<{ verificationId?: string; status?: string }>();
  const setFlow = useJoinFlow((s) => s.set);

  const [session, setSession] = useState<{ verificationId: string; checkoutUrl: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);

  const finish = useCallback(async (verificationId: string) => {
    if (done.current) return;
    try {
      const result = await identity.getIdentityResult(verificationId);
      done.current = true;
      setFlow({ identity: result });
      router.replace('/(auth)/join/account');
    } catch (e) {
      // 아직 인증 전이면 조용히 넘어간다 (폴링 중)
      if ((e as { code?: string }).code !== 'IDENTITY_NOT_VERIFIED') setError(messageOf(e));
    }
  }, [router, setFlow]);

  // 딥링크로 돌아온 경우
  useEffect(() => {
    if (params.verificationId && params.status === 'VERIFIED') finish(params.verificationId);
  }, [params.verificationId, params.status, finish]);

  // 웹 폴링
  useEffect(() => {
    if (!session) return;
    const t = setInterval(() => finish(session.verificationId), 2000);
    return () => clearInterval(t);
  }, [session, finish]);

  const start = async () => {
    setBusy(true); setError(null);
    try {
      setSession(await identity.startIdentity('MOBILE'));
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  if (session) {
    return (
      <View style={styles.full}>
        <CheckoutView
          url={session.checkoutUrl}
          onDeepLink={(url) => {
            const id = new URL(url).searchParams.get('verificationId');
            if (id) finish(id);
          }}
        />
      </View>
    );
  }

  return (
    <Screen footer={<Button title="휴대폰 본인인증 시작" onPress={start} loading={busy} />}>
      <View style={{ paddingTop: space.lg, gap: space.md }}>
        <Typography variant="h1">본인확인이 필요해요</Typography>
        <Typography variant="body1" color="textSub">
          선불 지갑은 실명 확인이 된 사람만 만들 수 있어요.{'\n'}
          이 데모에서는 통신사 대신 모의 인증 화면이 열립니다.
        </Typography>
        {error ? <Typography variant="body2" color="danger">{error}</Typography> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ full: { flex: 1 } });

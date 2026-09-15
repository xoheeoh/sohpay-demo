import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Screen, Skeleton, Typography } from '@/components/ui';
import { useTheme } from '@/theme';
import { charges } from '@/lib/api';
import { invalidateMoney } from '@/lib/query';
import { won } from '@/lib/format';
import { useChargeFlow } from '@/lib/flows';

const FAIL_REASON: Record<string, string> = {
  USER_CANCELED: '결제를 취소했어요.',
  PG_DECLINED: '결제사에서 승인을 거절했어요.',
  MAX_BALANCE_EXCEEDED: '보유 한도를 초과해 충전할 수 없었어요.',
};

export default function ChargeResultScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const { tx } = useLocalSearchParams<{ tx: string }>();
  const amount = useChargeFlow((s) => s.amount);
  const [state, setState] = useState<Awaited<ReturnType<typeof charges.getChargeStatus>> | null>(null);

  // 딥링크로 직접 들어온 경우(폴링 없이) 를 위해 여기서도 서버 상태를 읽는다.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const s = await charges.getChargeStatus(tx);
      if (!alive) return;
      setState(s);
      if (s.status === 'PENDING') setTimeout(load, 1500);
      else invalidateMoney();
    };
    load();
    return () => { alive = false; };
  }, [tx]);

  const ok = state?.status === 'APPROVED';
  const done = () => { useChargeFlow.getState().reset(); router.dismissAll(); router.replace('/(app)/(tabs)'); };

  return (
    <Screen footer={<Button title="확인" onPress={done} disabled={!state || state.status === 'PENDING'} />}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.md }}>
        {!state || state.status === 'PENDING' ? (
          <>
            <Skeleton width={72} height={72} radius={36} />
            <Typography variant="h2" color="textSub">승인 결과를 확인하고 있어요</Typography>
          </>
        ) : ok ? (
          <>
            <Typography variant="display">✅</Typography>
            <Typography variant="h1" align="center">충전이 완료되었어요</Typography>
            <Typography variant="display" color="primary">{amount ? won(amount) : ''}</Typography>
            <Card style={{ alignSelf: 'stretch', marginTop: space.lg }}>
              <Row k="충전 후 잔액" v={won(state.balance_after)} />
            </Card>
          </>
        ) : (
          <>
            <Typography variant="display">😥</Typography>
            <Typography variant="h1" align="center">충전하지 못했어요</Typography>
            <Typography variant="body1" color="textSub" align="center">{FAIL_REASON[state.failure_code ?? ''] ?? '잠시 후 다시 시도해 주세요.'}</Typography>
          </>
        )}
      </View>
    </Screen>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Typography variant="body2" color="textSub">{k}</Typography>
      <Typography variant="body1" weight="600">{v}</Typography>
    </View>
  );
}

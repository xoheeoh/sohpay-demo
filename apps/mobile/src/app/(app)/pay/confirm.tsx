import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Screen, Typography } from '@/components/ui';
import { useTheme } from '@/theme';
import { wallet } from '@/lib/api';
import { keys } from '@/lib/query';
import { won, newIdempotencyKey } from '@/lib/format';
import { usePayFlow } from '@/lib/flows';

export default function ConfirmScreen() {
  const router = useRouter();
  const { colors, space, radius } = useTheme();
  const flow = usePayFlow();
  const { data: w } = useQuery({ queryKey: keys.wallet, queryFn: wallet.getWallet });
  const req = flow.request;

  // 남은 시간 표시 (QR 은 5분 유효)
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!req) return;
    const tick = () => setLeft(Math.max(0, Math.floor((new Date(req.expiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [req]);

  if (!req) return <Redirect href="/(app)/pay/scan" />;

  const short = w ? w.balance < req.amount : false;
  const expired = left <= 0;

  const next = () => {
    // 멱등성 키는 "이 확인 화면에서 결제 버튼을 누른 순간" 한 번만 만든다.
    // PIN 을 틀려 재시도해도 같은 키를 쓰므로 서버는 같은 결제로 본다.
    flow.set({ idempotencyKey: flow.idempotencyKey ?? newIdempotencyKey() });
    router.push('/(app)/pay/pin');
  };

  return (
    <Screen
      footer={
        <>
          {short ? <Button title="잔액이 부족해요 · 충전하기" variant="secondary" onPress={() => router.push('/(app)/charge/amount')} /> : null}
          <Button title={expired ? '만료된 결제 코드' : `${won(req.amount)} 결제하기`} disabled={short || expired} onPress={next} />
        </>
      }>
      <View style={{ paddingTop: space.xl, gap: space.xl }}>
        <View style={{ alignItems: 'center', gap: space.sm }}>
          <View style={[styles.logo, { backgroundColor: colors.surface, borderRadius: radius.xl, borderColor: colors.line }]}>
            <Typography variant="display">{req.merchant.emoji ?? '🏪'}</Typography>
          </View>
          <Typography variant="h2">{req.merchant.name}</Typography>
          <Typography variant="caption" color="textMuted">{req.merchant.category} · {req.merchant.address}</Typography>
        </View>

        <Card style={{ gap: 14 }}>
          <Row k="상품" v={req.goodsName} />
          <Row k="주문번호" v={req.orderNo} mono />
          <Row k="공급가액" v={won(req.supplyAmount)} />
          <Row k="부가세" v={won(req.vat)} />
          <View style={[styles.hr, { backgroundColor: colors.line }]} />
          <View style={styles.total}>
            <Typography variant="h3">결제 금액</Typography>
            <Typography variant="h1" color="primary">{won(req.amount)}</Typography>
          </View>
        </Card>

        <Card style={{ gap: 6 }}>
          <Row k="결제 후 잔액" v={w ? won(w.balance - req.amount) : '—'} danger={short} />
          <Row k="남은 시간" v={`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`} danger={left < 30} />
        </Card>
      </View>
    </Screen>
  );
}

function Row({ k, v, mono, danger }: { k: string; v: string; mono?: boolean; danger?: boolean }) {
  return (
    <View style={styles.row}>
      <Typography variant="body2" color="textSub">{k}</Typography>
      <Typography variant={mono ? 'mono' : 'body1'} color={danger ? 'danger' : 'text'} weight="600" numberOfLines={1} style={{ flexShrink: 1, textAlign: 'right' }}>{v}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  hr: { height: StyleSheet.hairlineWidth },
  total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

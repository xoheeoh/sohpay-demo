import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { Button, Card, Screen, TextField, Typography, toast } from '@/components/ui';
import { useTheme } from '@/theme';
import { payments, support } from '@/lib/api';
import { keys } from '@/lib/query';
import { messageOf } from '@/lib/errors';
import { won } from '@/lib/format';
import { usePayFlow } from '@/lib/flows';

/**
 * 가맹점 포스기 흉내.
 * 실제 서비스라면 가맹점 단말이 발급하는 결제 QR 을 여기서 만들어 본다.
 * 두 대의 기기로 시연하거나, 한 기기에서는 "이 코드로 바로 결제" 로 이어진다.
 */
export default function DemoQrScreen() {
  const router = useRouter();
  const { colors, radius, space } = useTheme();
  const { data: merchants } = useQuery({ queryKey: keys.merchants, queryFn: support.listMerchants });
  const [mid, setMid] = useState<string | null>(null);
  const [amount, setAmount] = useState('5500');
  const [goods, setGoods] = useState('아메리카노 2잔');
  const [issued, setIssued] = useState<{ qrToken: string; merchant: string; amount: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = mid ?? merchants?.[0]?.mid ?? null;

  const issue = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await payments.issueDemoQr(selected, Number(amount), goods || '데모 결제');
      setIssued(res);
    } catch (e) { toast.error(messageOf(e)); }
    finally { setBusy(false); }
  };

  const payNow = async () => {
    if (!issued) return;
    try {
      const req = await payments.resolvePaymentRequest(issued.qrToken);
      usePayFlow.getState().set({ qrToken: issued.qrToken, request: req, idempotencyKey: null });
      router.push('/(app)/pay/confirm');
    } catch (e) { toast.error(messageOf(e)); }
  };

  return (
    <Screen>
      <View style={{ paddingTop: space.lg, gap: space.lg }}>
        <Typography variant="body2" color="textSub">가맹점을 고르고 금액을 넣으면 5분간 유효한 결제 QR이 발급됩니다.</Typography>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {(merchants ?? []).map((m) => {
            const on = m.mid === selected;
            return (
              <Pressable key={m.id} onPress={() => { setMid(m.mid); setIssued(null); }} style={[styles.m, { borderRadius: radius.md, borderColor: on ? colors.primary : colors.line, backgroundColor: on ? colors.primarySoft : colors.surface }]}>
                <Typography variant="h2">{m.logo_emoji}</Typography>
                <Typography variant="caption" color={on ? 'primary' : 'textSub'} numberOfLines={1}>{m.name}</Typography>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><TextField label="금액" value={amount} onChangeText={(t) => setAmount(t.replace(/\D/g, ''))} keyboardType="number-pad" /></View>
          <View style={{ flex: 2 }}><TextField label="상품명" value={goods} onChangeText={setGoods} /></View>
        </View>

        <Button title="결제 QR 발급" onPress={issue} loading={busy} disabled={!selected || !Number(amount)} variant="secondary" />

        {issued ? (
          <Card style={{ alignItems: 'center', gap: 14 }}>
            <Typography variant="h3">{issued.merchant} · {won(issued.amount)}</Typography>
            <View style={{ padding: 12, backgroundColor: '#fff', borderRadius: radius.md }}>
              <QRCode value={issued.qrToken} size={200} />
            </View>
            <Pressable onPress={async () => { await Clipboard.setStringAsync(issued.qrToken); toast.info('코드를 복사했어요'); }}>
              <Typography variant="mono" color="textMuted" numberOfLines={1} style={{ maxWidth: 260 }}>{issued.qrToken}</Typography>
            </Pressable>
            <Button title="이 코드로 바로 결제해 보기" onPress={payNow} style={{ alignSelf: 'stretch' }} />
            <Typography variant="caption" color="textMuted" align="center">다른 기기의 SohPay 로 스캔하거나, 코드 입력 화면에 붙여 넣어도 됩니다.</Typography>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ m: { alignItems: 'center', gap: 4, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1.5, width: 96 } });

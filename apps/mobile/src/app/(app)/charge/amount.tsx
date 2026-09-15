import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Keypad, Screen, Typography } from '@/components/ui';
import { useTheme } from '@/theme';
import { wallet } from '@/lib/api';
import { keys } from '@/lib/query';
import { won } from '@/lib/format';
import { useChargeFlow } from '@/lib/flows';

const QUICK = [10000, 30000, 50000, 100000];
const MAX_INPUT = 2_000_000;

export default function ChargeAmountScreen() {
  const router = useRouter();
  const { colors, radius, space } = useTheme();
  const { data: w } = useQuery({ queryKey: keys.wallet, queryFn: wallet.getWallet });
  const setFlow = useChargeFlow((s) => s.set);
  const [amount, setAmount] = useState(0);

  const room = w ? Math.max(0, w.max_balance - w.balance) : MAX_INPUT;
  const tooMuch = amount > room;
  const notUnit = amount > 0 && amount % 1000 !== 0;
  const valid = amount >= 1000 && !tooMuch && !notUnit;

  const digit = (d: string) => setAmount((a) => Math.min(a * 10 + Number(d), 99_999_999));
  const add = (n: number) => setAmount((a) => Math.min(a + n, 99_999_999));

  return (
    <Screen scroll={false} footer={<Button title={valid ? `${won(amount)} 충전하기` : '충전 금액 입력'} disabled={!valid} onPress={() => { setFlow({ amount }); router.push('/(app)/charge/method'); }} />}>
      <View style={{ flex: 1, justifyContent: 'center', gap: space.sm }}>
        <Typography variant="body2" color="textSub" align="center">얼마를 충전할까요?</Typography>
        <Typography variant="display" align="center" color={amount ? 'text' : 'textMuted'}>{amount ? won(amount) : '0원'}</Typography>
        <View style={{ minHeight: 22 }}>
          {tooMuch ? <Typography variant="body2" color="danger" align="center">보유 한도까지 {won(room)} 더 충전할 수 있어요</Typography>
            : notUnit ? <Typography variant="body2" color="danger" align="center">1,000원 단위로 입력해 주세요</Typography>
            : w ? <Typography variant="caption" color="textMuted" align="center">현재 잔액 {won(w.balance)} · 보유 한도 {won(w.max_balance)}</Typography> : null}
        </View>
      </View>

      <View style={[styles.quick, { marginBottom: space.md }]}>
        {QUICK.map((q) => (
          <Pressable key={q} onPress={() => add(q)} style={[styles.quickBtn, { backgroundColor: colors.surface, borderRadius: radius.pill, borderColor: colors.line }]}>
            <Typography variant="label" color="textSub">+{q >= 10000 ? `${q / 10000}만` : q.toLocaleString()}</Typography>
          </Pressable>
        ))}
      </View>
      <Keypad onDigit={digit} onDelete={() => setAmount((a) => Math.floor(a / 10))} onClear={() => setAmount(0)} leftKey={{ label: '00', onPress: () => setAmount((a) => Math.min(a * 100, 99_999_999)) }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  quick: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  quickBtn: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
});

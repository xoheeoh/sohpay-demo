import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Screen, Typography, toast } from '@/components/ui';
import { BankBadge } from '@/components/BankBadge';
import { useTheme } from '@/theme';
import { accounts, charges, type ChargeMethod } from '@/lib/api';
import { keys } from '@/lib/query';
import { won, newIdempotencyKey } from '@/lib/format';
import { messageOf } from '@/lib/errors';
import { useChargeFlow } from '@/lib/flows';
import { bankOf } from '@/lib/banks';

const METHODS: { key: ChargeMethod; title: string; desc: string }[] = [
  { key: 'BANK_TRANSFER', title: '계좌이체', desc: '등록한 계좌에서 바로 출금' },
  { key: 'VIRTUAL_ACCOUNT', title: '가상계좌', desc: '발급된 계좌로 입금하면 충전' },
];

export default function ChargeMethodScreen() {
  const router = useRouter();
  const { colors, radius, space } = useTheme();
  const flow = useChargeFlow();
  const { data: banks } = useQuery({ queryKey: keys.bankAccounts, queryFn: accounts.listBankAccounts });
  const chargeAccounts = (banks ?? []).filter((b) => b.purpose === 'CHARGE' && b.verified_at);

  const [method, setMethod] = useState<ChargeMethod>('BANK_TRANSFER');
  const [accountId, setAccountId] = useState<string | null>(chargeAccounts.find((a) => a.is_primary)?.id ?? null);
  const [busy, setBusy] = useState(false);

  const needsAccount = method === 'BANK_TRANSFER';
  const valid = !needsAccount || !!(accountId ?? chargeAccounts[0]?.id);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await charges.startCharge({
        amount: flow.amount,
        method,
        bankAccountId: needsAccount ? (accountId ?? chargeAccounts[0]?.id) : null,
        idempotencyKey: newIdempotencyKey(),
      });
      flow.set({ method, bankAccountId: accountId });
      router.push({ pathname: '/(app)/charge/checkout', params: { tx: res.transactionId, url: res.checkoutUrl } });
    } catch (e) {
      toast.error(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen footer={<Button title={`${won(flow.amount)} 결제창 열기`} onPress={submit} loading={busy} disabled={!valid} />}>
      <View style={{ paddingTop: space.lg, gap: space.lg }}>
        <Typography variant="h1">충전 수단을 선택해 주세요</Typography>

        <View style={{ gap: 10 }}>
          {METHODS.map((m) => {
            const on = method === m.key;
            return (
              <Pressable key={m.key} onPress={() => setMethod(m.key)} style={[styles.opt, { borderRadius: radius.lg, borderColor: on ? colors.primary : colors.line, backgroundColor: on ? colors.primarySoft : colors.surface }]}>
                <View style={{ flex: 1 }}>
                  <Typography variant="h3" color={on ? 'primary' : 'text'}>{m.title}</Typography>
                  <Typography variant="caption" color="textMuted">{m.desc}</Typography>
                </View>
                <View style={[styles.radio, { borderColor: on ? colors.primary : colors.lineStrong }]}>{on ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}</View>
              </Pressable>
            );
          })}
        </View>

        {needsAccount ? (
          <Card style={{ gap: 6 }}>
            <Typography variant="label" color="textSub">출금 계좌</Typography>
            {chargeAccounts.length === 0 ? (
              <View style={{ gap: 10 }}>
                <Typography variant="body2" color="textMuted">등록된 충전 계좌가 없어요.</Typography>
                <Button title="계좌 등록하기" variant="secondary" size="md" onPress={() => router.push({ pathname: '/(app)/accounts/add', params: { purpose: 'CHARGE' } })} />
              </View>
            ) : (
              chargeAccounts.map((a) => {
                const on = (accountId ?? chargeAccounts[0].id) === a.id;
                return (
                  <Pressable key={a.id} onPress={() => setAccountId(a.id)} style={styles.acct}>
                    <BankBadge code={a.bank_code} size={32} />
                    <View style={{ flex: 1 }}>
                      <Typography variant="body1">{bankOf(a.bank_code).name} {a.account_no_masked}</Typography>
                      <Typography variant="caption" color="textMuted">{a.holder_name}</Typography>
                    </View>
                    <View style={[styles.radio, { borderColor: on ? colors.primary : colors.lineStrong }]}>{on ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}</View>
                  </Pressable>
                );
              })
            )}
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderWidth: 1.5 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  acct: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
});

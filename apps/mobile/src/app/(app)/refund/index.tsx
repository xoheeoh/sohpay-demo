import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Keypad, Screen, Typography } from '@/components/ui';
import { BankBadge } from '@/components/BankBadge';
import { useTheme } from '@/theme';
import { accounts, wallet } from '@/lib/api';
import { keys } from '@/lib/query';
import { won } from '@/lib/format';
import { bankOf } from '@/lib/banks';

export default function RefundScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const { data: w } = useQuery({ queryKey: keys.wallet, queryFn: wallet.getWallet });
  const { data: banks, isLoading } = useQuery({ queryKey: keys.bankAccounts, queryFn: accounts.listBankAccounts });
  const refundAcct = (banks ?? []).find((b) => b.purpose === 'REFUND' && b.is_primary && b.verified_at) ?? (banks ?? []).find((b) => b.purpose === 'REFUND' && b.verified_at);

  const [amount, setAmount] = useState(0);
  const balance = w?.balance ?? 0;
  const over = amount > balance;
  const valid = amount > 0 && !over && !!refundAcct;

  return (
    <Screen
      scroll={false}
      footer={
        refundAcct ? (
          <Button title={valid ? `${won(amount)} 환불 신청` : '환불 금액 입력'} disabled={!valid} onPress={() => router.push({ pathname: '/(app)/refund/pin', params: { amount: String(amount), accountId: refundAcct.id } })} />
        ) : (
          <Button title="환불 계좌 등록하기" onPress={() => router.push({ pathname: '/(app)/accounts/add', params: { purpose: 'REFUND' } })} disabled={isLoading} />
        )
      }>
      <View style={{ paddingTop: space.lg }}>
        <Card style={styles.acct}>
          {refundAcct ? (
            <>
              <BankBadge code={refundAcct.bank_code} />
              <View style={{ flex: 1 }}>
                <Typography variant="caption" color="textMuted">환불 받을 계좌</Typography>
                <Typography variant="body1">{bankOf(refundAcct.bank_code).name} {refundAcct.account_no_masked}</Typography>
              </View>
              <Typography variant="label" color="primary" onPress={() => router.push('/(app)/accounts')}>변경</Typography>
            </>
          ) : (
            <Typography variant="body2" color="textSub">{isLoading ? '계좌를 불러오는 중…' : '등록된 환불 계좌가 없어요. 1원 인증으로 등록해 주세요.'}</Typography>
          )}
        </Card>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', gap: space.sm }}>
        <Typography variant="body2" color="textSub" align="center">얼마를 환불할까요?</Typography>
        <Typography variant="display" align="center" color={amount ? 'text' : 'textMuted'}>{amount ? won(amount) : '0원'}</Typography>
        <View style={{ minHeight: 22 }}>
          {over ? <Typography variant="body2" color="danger" align="center">잔액보다 많아요</Typography>
            : <Typography variant="caption" color="textMuted" align="center" onPress={() => setAmount(balance)}>환불 가능 잔액 {won(balance)} · 전액 환불</Typography>}
        </View>
      </View>

      <Keypad onDigit={(d) => setAmount((a) => Math.min(a * 10 + Number(d), 99_999_999))} onDelete={() => setAmount((a) => Math.floor(a / 10))} onClear={() => setAmount(0)} leftKey={{ label: '전액', onPress: () => setAmount(balance) }} />
    </Screen>
  );
}

const styles = StyleSheet.create({ acct: { flexDirection: 'row', alignItems: 'center', gap: 12 } });

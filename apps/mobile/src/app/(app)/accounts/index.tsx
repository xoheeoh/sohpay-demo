import { Alert, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Card, EmptyState, ListRow, Screen, Skeleton, Typography, toast } from '@/components/ui';
import { BankBadge } from '@/components/BankBadge';
import { useTheme } from '@/theme';
import { accounts, type BankAccount } from '@/lib/api';
import { keys, queryClient } from '@/lib/query';
import { bankOf } from '@/lib/banks';
import { messageOf } from '@/lib/errors';

function Section({ title, rows, onAdd }: { title: string; rows: BankAccount[]; onAdd: () => void }) {
  const setPrimary = useMutation({
    mutationFn: accounts.setPrimaryBankAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.bankAccounts }),
    onError: (e) => toast.error(messageOf(e)),
  });
  const remove = useMutation({
    mutationFn: accounts.removeBankAccount,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: keys.bankAccounts }); toast.info('계좌를 삭제했어요'); },
    onError: (e) => toast.error(messageOf(e)),
  });

  const askRemove = (a: BankAccount) => {
    const run = () => remove.mutate(a.id);
    if (Platform.OS === 'web') return void (globalThis.confirm?.('이 계좌를 삭제할까요?') && run());
    Alert.alert('계좌 삭제', `${bankOf(a.bank_code).name} ${a.account_no_masked} 계좌를 삭제할까요?`, [{ text: '취소', style: 'cancel' }, { text: '삭제', style: 'destructive', onPress: run }]);
  };

  return (
    <Card padded={false} style={{ paddingHorizontal: 18, paddingTop: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Typography variant="h3">{title}</Typography>
        <Typography variant="label" color="primary" onPress={onAdd}>+ 등록</Typography>
      </View>
      {rows.length === 0 ? (
        <EmptyState title="등록된 계좌가 없어요" />
      ) : rows.map((a, i) => (
        <ListRow
          key={a.id}
          left={<BankBadge code={a.bank_code} />}
          title={`${bankOf(a.bank_code).name} ${a.account_no_masked}`}
          subtitle={`${a.holder_name}${a.is_primary ? ' · 대표계좌' : ''}`}
          value={a.is_primary ? undefined : '대표로'}
          valueColor="primary"
          onPress={() => (a.is_primary ? askRemove(a) : setPrimary.mutate(a.id))}
          divider={i < rows.length - 1}
        />
      ))}
      {rows.length > 0 ? <Typography variant="caption" color="textMuted" style={{ paddingBottom: 12 }}>대표계좌를 누르면 삭제, 다른 계좌를 누르면 대표로 바꿉니다.</Typography> : null}
    </Card>
  );
}

export default function AccountsScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const q = useQuery({ queryKey: keys.bankAccounts, queryFn: accounts.listBankAccounts });

  return (
    <Screen>
      <View style={{ paddingTop: space.lg, gap: space.lg }}>
        {q.isLoading ? <Skeleton height={140} radius={16} /> : (
          <>
            <Section title="환불 계좌" rows={(q.data ?? []).filter((b) => b.purpose === 'REFUND')} onAdd={() => router.push({ pathname: '/(app)/accounts/add', params: { purpose: 'REFUND' } })} />
            <Section title="충전(출금) 계좌" rows={(q.data ?? []).filter((b) => b.purpose === 'CHARGE')} onAdd={() => router.push({ pathname: '/(app)/accounts/add', params: { purpose: 'CHARGE' } })} />
          </>
        )}
        <Button title="새 계좌 등록 (1원 인증)" variant="secondary" onPress={() => router.push({ pathname: '/(app)/accounts/add', params: { purpose: 'REFUND' } })} />
      </View>
    </Screen>
  );
}

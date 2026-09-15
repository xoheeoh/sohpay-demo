import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, EmptyState, Skeleton, Typography } from '@/components/ui';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { TransactionRow } from '@/components/dashboard/TransactionRow';
import { useTheme } from '@/theme';
import { Wordmark } from '@/components/brand/Wordmark';
import { wallet } from '@/lib/api';
import { keys } from '@/lib/query';
import { useAuth } from '@/lib/auth/store';
import { useChargeFlow, usePayFlow } from '@/lib/flows';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, space } = useTheme();
  const profile = useAuth((s) => s.profile);

  const w = useQuery({ queryKey: keys.wallet, queryFn: wallet.getWallet });
  const recent = useQuery({ queryKey: keys.recent, queryFn: wallet.getRecent });
  const refreshing = w.isRefetching || recent.isRefetching;

  const goCharge = () => { useChargeFlow.getState().reset(); router.push('/(app)/charge/amount'); };
  const goPay = () => { usePayFlow.getState().reset(); router.push('/(app)/pay/scan'); };

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.md, paddingHorizontal: space.xl, paddingBottom: space.xxxl, gap: space.xl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { w.refetch(); recent.refetch(); }} tintColor={colors.primary} />}>
      <View style={styles.top}>
        <Wordmark height={24} />
        <Typography variant="label" color="textMuted" onPress={() => router.push('/(app)/demo/qr')}>데모 가맹점 →</Typography>
      </View>

      <BalanceCard balance={w.data?.balance} name={profile?.name} loading={w.isLoading} onCharge={goCharge} onPay={goPay} />

      <View style={styles.quick}>
        <Card style={styles.quickItem} onPress={() => router.push('/(app)/refund')}>
          <Typography variant="h3">환불</Typography>
          <Typography variant="caption" color="textMuted">잔액을 계좌로</Typography>
        </Card>
        <Card style={styles.quickItem} onPress={() => router.push('/(app)/pay/code')}>
          <Typography variant="h3">코드 입력</Typography>
          <Typography variant="caption" color="textMuted">QR 없이 결제</Typography>
        </Card>
        <Card style={styles.quickItem} onPress={() => router.push('/(app)/accounts')}>
          <Typography variant="h3">계좌</Typography>
          <Typography variant="caption" color="textMuted">등록·관리</Typography>
        </Card>
      </View>

      <Card>
        <View style={styles.sectionHead}>
          <Typography variant="h3">최근 이용 내역</Typography>
          <Typography variant="label" color="primary" onPress={() => router.push('/(app)/(tabs)/history')}>전체보기</Typography>
        </View>
        {recent.isLoading ? (
          <View style={{ gap: 14, paddingTop: 12 }}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={42} radius={10} />)}</View>
        ) : !recent.data?.length ? (
          <EmptyState title="아직 이용 내역이 없어요" body="충전하고 첫 결제를 해보세요" />
        ) : (
          recent.data.slice(0, 8).map((t) => (
            <TransactionRow
              key={t.id}
              type={t.type}
              status={t.status}
              amount={t.amount}
              canceledAmount={t.canceled_amount}
              title={t.merchant_name ?? t.goods_name ?? '거래'}
              emoji={t.merchant_emoji}
              createdAt={t.created_at}
              onPress={() => router.push({ pathname: '/(app)/history/[id]', params: { id: t.id } })}
            />
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quick: { flexDirection: 'row', gap: 10 },
  quickItem: { flex: 1, gap: 2, paddingVertical: 16, paddingHorizontal: 14 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
});

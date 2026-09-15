import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, Skeleton, Typography } from '@/components/ui';
import { TransactionRow } from '@/components/dashboard/TransactionRow';
import { useTheme } from '@/theme';
import { wallet, type TransactionType } from '@/lib/api';
import { keys } from '@/lib/query';
import { dateLabel, daysAgo } from '@/lib/format';

type TypeFilter = 'ALL' | TransactionType;
type Period = 7 | 30 | 90;

const TYPES: { key: TypeFilter; label: string }[] = [
  { key: 'ALL', label: '전체' }, { key: 'PAYMENT', label: '결제' }, { key: 'CHARGE', label: '충전' }, { key: 'REFUND', label: '환불' },
];
const PERIODS: { key: Period; label: string }[] = [{ key: 7, label: '1주일' }, { key: 30, label: '1개월' }, { key: 90, label: '3개월' }];

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const { colors, radius } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.chip, { borderRadius: radius.pill, backgroundColor: on ? colors.text : colors.surface, borderColor: on ? colors.text : colors.line }]}>
      <Typography variant="label" style={{ color: on ? colors.bg : colors.textSub }}>{label}</Typography>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, space } = useTheme();
  const [type, setType] = useState<TypeFilter>('ALL');
  const [period, setPeriod] = useState<Period>(30);
  const [status, setStatus] = useState<'ALL' | 'APPROVED' | 'CANCELED'>('ALL');

  const range = useMemo(() => ({ from: daysAgo(period), to: new Date() }), [period]);

  const q = useInfiniteQuery({
    queryKey: keys.transactions({ type, period, status }),
    queryFn: ({ pageParam }) => wallet.listTransactions({ type, status, from: range.from, to: range.to, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.hasMore ? pages.length : undefined),
  });

  const rows = q.data?.pages.flatMap((p) => p.rows) ?? [];

  // 날짜 구분선을 위해 날짜가 바뀌는 지점을 기록
  const withHeaders = rows.map((r, i) => ({ ...r, showHeader: i === 0 || dateLabel(rows[i - 1].created_at) !== dateLabel(r.created_at) }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: space.xl, paddingTop: space.md, gap: space.md }}>
        <Typography variant="h1">이용 내역</Typography>
        <View style={styles.chips}>{TYPES.map((t) => <Chip key={t.key} label={t.label} on={type === t.key} onPress={() => setType(t.key)} />)}</View>
        <View style={styles.chips}>
          {PERIODS.map((p) => <Chip key={p.key} label={p.label} on={period === p.key} onPress={() => setPeriod(p.key)} />)}
          <View style={{ width: 8 }} />
          <Chip label="취소만" on={status === 'CANCELED'} onPress={() => setStatus(status === 'CANCELED' ? 'ALL' : 'CANCELED')} />
        </View>
      </View>

      {q.isLoading ? (
        <View style={{ padding: space.xl, gap: 14 }}>{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={42} radius={10} />)}</View>
      ) : (
        <FlatList
          data={withHeaders}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: space.xxxl }}
          onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
          onEndReachedThreshold={0.4}
          refreshing={q.isRefetching}
          onRefresh={() => q.refetch()}
          ListEmptyComponent={<EmptyState title="해당 기간에 내역이 없어요" />}
          renderItem={({ item }) => (
            <>
              {item.showHeader ? <Typography variant="label" color="textMuted" style={{ marginTop: 18, marginBottom: 4 }}>{dateLabel(item.created_at)}</Typography> : null}
              <TransactionRow
                type={item.type}
                status={item.status}
                amount={item.amount}
                canceledAmount={item.canceled_amount}
                title={item.merchant?.name ?? item.goods_name ?? '거래'}
                emoji={item.merchant?.logo_emoji}
                createdAt={item.created_at}
                showDate={false}
                onPress={() => router.push({ pathname: '/(app)/history/[id]', params: { id: item.id } })}
              />
            </>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1 },
});

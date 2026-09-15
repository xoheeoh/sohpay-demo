import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Card, Screen, Skeleton, Typography, toast } from '@/components/ui';
import { TYPE_LABEL, statusBadge } from '@/components/dashboard/TransactionRow';
import { useTheme } from '@/theme';
import { payments, wallet } from '@/lib/api';
import { invalidateMoney, keys } from '@/lib/query';
import { dateTimeLabel, won } from '@/lib/format';
import { messageOf } from '@/lib/errors';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, space } = useTheme();
  const q = useQuery({ queryKey: keys.transaction(id), queryFn: () => wallet.getTransaction(id) });
  const [busy, setBusy] = useState(false);
  const t = q.data;

  const cancel = async () => {
    setBusy(true);
    try {
      await payments.cancelPayment(id);
      invalidateMoney();
      toast.info('결제가 취소되었어요');
    } catch (e) {
      toast.error(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmCancel = () => {
    if (Platform.OS === 'web') return void (globalThis.confirm?.('이 결제를 전액 취소할까요?') && cancel());
    Alert.alert('결제 취소', '이 결제를 전액 취소할까요?', [{ text: '아니요', style: 'cancel' }, { text: '취소하기', style: 'destructive', onPress: cancel }]);
  };

  if (q.isLoading || !t) {
    return <Screen><View style={{ paddingTop: space.xl, gap: 16 }}>{[0, 1, 2].map((i) => <Skeleton key={i} height={80} radius={16} />)}</View></Screen>;
  }

  const badge = statusBadge(t.status);
  const cancelable = t.type === 'PAYMENT' && (t.status === 'APPROVED' || t.status === 'PARTIALLY_CANCELED');
  const remaining = t.amount - t.canceled_amount;
  const direction = t.type === 'CHARGE' ? '+' : '-';

  return (
    <Screen footer={cancelable ? <Button title="이 결제 취소하기 (데모: 가맹점 취소 흉내)" variant="danger" onPress={confirmCancel} loading={busy} /> : undefined}>
      <View style={{ paddingTop: space.xl, alignItems: 'center', gap: space.sm }}>
        <Typography variant="display">{t.merchant?.logo_emoji ?? (t.type === 'CHARGE' ? '⬆️' : t.type === 'REFUND' ? '↩️' : '🧾')}</Typography>
        <Typography variant="h2">{t.merchant?.name ?? t.goods_name ?? TYPE_LABEL[t.type]}</Typography>
        <Typography variant="display" color={t.status === 'CANCELED' || t.status === 'FAILED' ? 'textMuted' : t.type === 'CHARGE' ? 'primary' : 'text'} style={t.status === 'CANCELED' && styles.strike}>
          {direction}{won(t.amount)}
        </Typography>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Badge label={TYPE_LABEL[t.type]} tone="primary" />
          {badge ? <Badge label={badge.label} tone={badge.tone} /> : <Badge label="승인" tone="success" />}
        </View>
      </View>

      <Card style={{ gap: 12, marginTop: space.xxl }}>
        <Row k="거래 일시" v={dateTimeLabel(t.approved_at ?? t.created_at)} />
        {t.goods_name ? <Row k="상품" v={t.goods_name} /> : null}
        {t.merchant ? <Row k="가맹점" v={`${t.merchant.name} (${t.merchant.mid})`} /> : null}
        {t.charge_method ? <Row k="충전 수단" v={t.charge_method === 'BANK_TRANSFER' ? '계좌이체' : '가상계좌'} /> : null}
        <Row k="주문번호" v={t.order_no} mono />
        {t.balance_after != null ? <Row k="거래 후 잔액" v={won(t.balance_after)} /> : null}
      </Card>

      {t.canceled_amount > 0 ? (
        <Card style={{ gap: 12, marginTop: space.md, borderColor: colors.danger }}>
          <Row k="취소 금액" v={won(t.canceled_amount)} />
          <Row k="취소 일시" v={t.canceled_at ? dateTimeLabel(t.canceled_at) : '—'} />
          {t.status === 'PARTIALLY_CANCELED' ? <Row k="남은 결제 금액" v={won(remaining)} /> : null}
        </Card>
      ) : null}

      {t.failure_code ? (
        <Card style={{ marginTop: space.md }}>
          <Row k="실패 사유" v={t.failure_code} mono />
        </Card>
      ) : null}
    </Screen>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <View style={styles.row}>
      <Typography variant="body2" color="textSub">{k}</Typography>
      <Typography variant={mono ? 'mono' : 'body1'} weight="600" numberOfLines={1} style={{ flexShrink: 1, textAlign: 'right' }}>{v}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  strike: { textDecorationLine: 'line-through' },
});

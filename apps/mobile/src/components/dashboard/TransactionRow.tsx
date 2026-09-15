import { StyleSheet, View } from 'react-native';
import { Badge, Typography } from '@/components/ui';
import { useTheme } from '@/theme';
import { dateLabel, timeLabel, wonSigned } from '@/lib/format';
import type { TransactionStatus, TransactionType } from '@/lib/api';
import { Pressable } from 'react-native';

type Props = {
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  canceledAmount: number;
  title: string;
  emoji?: string | null;
  createdAt: string;
  onPress?: () => void;
  showDate?: boolean;
};

export const TYPE_LABEL: Record<TransactionType, string> = { CHARGE: '충전', PAYMENT: '결제', REFUND: '환불' };

export function statusBadge(status: TransactionStatus): { label: string; tone: 'neutral' | 'danger' | 'warn' | 'success' } | null {
  switch (status) {
    case 'CANCELED': return { label: '취소', tone: 'danger' };
    case 'PARTIALLY_CANCELED': return { label: '부분취소', tone: 'warn' };
    case 'FAILED': return { label: '실패', tone: 'neutral' };
    case 'PENDING': return { label: '대기', tone: 'neutral' };
    default: return null;
  }
}

export function TransactionRow({ type, status, amount, canceledAmount, title, emoji, createdAt, onPress, showDate = true }: Props) {
  const { colors, radius } = useTheme();
  const direction = type === 'CHARGE' ? 'in' : 'out';
  const net = amount - canceledAmount;
  const badge = statusBadge(status);
  const dimmed = status === 'CANCELED' || status === 'FAILED';

  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, pressed && onPress ? { opacity: 0.6 } : null]}>
      <View style={[styles.icon, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md }]}>
        <Typography variant="h3">{emoji ?? (type === 'CHARGE' ? '⬆️' : type === 'REFUND' ? '↩️' : '🧾')}</Typography>
      </View>
      <View style={styles.body}>
        <Typography variant="body1" numberOfLines={1} color={dimmed ? 'textMuted' : 'text'}>{title}</Typography>
        <View style={styles.meta}>
          <Typography variant="caption" color="textMuted">{TYPE_LABEL[type]} · {showDate ? `${dateLabel(createdAt)} ` : ''}{timeLabel(createdAt)}</Typography>
          {badge ? <Badge label={badge.label} tone={badge.tone} /> : null}
        </View>
      </View>
      <View style={styles.amount}>
        <Typography variant="body1" weight="700" color={dimmed ? 'textMuted' : direction === 'in' ? 'primary' : 'text'} style={dimmed && styles.strike}>
          {wonSigned(dimmed ? amount : net, direction)}
        </Typography>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  icon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amount: { alignItems: 'flex-end' },
  strike: { textDecorationLine: 'line-through' },
});

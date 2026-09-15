import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Skeleton, Typography } from '@/components/ui';
import { useTheme } from '@/theme';
import { won } from '@/lib/format';

type Props = { balance?: number; name?: string; loading?: boolean; onCharge: () => void; onPay: () => void };

export function BalanceCard({ balance, name, loading, onCharge, onPay }: Props) {
  const { radius, scheme } = useTheme();
  const colors = scheme === 'dark' ? (['#1B3A8A', '#123C9C', '#0E2C70'] as const) : (['#2F6BFF', '#1E63F0', '#174ECC'] as const);

  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, { borderRadius: radius.xl }]}>
      <Typography variant="label" style={styles.dim}>{name ? `${name}님의 잔액` : '내 잔액'}</Typography>
      <View style={{ height: 6 }} />
      {loading || balance == null ? (
        <Skeleton width={180} height={40} radius={10} style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
      ) : (
        <Typography variant="display" color="textOnDark" accessibilityLabel={`잔액 ${won(balance)}`}>{won(balance)}</Typography>
      )}
      <View style={styles.actions}>
        <Button title="충전" size="md" onPress={onCharge} style={[styles.btn, { backgroundColor: 'rgba(255,255,255,0.18)' }]} />
        <Button title="결제하기" size="md" onPress={onPay} style={[styles.btn, { backgroundColor: '#fff' }]} variant="secondary" />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { padding: 22, gap: 4 },
  dim: { color: 'rgba(255,255,255,0.78)' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  btn: { flex: 1 },
});

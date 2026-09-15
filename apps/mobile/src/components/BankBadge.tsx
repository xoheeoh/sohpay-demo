import { View } from 'react-native';
import { Typography } from '@/components/ui';
import { bankOf } from '@/lib/banks';

/** 은행 로고 대신 쓰는 이니셜 배지. */
export function BankBadge({ code, size = 36 }: { code: string; size?: number }) {
  const bank = bankOf(code);
  const initial = bank.name.replace(/은행|뱅크/g, '').slice(0, 2);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bank.color, alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="caption" style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.34 }}>{initial}</Typography>
    </View>
  );
}

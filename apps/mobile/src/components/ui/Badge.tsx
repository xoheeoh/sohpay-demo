import { View } from 'react-native';
import { useTheme } from '@/theme';
import { Typography } from './Typography';

type Tone = 'neutral' | 'primary' | 'danger' | 'success' | 'warn';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const { colors, radius } = useTheme();
  const map = {
    neutral: [colors.surfaceAlt, colors.textSub],
    primary: [colors.primarySoft, colors.primary],
    danger: [colors.dangerSoft, colors.danger],
    success: [colors.successSoft, colors.success],
    warn: [colors.warnSoft, colors.warn],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Typography variant="caption" style={{ color: fg, fontWeight: '600' }}>{label}</Typography>
    </View>
  );
}

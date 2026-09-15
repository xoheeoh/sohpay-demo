import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';
import { Typography } from './Typography';

type Props = {
  title: string;
  subtitle?: string;
  value?: string;
  valueColor?: 'text' | 'textSub' | 'danger' | 'success' | 'primary';
  left?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  divider?: boolean;
};

export function ListRow({ title, subtitle, value, valueColor = 'text', left, onPress, chevron, divider = true }: Props) {
  const { colors, space } = useTheme();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { paddingVertical: space.lg, borderBottomColor: colors.line, borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0 },
        pressed && onPress ? { opacity: 0.6 } : null,
      ]}>
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={styles.body}>
        <Typography variant="body1" numberOfLines={1}>{title}</Typography>
        {subtitle ? <Typography variant="caption" color="textMuted">{subtitle}</Typography> : null}
      </View>
      {value ? <Typography variant="body1" color={valueColor} weight="600">{value}</Typography> : null}
      {chevron ? <Typography variant="body1" color="textMuted" style={{ marginLeft: 6 }}>›</Typography> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  left: { width: 40, alignItems: 'center' },
  body: { flex: 1, gap: 2 },
});

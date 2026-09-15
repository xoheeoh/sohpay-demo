import { ActivityIndicator, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { Typography } from './Typography';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'lg' | 'md' | 'sm';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, variant = 'primary', size = 'lg', disabled, loading, style }: Props) {
  const { colors, radius } = useTheme();
  const inactive = disabled || loading;

  const bg = {
    primary: inactive ? colors.disabled : colors.primary,
    secondary: colors.primarySoft,
    ghost: 'transparent',
    danger: colors.dangerSoft,
  }[variant];

  const fg = {
    primary: inactive ? colors.onDisabled : colors.onPrimary,
    secondary: colors.primary,
    ghost: colors.textSub,
    danger: colors.danger,
  }[variant];

  const height = { lg: 54, md: 46, sm: 38 }[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, height, borderRadius: radius.md, opacity: pressed && !inactive ? 0.85 : 1 },
        variant === 'ghost' && { borderWidth: 1, borderColor: colors.line },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Typography variant={size === 'sm' ? 'label' : 'h3'} style={{ color: fg }}>
          {title}
        </Typography>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
});

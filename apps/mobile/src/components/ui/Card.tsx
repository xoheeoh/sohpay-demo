import { PropsWithChildren } from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

type Props = PropsWithChildren<{ onPress?: () => void; style?: StyleProp<ViewStyle>; padded?: boolean }>;

export function Card({ children, onPress, style, padded = true }: Props) {
  const { colors, radius, space } = useTheme();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderRadius: radius.lg, borderColor: colors.line },
        padded && { padding: space.xl },
        pressed && onPress ? { opacity: 0.9 } : null,
        style,
      ]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({ card: { borderWidth: StyleSheet.hairlineWidth } });

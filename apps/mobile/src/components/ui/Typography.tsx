import { Text, TextProps, TextStyle } from 'react-native';
import { ThemeColors, TypeKey, useTheme } from '@/theme';

type Props = TextProps & {
  variant?: TypeKey;
  color?: keyof ThemeColors;
  align?: TextStyle['textAlign'];
  weight?: TextStyle['fontWeight'];
};

export function Typography({ variant = 'body1', color = 'text', align, weight, style, ...rest }: Props) {
  const { colors, type } = useTheme();
  return (
    <Text
      {...rest}
      style={[type[variant], { color: colors[color], textAlign: align }, weight ? { fontWeight: weight } : null, style]}
    />
  );
}

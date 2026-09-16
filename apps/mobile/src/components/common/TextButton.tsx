import { Pressable, StyleSheet, ViewStyle } from 'react-native';

import Typography from './Typography';
import { theme } from '@styles';

interface TextButtonProps {
  label: string;
  onPress: () => void;
  size: 'large' | 'medium' | 'small';
  style?: ViewStyle;
}

/** 배경 없는 텍스트 버튼 */
const TextButton: React.FC<TextButtonProps> = ({ label, onPress, size = 'large', style }) => {
  const height = size === 'large' ? 48 : size === 'medium' ? 40 : 32;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        { height, paddingHorizontal: size === 'small' ? 8 : 12, opacity: pressed ? 0.5 : 1 },
        style,
      ]}>
      <Typography mode={size === 'small' ? 'body2' : 'subtitle3'} color="gray600">
        {label}
      </Typography>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.sm },
});

export default TextButton;
export { TextButton };

import { Animated, Pressable, StyleSheet, ViewStyle } from 'react-native';

import Typography from './Typography';
import { usePressScale } from './usePressScale';
import { theme } from '@styles';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  size: 'xlarge' | 'large' | 'medium' | 'small';
  disabled?: boolean;
  style?: ViewStyle;
}

const HEIGHT = { xlarge: 56, large: 52, medium: 40, small: 32 } as const;
const RADIUS = {
  xlarge: theme.radius.lg,
  large: theme.radius.md,
  medium: theme.radius.sm,
  small: theme.radius.sm,
} as const;

/** 보조 액션 버튼 - 연한 회색 채움 */
const SecondaryButton: React.FC<SecondaryButtonProps> = ({ label, onPress, size = 'large', disabled, style }) => {
  const press = usePressScale();
  const textMode = size === 'small' ? 'subtitle4' : size === 'medium' ? 'subtitle3' : 'subtitle2';

  return (
    <Animated.View style={[!disabled && press.style, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={({ pressed }) => [
          styles.base,
          {
            height: HEIGHT[size],
            paddingHorizontal: size === 'small' ? 12 : 20,
            borderRadius: RADIUS[size],
            backgroundColor: pressed ? theme.colors.gray150 : theme.colors.gray100,
          },
        ]}>
        <Typography mode={textMode} color={disabled ? 'gray300' : 'gray800'}>
          {label}
        </Typography>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});

export default SecondaryButton;
export { SecondaryButton };

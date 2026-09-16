import { Animated, Pressable, StyleSheet, ViewStyle } from 'react-native';

import Typography from './Typography';
import { usePressScale } from './usePressScale';
import { theme } from '@styles';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  size: 'xlarge' | 'large' | 'medium' | 'small';
  disabled?: boolean;
  /** 배경색 오버라이드 (흰색을 넘기면 글자는 진한 회색으로) */
  buttonColor?: string;
  style?: ViewStyle;
  /** 키보드 위에 붙는 하단 버튼이면 모서리를 직각으로 */
  keyboardVisible?: boolean;
}

const HEIGHT = { xlarge: 56, large: 52, medium: 40, small: 32 } as const;
const RADIUS = {
  xlarge: theme.radius.lg,
  large: theme.radius.md,
  medium: theme.radius.sm,
  small: theme.radius.sm,
} as const;

/** 채워진 기본 액션 버튼 */
const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  size = 'large',
  disabled,
  buttonColor = theme.colors.primary,
  style,
  keyboardVisible = false,
}) => {
  const press = usePressScale();
  const isWhite = buttonColor === theme.colors.white;
  const textColor = disabled ? 'gray400' : isWhite ? 'gray900' : 'white';
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
            borderRadius: keyboardVisible ? 0 : RADIUS[size],
            backgroundColor: disabled
              ? theme.colors.disabled
              : pressed && !isWhite
                ? theme.colors.primaryDark
                : buttonColor,
          },
          isWhite && !disabled && styles.whiteBorder,
        ]}>
        <Typography mode={textMode} color={textColor}>
          {label}
        </Typography>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  whiteBorder: { borderWidth: 1, borderColor: theme.colors.line },
});

export default PrimaryButton;
export { PrimaryButton };

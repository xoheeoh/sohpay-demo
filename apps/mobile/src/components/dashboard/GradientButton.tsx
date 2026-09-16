import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { Typography } from '@components/common';
import { usePressScale } from '@components/common/usePressScale';
import { theme } from '@styles';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
}

/** 결제하기 - 대시보드의 주 액션. 어두운 단색 카드로 잔액 카드(파랑)와 대비를 준다 */
const GradientButton: React.FC<GradientButtonProps> = ({ label, onPress }) => {
  const press = usePressScale();

  return (
    <Pressable onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut} accessibilityRole="button">
      <Animated.View style={[styles.button, press.style]}>
        <View style={styles.iconBox}>
          <Icon source="qrcode-scan" size={22} color={theme.colors.gray900} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Typography mode="subtitle1" color="white">
            {label}
          </Typography>
          <Typography mode="caption1" color="gray300">
            가맹점 QR을 스캔하거나 코드를 입력해요
          </Typography>
        </View>
        <Icon source="chevron-right" size={22} color={theme.colors.gray400} />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.gray900,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GradientButton;
export { GradientButton };

import { Pressable, StyleSheet } from 'react-native';
import { Icon } from 'react-native-paper';

import { theme } from '@styles';

/**
 * 상단 바(헤더, 대시보드 내비)에 놓이는 둥근 회색 아이콘 버튼.
 * 대시보드의 햄버거(menu) 버튼과 헤더의 닫기(close) 버튼이 같은 위치·같은 모양이 되도록 한 곳에서 정의한다.
 * 크기를 바꾸면 두 곳이 함께 바뀐다.
 */
export const NAV_ICON_BUTTON_SIZE = 40;

interface NavIconButtonProps {
  /** react-native-paper Icon 이름 (예: 'menu', 'close') */
  icon: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

const NavIconButton: React.FC<NavIconButtonProps> = ({ icon, onPress, accessibilityLabel }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    onPress={onPress}>
    <Icon source={icon} size={22} color={theme.colors.gray800} />
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    width: NAV_ICON_BUTTON_SIZE,
    height: NAV_ICON_BUTTON_SIZE,
    borderRadius: NAV_ICON_BUTTON_SIZE / 2,
    backgroundColor: theme.colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: { backgroundColor: theme.colors.gray150 },
});

export default NavIconButton;
export { NavIconButton };

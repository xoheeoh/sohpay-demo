import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '@typ/navigation';
import Typography from './Typography';
import { NAV_ICON_BUTTON_SIZE, NavIconButton } from './NavIconButton';
import { theme } from '@styles';

interface HeaderProps {
  bgColor: string;
  title: string;
  leftButton?: boolean;
  leftEvent?: () => void;
  rightButton?: boolean;
  rightEvent?: () => void;
}

const Header: React.FC<HeaderProps> = ({ bgColor, title, leftButton, leftEvent, rightButton, rightEvent }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={{ backgroundColor: bgColor }} edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable
          onPress={
            leftButton
              ? () => {
                  if (leftEvent) {
                    leftEvent(); // leftEvent를 우선적으로 실행
                  } else {
                    navigation.goBack(); // leftEvent가 없을 경우에만 뒤로가기 호출
                  }
                }
              : () => undefined // leftButton이 false일 때 onPress는 undefined
          }
          style={({ pressed }) => [styles.button, pressed && leftButton && styles.pressed]}>
          {leftButton && <Icon source="chevron-left" size={26} color={theme.colors.gray900} />}
        </Pressable>
        <Typography mode="subtitle2" color="gray900" numberOfLines={1} style={styles.title}>
          {title}
        </Typography>
        {/* 닫기 버튼: 대시보드 햄버거 버튼(DashboardNav)과 같은 컴포넌트를 써서 위치·모양이 정확히 일치한다 */}
        {rightButton ? (
          <NavIconButton
            icon="close"
            accessibilityLabel="닫기"
            onPress={() => {
              if (rightEvent) {
                rightEvent(); // rightEvent를 우선적으로 실행
              } else {
                navigation.goBack(); // rightEvent가 없을 경우에만 뒤로가기 호출
              }
            }}
          />
        ) : (
          <View style={styles.button} /> // 버튼이 없어도 제목이 가운데 오도록 같은 크기의 빈 칸을 둔다
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, // 대시보드 내비(DashboardNav)와 같은 좌우 여백 → 닫기 버튼이 햄버거 버튼과 같은 자리에 온다
  },
  title: { flex: 1, textAlign: 'center' },
  button: {
    width: NAV_ICON_BUTTON_SIZE,
    height: NAV_ICON_BUTTON_SIZE,
    borderRadius: NAV_ICON_BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: { backgroundColor: theme.colors.gray100 },
});

export default Header;
export { Header };

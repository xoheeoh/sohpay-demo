import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '@typ/navigation';
import Typography from './Typography';
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
        <Pressable
          onPress={
            rightButton
              ? () => {
                  if (rightEvent) {
                    rightEvent(); // rightEvent를 우선적으로 실행
                  } else {
                    navigation.goBack(); // rightEvent가 없을 경우에만 뒤로가기 호출
                  }
                }
              : () => undefined // rightButton이 false일 때 onPress는 undefined
          }
          style={({ pressed }) => [styles.button, pressed && rightButton && styles.pressed]}>
          {rightButton && <Icon source="close" size={24} color={theme.colors.gray900} />}
        </Pressable>
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
    paddingHorizontal: 8,
  },
  title: { flex: 1, textAlign: 'center' },
  button: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  pressed: { backgroundColor: theme.colors.gray100 },
});

export default Header;
export { Header };

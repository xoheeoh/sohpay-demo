import { StyleSheet, View } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '@typ/navigation';
import { NavIconButton, Wordmark } from '@components/common';
import { theme } from '@styles';

const DashboardNav = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.gray50 }} edges={['top']}>
      <View style={styles.container}>
        <Wordmark height={24} />

        {/* 햄버거 버튼: Header 의 닫기 버튼과 같은 컴포넌트를 써서 위치·모양을 맞춘다 */}
        <NavIconButton icon="menu" accessibilityLabel="메뉴" onPress={() => navigation.navigate('MyPage')} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, // Header 와 같은 좌우 여백. 햄버거·닫기 버튼 위치가 일치한다
  },
});

export default DashboardNav;
export { DashboardNav };

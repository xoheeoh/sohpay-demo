import { Pressable, StyleSheet, View } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '@typ/navigation';
import { Wordmark } from '@components/common';
import { theme } from '@styles';

const DashboardNav = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.gray50 }} edges={['top']}>
      <View style={styles.container}>
        <Wordmark height={24} />

        <View style={styles.buttonBox}>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && { backgroundColor: theme.colors.gray150 }]}
            onPress={() => navigation.navigate('MyPage')}>
            <Icon source={'menu'} size={22} color={theme.colors.gray800} />
          </Pressable>
        </View>
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
    paddingHorizontal: 16,
  },
  buttonBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DashboardNav;
export { DashboardNav };

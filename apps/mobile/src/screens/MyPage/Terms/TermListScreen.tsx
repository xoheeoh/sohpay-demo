import type { RootStackParamList } from '@typ/navigation';
import { Pressable, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import { ScreenWrapper, Typography } from '@components/common';
import { theme } from '@styles';
import styles from './TermListScreen.styles';

type TermListScreenProps = NativeStackScreenProps<RootStackParamList, 'TermList'>;

const TermListScreen: React.FC<TermListScreenProps> = ({ navigation }) => {
  const termList = [
    { title: '서비스 이용약관' },
    { title: '전자금융거래이용약관' },
    { title: '개인(신용)정보 수집 및 이용 동의' },
    { title: '개인정보처리방침' },
    { title: '개인(신용)정보 제3자 제공 동의' },
    { title: '이메일 및 SMS 광고성 정보 수신 동의' },
  ];

  return (
    <ScreenWrapper backgroundColor={theme.colors.bg} topComponent={false}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <View style={styles.list}>
          {termList.map((item, index) => (
            <Pressable
              key={item.title}
              style={({ pressed }) => [styles.pressable, index > 0 && styles.divider, pressed && styles.pressed]}
              onPress={() => navigation.navigate('TermContent', { flg: index, title: item.title })}>
              <Typography mode="subtitle2" color="gray900">
                {item.title}
              </Typography>

              <Icon source={'chevron-right'} size={20} color={theme.colors.gray400} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default TermListScreen;
export { TermListScreen };

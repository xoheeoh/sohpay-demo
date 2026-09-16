import type { RootStackParamList } from '@typ/navigation';
import { ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper, Typography } from '@components/common';
import { Term0, Term1, Term2, Term3, Term4, Term5 } from './Components/index';
import styles from './TermListScreen.styles';

type TermContentScreenProps = NativeStackScreenProps<RootStackParamList, 'TermContent'>;

const components: Record<number, React.FC> = {
  // 신규 약관이 생기는 경우 이 밑으로 추가하면 됨 (3: Term3, 4: Term4 등..)
  0: Term0, // 서비스 이용약관
  1: Term1, // 전자금융거래이용약관
  2: Term2, // 개인(신용)정보 수집 및 이용 동의
  3: Term3, // 개인정보처리방침
  4: Term4, // 개인(신용)정보 제3자 제공 동의
  5: Term5, // 이메일 및 SMS 광고성 정보 수신 동의
};

const TermContentScreen: React.FC<TermContentScreenProps> = ({ route }) => {
  // 이전 화면에서 얻어온 이용약관 정보 (값에 따라 화면에 보이는 내용이 달라짐)
  const flg = route.params.flg;
  const title = route.params.title;

  const SelectedComponent = components[flg]; // flg 값에 따라 컴포넌트 선택

  return (
    <ScreenWrapper backgroundColor="white">
      <ScrollView contentContainerStyle={[styles.wrap, { gap: 32 }]}>
        <Typography mode="heading3" color="gray900">
          {title}
        </Typography>

        {SelectedComponent && <SelectedComponent />}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default TermContentScreen;
export { TermContentScreen };

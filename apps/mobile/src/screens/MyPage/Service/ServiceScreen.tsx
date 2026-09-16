import { Pressable, ScrollView, View, Linking, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { formatPhoneNumber } from '@utils/formatter';
import { useDialog } from '@contexts/DialogContext';
import { ScreenWrapper, SecondaryButton, Typography } from '@components/common';
import { layout, theme } from '@styles';

type ServiceScreenProps = NativeStackScreenProps<RootStackParamList, 'Service'>;

const ServiceScreen: React.FC<ServiceScreenProps> = ({ navigation }) => {
  /** TODO: 고객센터 정보 바뀔 예정 */
  const telNo = '00000000';

  // Dialog
  const { confirm } = useDialog();

  // 전화 연결 함수
  const handleCall = () => {
    const telScheme = `tel:${telNo.replace(/-/g, '')}`; // 전화번호에서 하이픈 제거 후 스키마 생성
    Linking.openURL(telScheme).catch((error) => {
      console.error('전화 연결 실패', error);
    });
  };

  return (
    <ScreenWrapper backgroundColor={'white'} topComponent={true}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <View style={styles.container}>
          {/* 화면 이동 메뉴 */}
          <View style={styles.menuBox}>
            <Pressable style={styles.menu} onPress={() => navigation.navigate('Notice')}>
              <View style={layout.rowBetween}>
                <Icon source={'bullhorn-variant-outline'} size={24} color={theme.colors.gray900} />
                <Icon source={'chevron-right'} size={24} color={theme.colors.gray900} />
              </View>

              <Typography mode="subtitle3" color="gray900">
                공지사항
              </Typography>
            </Pressable>

            <Pressable style={styles.menu} onPress={() => navigation.navigate('FAQ')}>
              <View style={layout.rowBetween}>
                <Icon source={'message-question-outline'} size={24} color={theme.colors.gray900} />
                <Icon source={'chevron-right'} size={24} color={theme.colors.gray900} />
              </View>

              <Typography mode="subtitle3" color="gray900">
                FAQ
              </Typography>
            </Pressable>

            <Pressable style={styles.menu} onPress={() => navigation.navigate('Inquiry')}>
              <View style={layout.rowBetween}>
                <Icon source={'email-edit-outline'} size={24} color={theme.colors.gray900} />
                <Icon source={'chevron-right'} size={24} color={theme.colors.gray900} />
              </View>

              <Typography mode="subtitle3" color="gray900">
                1:1 상담
              </Typography>
            </Pressable>
          </View>

          {/* 고객센터 정보 - TODO: 추후 내용 바뀔 예정 */}
          <View style={{ gap: 12 }}>
            <View
              style={[
                styles.menu,
                { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
              ]}>
              <View style={{ gap: 12 }}>
                <Typography mode="subtitle2" color="gray900">
                  전화 상담
                </Typography>

                <View style={{ gap: 4 }}>
                  <Typography mode="body2" color="gray900">
                    <Typography mode="subtitle3">평일:</Typography> 9시 ~ 12시, 13 ~ 18시
                  </Typography>

                  <Typography mode="body2" color="gray900">
                    <Typography mode="subtitle3">주말/공휴일:</Typography> 휴무
                  </Typography>

                  <Typography mode="body2" color="gray900">
                    <Typography mode="subtitle3">상담번호:</Typography> {formatPhoneNumber(telNo)}
                  </Typography>
                </View>
              </View>

              <SecondaryButton
                label={'통화'}
                onPress={() => {
                  confirm({
                    title: '통화연결',
                    message1: `${telNo} 통화 연결하시겠습니까?`,
                    confirmText: '확인',
                    cancelText: '아니오',
                  }).then((ok) => {
                    if (ok) {
                      handleCall();
                    }
                  });
                }}
                size={'medium'}
              />
            </View>

            <View style={styles.menu}>
              <Typography mode="subtitle2" color="gray900">
                이메일 상담
              </Typography>

              <View style={{ gap: 4 }}>
                <Typography mode="subtitle3" color="gray900">
                  48시간 이내 답변
                </Typography>

                <Typography mode="body2" color="gray900">
                  <Typography mode="subtitle3">상담 이메일 주소:</Typography> cs@service.com
                </Typography>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { backgroundColor: theme.colors.gray50, flexGrow: 1 },
  container: { backgroundColor: 'white', gap: 24, paddingVertical: 24, paddingHorizontal: 16, flex: 1 },
  menuBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menu: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
    gap: 12,
    flex: 1,
  },
});

export default ServiceScreen;
export { ServiceScreen };

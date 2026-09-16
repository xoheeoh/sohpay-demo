import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Divider, Icon } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { IUserProfile } from '@typ/userType';
import { removeData, removeEncryptedToken } from '@storages/asyncStorage';
import { loadUsrInfoData } from '@apis/commonApi';
import { PopupModal, ScreenWrapper, Typography } from '@components/common';
import { layout, theme } from '@styles';

type MyPageScreenProps = NativeStackScreenProps<RootStackParamList, 'MyPage'>;

const MyPageScreen: React.FC<MyPageScreenProps> = ({ navigation }) => {
  /**
   * 회원 정보 조회
   * 조회 결과 상태관리
   */
  const [usrData, setUsrData] = useState<IUserProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadUsrInfoData().then((data) => {
        console.log('사용자 정보 조회 결과:', data);

        if (data.resultCd === '0000') {
          setUsrData(data);
        } else {
          console.log('사용자 정보 조회 실패!', data.resultMsg);
        }
      });
    }, [navigation]),
  );

  /**
   * 로그아웃 메뉴 클릭 시, 팝업 등장
   * 팝업에서 로그아웃 버튼 클릭: 데이터 삭제 후 로그인 화면으로 이동
   */
  const [logoutModal, setLogoutModal] = useState<boolean>(false);
  const handleLogout = async () => {
    await removeEncryptedToken(); // 암호화된 토큰 삭제
    await removeData('mbUid'); // 저장된 아이디 삭제

    setLogoutModal(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <ScreenWrapper backgroundColor={theme.colors.bg} topComponent={false}>
      <ScrollView contentContainerStyle={styles.wrap}>
        {/* 사용자 프로필 */}
        <View style={styles.profile}>
          <Image source={require('@images/non_profile.png')} style={{ width: 56, height: 56 }} resizeMode="cover" />

          <View>
            <Typography mode="heading2" color="gray900">
              {usrData?.usrNm} 님
            </Typography>

            <Pressable
              style={({ pressed }) => [styles.textButton, pressed && { opacity: 0.5 }]}
              onPress={() => navigation.navigate('UsrInfo', { usrData: usrData })}>
              <Typography mode="body2" color="gray500">
                회원정보
              </Typography>
              <Icon source="chevron-right" size={16} color={theme.colors.gray400} />
            </Pressable>
          </View>
        </View>

        {/* 계정관리 메뉴 */}
        <View style={styles.section}>
          <Typography mode="subtitle3" color="gray500" style={styles.sectionTitle}>
            계정관리
          </Typography>

          <View style={styles.listMenu}>
            <Pressable
              style={({ pressed }) => [styles.list, layout.rowBetween, pressed && styles.pressed]}
              onPress={() => navigation.navigate('EditCheck', { usrData: usrData, flg: 'usrInfo' })}>
              <Typography mode="subtitle2" color="gray900">
                회원정보 변경
              </Typography>
              <Icon source="chevron-right" size={20} color={theme.colors.gray400} />
            </Pressable>

            <Divider style={{ backgroundColor: theme.colors.gray100, marginHorizontal: 18 }} />

            <Pressable
              style={({ pressed }) => [styles.list, layout.rowBetween, pressed && styles.pressed]}
              onPress={() => navigation.navigate('EditCheck', { usrData: usrData, flg: 'pinNo' })}>
              <Typography mode="subtitle2" color="gray900">
                간편 비밀번호 변경
              </Typography>
              <Icon source="chevron-right" size={20} color={theme.colors.gray400} />
            </Pressable>
          </View>
        </View>

        {/* 계좌관리 메뉴 */}
        <View style={styles.section}>
          <Typography mode="subtitle3" color="gray500" style={styles.sectionTitle}>
            계좌관리
          </Typography>

          <View style={styles.listMenu}>
            <Pressable
              style={({ pressed }) => [styles.list, layout.rowBetween, pressed && styles.pressed]}
              onPress={() => navigation.navigate('AcntManage')}>
              <Typography mode="subtitle2" color="gray900">
                계좌관리
              </Typography>
              <Icon source="chevron-right" size={20} color={theme.colors.gray400} />
            </Pressable>
          </View>
        </View>

        {/* 이용내역 메뉴 */}
        <View style={styles.section}>
          <Typography mode="subtitle3" color="gray500" style={styles.sectionTitle}>
            이용내역
          </Typography>

          <View style={styles.listMenu}>
            <Pressable
              style={({ pressed }) => [styles.list, layout.rowBetween, pressed && styles.pressed]}
              onPress={() => navigation.navigate('UseList')}>
              <Typography mode="subtitle2" color="gray900">
                이용내역 조회
              </Typography>
              <Icon source="chevron-right" size={20} color={theme.colors.gray400} />
            </Pressable>
          </View>
        </View>

        {/* 고객지원 메뉴 */}
        <View style={styles.section}>
          <Typography mode="subtitle3" color="gray500" style={styles.sectionTitle}>
            고객지원
          </Typography>

          <View style={styles.listMenu}>
            <Pressable
              style={({ pressed }) => [styles.list, layout.rowBetween, pressed && styles.pressed]}
              onPress={() => navigation.navigate('TermList')}>
              <Typography mode="subtitle2" color="gray900">
                이용약관
              </Typography>
              <Icon source="chevron-right" size={20} color={theme.colors.gray400} />
            </Pressable>

            <Divider style={{ backgroundColor: theme.colors.gray100, marginHorizontal: 18 }} />

            <Pressable
              style={({ pressed }) => [styles.list, layout.rowBetween, pressed && styles.pressed]}
              onPress={() => navigation.navigate('Service')}>
              <Typography mode="subtitle2" color="gray900">
                고객센터
              </Typography>
              <Icon source="chevron-right" size={20} color={theme.colors.gray400} />
            </Pressable>

            <Divider style={{ backgroundColor: theme.colors.gray100, marginHorizontal: 18 }} />

            <Pressable
              style={({ pressed }) => [styles.list, layout.rowBetween, pressed && styles.pressed]}
              onPress={() => navigation.navigate('Setting')}>
              <Typography mode="subtitle2" color="gray900">
                설정
              </Typography>
              <Icon source="chevron-right" size={20} color={theme.colors.gray400} />
            </Pressable>
          </View>
        </View>

        {/* 로그아웃 메뉴 */}
        <View style={styles.listMenu}>
          <Pressable
            style={({ pressed }) => [styles.list, layout.rowBetween, pressed && styles.pressed]}
            onPress={() => setLogoutModal(true)}>
            <Typography mode="subtitle2" color="gray900">
              로그아웃
            </Typography>
            <Icon source="chevron-right" size={20} color={theme.colors.gray400} />
          </Pressable>
        </View>
      </ScrollView>

      {/* 로그아웃 팝업 */}
      <PopupModal
        title="로그아웃"
        visible={logoutModal}
        close={() => setLogoutModal(false)}
        message1={'로그아웃 하시겠습니까?'}
        button1Label={'로그아웃'}
        button2Label={'아니오'}
        button1Event={handleLogout}
        button2Event={() => setLogoutModal(false)}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 24, gap: 24 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingBottom: 8 },
  section: { gap: 8 },
  sectionTitle: { paddingHorizontal: 4 },
  textButton: { height: 28, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  list: { paddingHorizontal: 18, paddingVertical: 17, backgroundColor: theme.colors.surface },
  pressed: { backgroundColor: theme.colors.gray50 },
  listMenu: { borderRadius: theme.radius.lg, overflow: 'hidden', boxShadow: theme.shadow.card },
});

export default MyPageScreen;
export { MyPageScreen };

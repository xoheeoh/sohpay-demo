import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Icon } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { IUserProfile } from '@typ/userType';
import { IRmnAmt } from '@typ/paymentType';
import { removeData, removeEncryptedToken } from '@storages/asyncStorage';
import { formatWon } from '@utils/formatter';
import { loadUserAmt, loadUsrInfoData } from '@apis/commonApi';
import { PopupModal, ScreenWrapper, Skeleton, Typography } from '@components/common';
import { layout, theme } from '@styles';
import { getAppWidth } from '@utils/dimensions';

type MyPageScreenProps = NativeStackScreenProps<RootStackParamList, 'MyPage'>;

/** 메뉴 한 줄 */
interface MenuItem {
  icon: string;
  label: string;
  onPress: () => void;
}

const MyPageScreen: React.FC<MyPageScreenProps> = ({ navigation }) => {
  const [usrData, setUsrData] = useState<IUserProfile | null>(null);

  // null 이면 조회 전이라 잔액 자리에 자리표시자를 보여준다
  const [rmnAmtData, setRmnAmtData] = useState<IRmnAmt | null>(null);

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

      loadUserAmt().then((data) => {
        if (data.resultCd === '0000') {
          setRmnAmtData(data);
        }
      });
    }, [navigation]),
  );

  // 로그아웃: 토큰과 저장된 아이디를 지우고 로그인 화면으로 돌아간다
  const [logoutModal, setLogoutModal] = useState<boolean>(false);
  const handleLogout = async () => {
    await removeEncryptedToken();
    await removeData('mbUid');

    setLogoutModal(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  /**
   * 웹 전용 등장 애니메이션. 웹의 native-stack 은 화면 전환 애니메이션을 지원하지 않아 오른쪽에서 밀려 들어오게 직접 처리한다.
   * 앱은 App.tsx 의 animation: 'slide_from_right' 가 담당한다. 값 0 = 오른쪽 화면 밖, 1 = 제자리.
   */
  const isWeb = Platform.OS === 'web';
  // 렌더 중 ref 를 읽지 말라는 lint 규칙 때문에 useRef 대신 useState 초기화 함수로 한 번만 만든다
  const [slideInProgress] = useState(() => new Animated.Value(isWeb ? 0 : 1));

  useEffect(() => {
    if (!isWeb) return;
    Animated.timing(slideInProgress, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isWeb, slideInProgress]);

  const slideInStyle = isWeb
    ? {
        opacity: slideInProgress,
        transform: [{ translateX: Animated.multiply(Animated.subtract(1, slideInProgress), getAppWidth()) }],
      }
    : undefined;

  // 메뉴 구성
  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: '계정',
      items: [
        {
          icon: 'account-edit-outline',
          label: '회원정보 변경',
          onPress: () => navigation.navigate('EditCheck', { usrData: usrData, flg: 'usrInfo' }),
        },
        {
          icon: 'lock-outline',
          label: '간편 비밀번호 변경',
          onPress: () => navigation.navigate('EditCheck', { usrData: usrData, flg: 'pinNo' }),
        },
        { icon: 'bank-outline', label: '계좌관리', onPress: () => navigation.navigate('AcntManage') },
      ],
    },
    {
      title: '이용내역',
      items: [{ icon: 'receipt-text-outline', label: '이용내역 조회', onPress: () => navigation.navigate('UseList') }],
    },
    {
      title: '고객지원',
      items: [
        { icon: 'file-document-outline', label: '이용약관', onPress: () => navigation.navigate('TermList') },
        { icon: 'headset', label: '고객센터', onPress: () => navigation.navigate('Service') },
        { icon: 'cog-outline', label: '설정', onPress: () => navigation.navigate('Setting') },
      ],
    },
  ];

  return (
    <Animated.View style={[{ flex: 1 }, slideInStyle]}>
      <ScreenWrapper backgroundColor={theme.colors.bg} topComponent={false}>
        <ScrollView contentContainerStyle={styles.wrap}>
          {/* 프로필 카드. 아래 띠에 보유 잔액을 함께 보여준다 */}
          <View style={styles.card}>
            <View style={[layout.rowCenter, { gap: 14 }]}>
              <Image source={require('@images/non_profile.png')} style={styles.avatar} resizeMode="cover" />

              <View style={{ flex: 1, gap: 2 }}>
                <Typography mode="heading3" color="gray900" numberOfLines={1}>
                  {usrData?.usrNm ? `${usrData.usrNm} 님` : ' '}
                </Typography>
                <Typography mode="body2" color="gray500" numberOfLines={1}>
                  {usrData?.mbUid ?? ' '}
                </Typography>
              </View>

              <Pressable
                accessibilityRole="button"
                hitSlop={4}
                style={({ pressed }) => [layout.rowCenter, { gap: 2 }, pressed && { opacity: 0.5 }]}
                onPress={() => navigation.navigate('UsrInfo', { usrData: usrData })}>
                <Typography mode="subtitle3" color="blue500">
                  회원정보
                </Typography>
                <Icon source="chevron-right" size={18} color={theme.colors.blue500} />
              </Pressable>
            </View>

            <View style={[layout.rowBetween, styles.balanceStrip]}>
              <View style={[layout.rowCenter, { gap: 6 }]}>
                <Icon source="wallet-outline" size={16} color={theme.colors.gray500} />
                <Typography mode="body2" color="gray600">
                  보유 잔액
                </Typography>
              </View>
              {rmnAmtData === null ? (
                <Skeleton width={88} height={14} />
              ) : (
                <Typography mode="subtitle3" color="gray900">
                  {formatWon(rmnAmtData.sumPpRmnAmt)}
                </Typography>
              )}
            </View>
          </View>

          {/* 메뉴 섹션 */}
          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Typography mode="subtitle3" color="gray500" style={styles.sectionTitle}>
                {section.title}
              </Typography>

              <View style={styles.listMenu}>
                {section.items.map((item, index) => (
                  <Pressable
                    key={item.label}
                    style={({ pressed }) => [
                      styles.list,
                      layout.rowBetween,
                      index > 0 && styles.listDivider,
                      pressed && styles.pressed,
                    ]}
                    onPress={item.onPress}>
                    <View style={[layout.rowCenter, { gap: 12 }]}>
                      <View style={styles.menuIcon}>
                        <Icon source={item.icon} size={18} color={theme.colors.primary} />
                      </View>
                      <Typography mode="subtitle2" color="gray900">
                        {item.label}
                      </Typography>
                    </View>
                    <Icon source="chevron-right" size={20} color={theme.colors.gray400} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          {/* 로그아웃은 화면 이동이 아니라 동작이므로 화살표 없이 나가기 아이콘만 두고 글자도 연하게 한다 */}
          <View style={styles.listMenu}>
            <Pressable
              style={({ pressed }) => [styles.list, layout.rowBetween, pressed && styles.pressed]}
              onPress={() => setLogoutModal(true)}>
              <View style={[layout.rowCenter, { gap: 12 }]}>
                <View style={[styles.menuIcon, styles.menuIconMuted]}>
                  <Icon source="logout" size={18} color={theme.colors.gray500} />
                </View>
                <Typography mode="subtitle2" color="gray600">
                  로그아웃
                </Typography>
              </View>
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: theme.screen.topCard, paddingBottom: theme.screen.bottom, gap: 24 },

  // 프로필 카드
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
    padding: 20,
    gap: 16,
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  balanceStrip: {
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  // 메뉴
  section: { gap: 8 },
  sectionTitle: { paddingHorizontal: 4 },
  listMenu: { borderRadius: theme.radius.lg, overflow: 'hidden', boxShadow: theme.shadow.card },
  list: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: theme.colors.surface },
  listDivider: { borderTopWidth: 1, borderTopColor: theme.colors.gray100 },
  pressed: { backgroundColor: theme.colors.gray50 },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconMuted: { backgroundColor: theme.colors.gray100 },
});

export default MyPageScreen;
export { MyPageScreen };

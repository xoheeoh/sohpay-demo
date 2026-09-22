import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast, { ToastConfigParams } from 'react-native-toast-message';
import { Icon } from 'react-native-paper';

import { loadingController } from '@utils/loadingController';
import { goBackToDashboard } from '@utils/navigationHelpers';
import { getData } from '@storages/asyncStorage';
import { hasSession } from '@apis/client';
import type { RootStackParamList } from '@typ/navigation';

import { DialogProvider } from '@contexts/DialogContext';
import { LoadingProvider, useLoading } from '@contexts/LoadingContext';
import { NavigationProvider } from '@contexts/navigationContext';

import { Header, Typography } from '@components/common';
import { DashboardNav } from '@components/dashboard';
import {
  AcntManageScreen,
  ChangeTempPwdScreen,
  ChargeAcntWebScreen,
  ChargeAmtScreen,
  ChargeSelectMethodScreen,
  ChargeSucScreen,
  CodeInfoScreen,
  CodeInputScreen,
  DashboardScreen,
  EditPinNoChkScreen,
  EditPinNoScreen,
  EditUserCheckScreen,
  EditUserInfoScreen,
  FAQScreen,
  FindIdScreen,
  FindPwScreen,
  FindScreen,
  FindWebScreen,
  InquiryScreen,
  JoinCompletedScreen,
  JoinStepOneScreen,
  JoinStepThreeChkScreen,
  JoinStepThreeScreen,
  JoinStepTwoScreen,
  JoinWebScreen,
  LoginScreen,
  MyPageScreen,
  NoticeScreen,
  PayCompletedScreen,
  PermissionNoticeScreen,
  PinChargeScreen,
  PinPaymentQRScreen,
  PinPayRefundScreen,
  QRcodeScanScreen,
  RefundAcntScreen,
  RefundAuthConfirmScreen,
  RefundAuthScreen,
  RefundScreen,
  RefundSucScreen,
  ServiceScreen,
  SettingScreen,
  TermContentScreen,
  TermListScreen,
  TransferAcntChargeScreen,
  TransferAcntInputScreen,
  UseDetailScreen,
  UseListScreen,
  UsrInfoScreen,
  WithdrawalAgrScreen,
  WithdrawalScreen,
  WithdrawalSucScreen,
} from '@screens';
import { theme } from '@styles';
import { getAppWidth } from '@utils/dimensions';

/* 글로벌 로딩 정의 ==================================== */
const GlobalLoading = () => {
  const { isLoading, setLoading } = useLoading();

  // 외부에서 로딩 상태 제어할 수 있도록 등록
  useEffect(() => {
    loadingController.register(setLoading);
  }, []);

  if (!isLoading) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
};

// Stack Navigator 생성
const Stack = createNativeStackNavigator<RootStackParamList>();

/* 토스트 알림 정의 ==================================== */
const width = getAppWidth();

/**
 * 성공·오류 토스트 공통 모양.
 * 아이콘은 글자 블록(한 줄이든 여러 줄이든) 전체의 세로 가운데에 맞춘다.
 * 글자 영역이 남는 폭을 다 차지하도록 flex: 1 을 줘서 긴 문장은 줄바꿈되고 상자를 넘치지 않는다.
 */
const ToastItem = ({ text1, text2, tone }: ToastConfigParams<any> & { tone: 'success' | 'error' }) => (
  <View style={styles.toast}>
    <View style={[styles.toastIcon, tone === 'error' && { backgroundColor: theme.colors.red500 }]}>
      <Icon source={tone === 'error' ? 'close' : 'check'} size={16} color="#fff" />
    </View>
    <View style={styles.toastText}>
      <Typography mode="body2" color="gray50">
        {text1}
      </Typography>
      {text2 && (
        <Typography mode="caption1" color="gray200">
          {text2}
        </Typography>
      )}
    </View>
  </View>
);

const toastConfig = {
  success: (props: ToastConfigParams<any>) => <ToastItem {...props} tone="success" />,
  error: (props: ToastConfigParams<any>) => <ToastItem {...props} tone="error" />,
};

SplashScreen.preventAutoHideAsync().catch(() => {});

function App(): React.JSX.Element {
  // 원본은 네이티브 프로젝트에 폰트를 링크했다. Expo 에서는 런타임에 로드한다.
  // 웹은 용량이 절반인 woff2, 네이티브는 otf 를 쓴다 (Pretendard, SIL OFL).
  const [fontsLoaded] = useFonts(
    Platform.OS === 'web'
      ? {
          'Pretendard-Regular': require('./assets/fonts/web/Pretendard-Regular.woff2'),
          'Pretendard-Medium': require('./assets/fonts/web/Pretendard-Medium.woff2'),
          'Pretendard-SemiBold': require('./assets/fonts/web/Pretendard-SemiBold.woff2'),
          'Pretendard-Bold': require('./assets/fonts/web/Pretendard-Bold.woff2'),
        }
      : {
          'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.otf'),
          'Pretendard-Medium': require('./assets/fonts/Pretendard-Medium.otf'),
          'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.otf'),
          'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.otf'),
        },
  );

  /* 앱 실행 시 초기 화면 결정 (권한 고지 1회 + 로그인 상태) ===== */
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [hasSeenPermissionNotice, setHasSeenPermissionNotice] = useState<boolean>(true); // 기본값 true: 로딩 중 고지 안 보임

  useEffect(() => {
    const initApp = async () => {
      const [loggedIn, noticeSeen] = await Promise.all([hasSession(), getData<boolean>('permissionNoticeSeen')]);
      setIsLoggedIn(loggedIn);
      setHasSeenPermissionNotice(noticeSeen === true);
      setIsLoading(false);
    };
    initApp();
  }, []);
  /* ============================ 앱 실행 시 초기 화면 결정 */

  useEffect(() => {
    if (!isLoading && fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [isLoading, fontsLoaded]);

  if (isLoading || !fontsLoaded) {
    return <></>;
  }

  const getInitialRoute = (): keyof RootStackParamList => {
    if (!hasSeenPermissionNotice) return 'PermissionNotice';
    return isLoggedIn ? 'Dashboard' : 'Login';
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LoadingProvider>
          <StatusBar barStyle="dark-content" />
          <DialogProvider>
            <GlobalLoading />

            <NavigationProvider>
              <Stack.Navigator initialRouteName={getInitialRoute()}>
                {/* 최초 실행 시 권한 안내 */}
                <Stack.Screen
                  name="PermissionNotice"
                  component={PermissionNoticeScreen}
                  options={{ headerShown: false, gestureEnabled: false }}
                />

                {/* 로그인 ----------------------------------------------------------- */}
                <Stack.Screen
                  name="Login"
                  component={LoginScreen}
                  options={{ headerShown: false, gestureEnabled: false }}
                />

                <Stack.Screen
                  name="ChangeTempPwd"
                  component={ChangeTempPwdScreen}
                  options={{
                    header: ({ navigation }) => (
                      <Header
                        title="임시 비밀번호 변경"
                        bgColor="white"
                        rightButton
                        rightEvent={() => navigation.popToTop()}
                      />
                    ),
                  }}
                />

                {/* ID/PW 찾기 ------------------------------------------------------- */}
                <Stack.Screen
                  name="Find"
                  component={FindScreen}
                  options={{
                    header: () => <Header title="ID/PW 찾기" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="FindAuthWeb"
                  component={FindWebScreen}
                  options={{
                    header: () => <Header title="ID/PW 찾기" bgColor="white" rightButton />,
                  }}
                />
                <Stack.Screen
                  name="FindId"
                  component={FindIdScreen}
                  options={{
                    header: () => <Header title="ID/PW 찾기" bgColor="white" />,
                  }}
                />
                <Stack.Screen
                  name="FindPw"
                  component={FindPwScreen}
                  options={{
                    header: () => <Header title="ID/PW 찾기" bgColor="white" />,
                  }}
                />

                {/* 회원가입 ---------------------------------------------------------- */}
                <Stack.Screen
                  name="JoinOne"
                  component={JoinStepOneScreen}
                  options={{
                    header: () => <Header title="회원가입" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="AuthWeb"
                  component={JoinWebScreen}
                  options={{
                    header: () => <Header title="본인인증" bgColor="white" rightButton />,
                  }}
                />
                <Stack.Screen
                  name="JoinTwo"
                  component={JoinStepTwoScreen}
                  options={{
                    header: () => <Header title="회원가입" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="JoinThree"
                  component={JoinStepThreeScreen}
                  options={{
                    header: () => <Header title="회원가입" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="JoinThreeChk"
                  component={JoinStepThreeChkScreen}
                  options={{
                    header: () => <Header title="회원가입" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="JoinCompleted"
                  component={JoinCompletedScreen}
                  options={{
                    header: () => <Header title="회원가입" bgColor="white" />,
                  }}
                />

                {/* 대시보드 ---------------------------------------------------------- */}
                <Stack.Screen
                  name="Dashboard"
                  component={DashboardScreen}
                  options={{
                    header: () => <DashboardNav />,
                    gestureEnabled: false,
                  }}
                />

                {/* 대시보드 - 충전하기 */}
                {/* 1. 충전 방법 선택 */}
                <Stack.Screen
                  name="ChargeSelectMethod"
                  component={ChargeSelectMethodScreen}
                  options={{
                    header: () => <Header title="충전하기" bgColor={theme.colors.bg} leftButton />,
                  }}
                />

                {/* 3. 충전 금액 입력 */}
                <Stack.Screen
                  name="ChargeAmt"
                  component={ChargeAmtScreen}
                  options={{
                    header: () => <Header title="충전하기" bgColor="white" leftButton />,
                  }}
                />

                {/* 4. 계좌이체 충전 */}
                <Stack.Screen
                  name="TransferAcntCharge"
                  component={TransferAcntChargeScreen}
                  options={{
                    header: () => <Header title="충전하기" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="TransferAcntInput"
                  component={TransferAcntInputScreen}
                  options={{
                    header: () => <Header title="충전하기" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="PinCharge"
                  component={PinChargeScreen}
                  options={{
                    header: () => <Header title="충전하기" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="ChargeAcntWeb"
                  component={ChargeAcntWebScreen}
                  options={{
                    header: () => <Header title="충전하기" bgColor="white" leftButton />,
                  }}
                />

                {/* 5. 충전 성공 */}
                <Stack.Screen
                  name="ChargeSuc"
                  component={ChargeSucScreen}
                  options={{
                    header: ({ navigation }) => (
                      <Header
                        title="충전하기"
                        bgColor="white"
                        rightButton
                        rightEvent={() => goBackToDashboard(navigation)}
                      />
                    ),
                  }}
                />

                {/* 대시보드 - 출금하기 */}
                <Stack.Screen
                  name="Refund"
                  component={RefundScreen}
                  options={{
                    header: () => <Header title="출금하기" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="RefundAcnt"
                  component={RefundAcntScreen}
                  options={{
                    header: () => <Header title="출금하기" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="PinPayRefund"
                  component={PinPayRefundScreen}
                  options={{
                    header: () => <Header title="출금하기" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="RefundSuc"
                  component={RefundSucScreen}
                  options={{
                    header: ({ navigation }) => (
                      <Header
                        title="출금하기"
                        bgColor="white"
                        rightButton
                        rightEvent={() => goBackToDashboard(navigation)}
                      />
                    ),
                  }}
                />

                {/* 대시보드 - 결제하기 */}
                <Stack.Screen
                  name="QRscan"
                  component={QRcodeScanScreen}
                  options={{
                    header: () => <Header title="QR코드 스캔" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="CodeInput"
                  component={CodeInputScreen}
                  options={{
                    header: () => <Header title="결제코드" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="CodeInfo"
                  component={CodeInfoScreen}
                  options={{
                    header: () => <Header title="결제" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="PinPayQR"
                  component={PinPaymentQRScreen}
                  options={{
                    header: () => <Header title="결제" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="PayCompleted"
                  component={PayCompletedScreen}
                  options={{
                    header: ({ navigation }) => (
                      <Header title="" bgColor="white" rightButton rightEvent={() => goBackToDashboard(navigation)} />
                    ),
                  }}
                />

                {/* 대시보드 - 이용내역 */}
                <Stack.Screen
                  name="UseList"
                  component={UseListScreen}
                  options={{
                    header: () => <Header title="이용내역 조회" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="UseDetail"
                  component={UseDetailScreen}
                  options={{
                    header: () => <Header title="상세내역" bgColor={theme.colors.bg} rightButton />,
                  }}
                />

                {/* 마이페이지 --------------------------------------------------------- */}
                <Stack.Screen
                  name="MyPage"
                  component={MyPageScreen}
                  options={{
                    // 햄버거 메뉴가 오른쪽 위에 있으므로 오른쪽에서 밀려 들어오게 통일 (iOS 기본과 동일, Android 도 같은 방향으로)
                    // 웹은 native-stack 이 전환 애니메이션을 지원하지 않아 MyPageScreen 안에서 별도로 처리한다.
                    animation: 'slide_from_right',
                    header: ({ navigation }) => (
                      <Header
                        title=""
                        bgColor={theme.colors.bg}
                        rightButton
                        rightEvent={() => goBackToDashboard(navigation)}
                      />
                    ),
                  }}
                />

                {/* 마이페이지 - 회원정보 */}
                <Stack.Screen
                  name="UsrInfo"
                  component={UsrInfoScreen}
                  options={{
                    header: () => <Header title="회원정보" bgColor="white" leftButton />,
                  }}
                />

                {/* 마이페이지 - 회원탈퇴 */}
                <Stack.Screen
                  name="Withdrawal"
                  component={WithdrawalScreen}
                  options={{
                    header: () => <Header title="회원탈퇴" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="WithdrawalAgr"
                  component={WithdrawalAgrScreen}
                  options={{
                    header: ({ navigation }) => (
                      <Header title="회원탈퇴" bgColor="white" leftButton leftEvent={() => navigation.pop(2)} />
                    ),
                  }}
                />
                <Stack.Screen
                  name="WithdrawalSuc"
                  component={WithdrawalSucScreen}
                  options={{
                    header: () => <Header title="회원탈퇴" bgColor="white" />,
                  }}
                />

                {/* 마이페이지 - 계정관리 */}
                <Stack.Screen
                  name="EditCheck"
                  component={EditUserCheckScreen}
                  options={{
                    header: () => <Header title="" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="EditInfo"
                  component={EditUserInfoScreen}
                  options={{
                    header: () => <Header title="회원정보 변경" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="EditPinNo"
                  component={EditPinNoScreen}
                  options={{
                    header: () => <Header title="간편 비밀번호 변경" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="EditPinNoChk"
                  component={EditPinNoChkScreen}
                  options={{
                    header: () => <Header title="간편 비밀번호 변경" bgColor="white" leftButton />,
                  }}
                />

                {/* 마이페이지 - 계좌관리 */}
                <Stack.Screen
                  name="AcntManage"
                  component={AcntManageScreen}
                  options={{
                    header: () => <Header title="계좌관리" bgColor={theme.colors.bg} leftButton />,
                  }}
                />
                <Stack.Screen
                  name="RefundAuth"
                  component={RefundAuthScreen}
                  options={{
                    header: () => <Header title="계좌인증" bgColor="white" leftButton />,
                  }}
                />
                <Stack.Screen
                  name="RefundAuthConfirm"
                  component={RefundAuthConfirmScreen}
                  options={{
                    header: () => <Header title="계좌인증" bgColor="white" leftButton />,
                  }}
                />

                {/* 마이페이지 - 고객지원 */}
                {/* 이용약관 */}
                <Stack.Screen
                  name="TermList"
                  component={TermListScreen}
                  options={{
                    header: () => <Header title="이용약관" bgColor={theme.colors.bg} leftButton />,
                  }}
                />
                <Stack.Screen
                  name="TermContent"
                  component={TermContentScreen}
                  options={{
                    header: () => <Header title="이용약관" bgColor="white" leftButton />,
                  }}
                />

                {/* 고객센터 */}
                <Stack.Screen
                  name="Service"
                  component={ServiceScreen}
                  options={{
                    header: () => <Header title="고객센터" bgColor={theme.colors.bg} leftButton />,
                  }}
                />
                <Stack.Screen
                  name="Notice"
                  component={NoticeScreen}
                  options={{
                    header: () => <Header title="공지사항" bgColor={theme.colors.bg} leftButton />,
                  }}
                />
                <Stack.Screen
                  name="FAQ"
                  component={FAQScreen}
                  options={{
                    header: () => <Header title="FAQ" bgColor={theme.colors.bg} leftButton />,
                  }}
                />
                <Stack.Screen
                  name="Inquiry"
                  component={InquiryScreen}
                  options={{
                    header: () => <Header title="1:1 상담" bgColor="white" leftButton />,
                  }}
                />

                {/* 설정 */}
                <Stack.Screen
                  name="Setting"
                  component={SettingScreen}
                  options={{
                    header: () => <Header title="설정" bgColor="white" leftButton />,
                  }}
                />
              </Stack.Navigator>

              <Toast position="top" topOffset={70} config={toastConfig} />
            </NavigationProvider>
          </DialogProvider>
        </LoadingProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  toast: {
    width: width - 48,
    backgroundColor: theme.colors.gray900,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center', // 아이콘을 글자 블록의 세로 가운데에
    gap: 10,
    boxShadow: theme.shadow.float,
  },
  // 아이콘 동그라미. 글자 한 줄 높이(20)와 같게 해서 한 줄 메시지일 때 딱 맞는다
  toastIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.green500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: {
    flex: 1,
    gap: 2,
  },
});

export default App;

import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'react-native-linear-gradient';

import type { RootStackParamList } from '@typ/navigation';
import { IUserData } from '@typ/userType';
import { joinService } from '@apis/usrApi';
import { DEV_START_SCREEN } from '@env';
import { getData, removeData } from '@storages/asyncStorage';
import { useDialog } from '@contexts/DialogContext';
import {
  BottomBtnBox,
  useBottomBtnBoxHeight,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  SuccessAnimation,
  Typography,
  Wordmark,
} from '@components/common';
import { theme } from '@styles';

type JoinCompletedScreenProps = NativeStackScreenProps<RootStackParamList, 'JoinCompleted'>;

/**
 * 화면 모양만 확인하는 미리보기 모드.
 * .env 의 EXPO_PUBLIC_DEV_START_SCREEN=JoinCompleted 로 켜면 실제 가입 요청 없이 샘플 정보로 그리며, 배포 빌드에서는 항상 꺼져 있다.
 */
const IS_PREVIEW = DEV_START_SCREEN === 'JoinCompleted';
const PREVIEW_USER: IUserData = {
  usrNm: '오세영',
  mbUid: 'sohpay_demo',
  email: 'preview@example.com',
  pwd: '',
  usrPin: '',
  optionAgree: false,
  memberAuthKey: '',
  nonce: '',
};

/**
 * 하단 버튼 상자가 스크롤 영역 위에 떠 있어 단순 가운데 정렬은 아래로 치우쳐 보이므로,
 * 버튼 위 영역 기준으로 가운데를 맞추기 위한 추가 아래 여백. 24 는 카드가 아래쪽에 무게를 실어 살짝 위로 올리는 보정값.
 */
const CENTERING_LIFT = 24;

const JoinCompletedScreen: React.FC<JoinCompletedScreenProps> = ({ navigation }) => {
  const centeringExtraBottomPadding = useBottomBtnBoxHeight() - BOTTOM_BTN_BOX_KEYBOARD_INSET + CENTERING_LIFT;
  // 1~3 단계에서 저장해 둔 가입 정보
  const [userData, setUserData] = useState<IUserData | null>(IS_PREVIEW ? PREVIEW_USER : null);

  useEffect(() => {
    if (IS_PREVIEW) return; // 미리보기: 저장된 가입 정보를 읽지 않는다

    const loadUserData = async () => {
      const data = await getData<IUserData>('userData');

      console.log('========================================');
      console.log('[회원가입 완료 화면] AsyncStorage에서 데이터 로드');
      console.log('저장된 최종 userData:', JSON.stringify(data, null, 2));
      console.log('========================================');
      setUserData(data);
    };

    loadUserData();
  }, []);

  const { confirm } = useDialog();

  // 가입 요청이 성공한 뒤에만 화면을 그린다
  const [show, setShow] = useState(IS_PREVIEW);

  // 화면이 다시 그려지거나 효과가 두 번 돌아도 가입 요청은 한 번만 보낸다
  const isSubmittedRef = useRef(false);

  useEffect(() => {
    if (IS_PREVIEW) return; // 미리보기: 실제 가입 요청을 보내지 않는다

    if (userData && !isSubmittedRef.current) {
      isSubmittedRef.current = true;
      console.log('불러온 회원가입 데이터:', userData);

      joinService(userData).then(async (data) => {
        if (data.resultCd === '0000') {
          console.log('========================================');
          console.log('[회원가입 완료 화면] 회원가입 성공!');
          console.log(`회원 ID: ${data.mbUid}`);
          console.log('========================================');
          await removeData('userData');
          console.log('[회원가입 완료 화면] AsyncStorage의 userData 삭제 완료');
          setShow(true);
        } else {
          console.log('========================================');
          console.log('[회원가입 완료 화면] 회원가입 실패, 사유:', data.resultMsg);
          console.log('========================================');
          // 실패해도 처음부터 다시 시작하도록 가입 정보를 지운다
          await removeData('userData');
          console.log('[회원가입 완료 화면] AsyncStorage의 userData 삭제 완료');
          setShow(false);

          confirm({
            title: '회원가입 실패',
            message1: data.resultMsg, // 본인인증 만료, 이미 가입된 사용자 등
            message2: '처음부터 다시 시도해 주세요.',
            confirmText: '확인',
          }).then((ok) => {
            if (ok) {
              navigation.replace('Login');
            }
          });
        }
      });
    }
  }, [userData]);

  // 완료 화면에서는 뒤로가기를 막고 로그인 화면으로 보낸다
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
    });

    const backAction = () => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      return true; // 기본 뒤로가기 동작 방지
    };

    // 웹에는 BackHandler 가 없어(콘솔 오류) 앱에서만 등록한다
    if (Platform.OS === 'web') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  const goToLogin = () =>
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      }),
    );

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      {show && (
        <>
          <KeyboardAwareScrollView
            contentContainerStyle={styles.container}
            keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}
            extraBottomPadding={centeringExtraBottomPadding}>
            <View style={styles.hero}>
              <SuccessAnimation size={160} style={styles.animation} />

              <View style={{ alignItems: 'center', gap: 6 }}>
                <Typography mode="heading3" color="gray900">
                  {userData?.usrNm ? `${userData.usrNm}님, 환영합니다!` : '회원가입 완료'}
                </Typography>
                <Typography mode="body2" color="gray600" style={{ textAlign: 'center' }}>
                  회원가입이 완료되었습니다.{'\n'}로그인하면 바로 이용할 수 있어요.
                </Typography>
              </View>
            </View>

            {/* 대시보드 잔액 카드와 같은 브랜드 그라디언트로 회원카드 느낌을 준다. 그림자는 바깥 View 가 맡는다 */}
            <View style={styles.memberCardShadow}>
              <LinearGradient
                colors={[theme.colors.blue500, theme.colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.memberCard}>
                <View style={styles.decoLarge} />
                <View style={styles.decoSmall} />

                <View style={styles.memberCardHead}>
                  <Wordmark height={18} color="white" />
                  <View style={styles.memberBadge}>
                    <Typography mode="caption2" color="white">
                      NEW MEMBER
                    </Typography>
                  </View>
                </View>

                <View style={{ gap: 10 }}>
                  <MemberRow label="이름" value={userData?.usrNm} />
                  <MemberRow label="ID" value={userData?.mbUid} />
                  {userData?.email ? <MemberRow label="이메일" value={userData.email} /> : null}
                </View>
              </LinearGradient>
            </View>
          </KeyboardAwareScrollView>

          <BottomBtnBox buttonKey={'goToLogin'} disabled={false} label={'로그인하기'} onPress={goToLogin} />
        </>
      )}
    </ScreenWrapper>
  );
};

/** 회원 정보 카드 한 줄 (왼쪽 항목명, 오른쪽 값) */
const MemberRow = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.memberRow}>
    <Typography mode="body2" color="white" style={{ opacity: 0.75 }}>
      {label}
    </Typography>
    <Typography mode="subtitle3" color="white" selectable numberOfLines={1} style={styles.memberValue}>
      {value}
    </Typography>
  </View>
);

const styles = StyleSheet.create({
  // 아래 여백은 KeyboardAwareScrollView 가 덮어쓰므로 extraBottomPadding 으로 보정한다
  container: { paddingHorizontal: 16, paddingVertical: 24, gap: 50, flexGrow: 1, justifyContent: 'center' },

  hero: { gap: 12, alignItems: 'center' },
  // Lottie 그림 안의 투명 여백(위 28px, 아래 35px)을 음수 여백으로 상쇄해 보이는 그림 기준으로 정렬한다
  animation: { marginTop: -28, marginBottom: -32 },

  // 그림자는 바깥 View 가, 둥근 모서리 안쪽 잘라내기는 그라디언트 카드가 맡는다. iOS 는 한 뷰에 둘을 함께 걸면 모서리가 둥글게 잘리지 않는다
  memberCardShadow: {
    // 웹은 프레임이 700px 까지 넓어지므로 카드를 휴대폰 폭 정도로 제한한다
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    borderRadius: theme.radius.xl,
    boxShadow: theme.shadow.primary,
  },
  memberCard: {
    borderRadius: theme.radius.xl,
    padding: 22,
    gap: 20,
    overflow: 'hidden',
  },
  decoLarge: {
    position: 'absolute',
    right: -40,
    top: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decoSmall: {
    position: 'absolute',
    right: 60,
    bottom: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  memberCardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memberBadge: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
  },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  // 긴 이메일이 카드 밖으로 나가지 않게 값 칸이 남는 폭만 쓰고 말줄임한다
  memberValue: { flexShrink: 1, textAlign: 'right' },
});

export default JoinCompletedScreen;
export { JoinCompletedScreen };

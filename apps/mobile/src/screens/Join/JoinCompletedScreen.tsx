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
  BOTTOM_BTN_BOX_HEIGHT,
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
 * 화면 모양만 확인하기 위한 미리보기 모드.
 * .env 에 EXPO_PUBLIC_DEV_START_SCREEN=JoinCompleted 를 넣고 실행하면 실제 가입 요청 없이 아래 샘플 정보로 화면을 그린다.
 * 개발 실행에서만 동작하고, 배포 빌드에서는 항상 꺼져 있다.
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
 * 내용을 "버튼 위 영역"의 가운데에 놓기 위한 추가 아래 여백.
 * 하단 버튼 상자는 화면 위에 떠 있어(absolute) 스크롤 영역이 그 뒤까지 이어진다. 그래서 그냥 가운데 정렬하면
 * 버튼까지 포함한 높이의 가운데에 놓여 아래로 치우쳐 보인다.
 *  - 버튼 상자 높이(BOTTOM_BTN_BOX_HEIGHT) 중 스크롤뷰가 이미 더해 주는 몫(BOTTOM_BTN_BOX_KEYBOARD_INSET)을 뺀 나머지
 *  - 아래쪽에 무게가 실리는 구성(카드)이라 기하학적 중앙보다 살짝 위에 보이도록 24 를 더한다
 */
const CENTERING_EXTRA_BOTTOM_PADDING = BOTTOM_BTN_BOX_HEIGHT - BOTTOM_BTN_BOX_KEYBOARD_INSET + 24;

const JoinCompletedScreen: React.FC<JoinCompletedScreenProps> = ({ navigation }) => {
  /**
   * 회원가입 1~3 단계에서 저장한 정보 불러오기
   * 불러온 정보 사용자 정보로 상태관리
   */
  const [userData, setUserData] = useState<IUserData | null>(IS_PREVIEW ? PREVIEW_USER : null);

  useEffect(() => {
    if (IS_PREVIEW) return; // 미리보기: 저장된 가입 정보를 읽지 않는다

    const loadUserData = async () => {
      const data = await getData<IUserData>('userData'); // 저장된 userData 키 데이터 가져오기

      console.log('========================================');
      console.log('[회원가입 완료 화면] AsyncStorage에서 데이터 로드');
      console.log('저장된 최종 userData:', JSON.stringify(data, null, 2));
      console.log('========================================');
      setUserData(data);
    };

    loadUserData();
  }, []);

  // Dialog
  const { confirm } = useDialog();

  // 회원가입 성공 여부에 따라 보여주는 화면 분기
  const [show, setShow] = useState(IS_PREVIEW);

  // 가입 요청은 한 번만 보낸다. 화면이 다시 그려지거나 효과가 두 번 돌아도 같은 아이디로 두 번 가입을 시도하지 않게 막는다
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
          // 회원가입 성공 후 저장된 회원가입 관련 데이터 삭제
          await removeData('userData');
          console.log('[회원가입 완료 화면] AsyncStorage의 userData 삭제 완료');
          setShow(true); // 가입 성공 화면 보여주기
        } else {
          console.log('========================================');
          console.log('[회원가입 완료 화면] 회원가입 실패, 사유:', data.resultMsg);
          console.log('========================================');
          // 회원가입 실패 후에도 저장된 회원가입 관련 데이터 삭제
          await removeData('userData');
          console.log('[회원가입 완료 화면] AsyncStorage의 userData 삭제 완료');
          setShow(false);

          confirm({
            title: '회원가입 실패',
            message1: data.resultMsg, // 실패 사유 (본인인증 만료, 이미 가입된 사용자 등)
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

  useEffect(() => {
    // 제스처 뒤로가기 방지
    navigation.setOptions({
      gestureEnabled: false,
    });

    const backAction = () => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }], // 'Login' 화면으로 이동 (스택 리셋)
      });
      return true; // 기본 뒤로가기 동작 방지
    };

    // 웹에는 하드웨어 뒤로가기 버튼이 없고 BackHandler 도 지원되지 않아(콘솔 오류) 앱에서만 등록한다
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
      {/* 회원가입 성공 시에만 화면 보임 */}
      {show && (
        <>
          <KeyboardAwareScrollView
            contentContainerStyle={styles.container}
            keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}
            extraBottomPadding={CENTERING_EXTRA_BOTTOM_PADDING}>
            {/* 체크 애니메이션 → 환영 문구. 다른 성공 화면(ID 찾기·탈퇴 완료)과 같은 애니메이션을 써서 톤을 맞춘다 */}
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

            {/* 회원 정보 카드. 대시보드 잔액 카드와 같은 브랜드 그라디언트로 "내 회원카드" 느낌을 준다 */}
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
  // 세로 가운데 정렬. 아래 여백은 KeyboardAwareScrollView 가 덮어쓰므로 여기서 주지 않고 extraBottomPadding 으로 보정한다.
  container: { paddingHorizontal: 16, paddingVertical: 24, gap: 50, flexGrow: 1, justifyContent: 'center' },

  hero: { gap: 12, alignItems: 'center' },
  // 크기는 SuccessAnimation 의 size(160) 로 정한다.
  // Lottie 그림은 상자 안에 위 28px, 아래 35px 투명 여백을 두고 그려지므로 그만큼 음수 여백으로 상쇄해
  // 눈에 보이는 그림 기준으로 정렬되게 한다. (아래는 제목과 16px 정도 떨어지도록 조금 더 당긴다)
  animation: { marginTop: -28, marginBottom: -32 },

  memberCard: {
    // 웹은 프레임이 700px 까지 넓어져 카드가 너무 커 보인다. 휴대폰 폭 정도로 제한하고 가운데에 둔다.
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    borderRadius: theme.radius.xl,
    padding: 22,
    gap: 20,
    overflow: 'hidden',
    boxShadow: theme.shadow.primary,
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

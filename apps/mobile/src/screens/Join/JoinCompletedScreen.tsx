import React, { useEffect, useState } from 'react';
import { BackHandler, Image, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import { IUserData } from '@typ/userType';
import { joinService } from '@apis/usrApi';
import { getData, removeData } from '@storages/asyncStorage';
import { useDialog } from '@contexts/DialogContext';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  Typography,
} from '@components/common';
import styles from './JoinStepScreen.styles';

type JoinCompletedScreenProps = NativeStackScreenProps<RootStackParamList, 'JoinCompleted'>;

const JoinCompletedScreen: React.FC<JoinCompletedScreenProps> = ({ navigation }) => {
  /**
   * 회원가입 1~3 단계에서 저장한 정보 불러오기
   * 불러온 정보 사용자 정보로 상태관리
   */
  const [userData, setUserData] = useState<IUserData | null>(null);

  useEffect(() => {
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
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (userData) {
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
            message1: '회원가입에 실패했습니다.',
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

    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      {/* 회원가입 성공 시에만 화면 보임 */}
      {show && (
        <>
          <KeyboardAwareScrollView
            contentContainerStyle={[
              styles.container,
              {
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
              },
            ]}
            keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
            {/* 성공 메시지 */}
            <View style={{ gap: 12 }}>
              <View style={{ alignItems: 'center' }}>
                <Typography mode="subtitle1" color="gray900">
                  회원가입이
                </Typography>
                <Typography mode="subtitle1" color="gray900">
                  완료되었습니다.
                </Typography>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Typography mode="body2" color="gray900">
                  회원가입 절차가 모두 정상적으로 완료되었습니다.
                </Typography>
                <Typography mode="body2" color="gray900">
                  로그인을 하시면 서비스 이용이 가능합니다.
                </Typography>
              </View>
            </View>

            {/* 이미지 */}
            <Image
              source={require('@images/illust/join_completed.png')}
              style={{ width: 161, height: 99 }}
              resizeMode="contain"
            />

            {/* 회원 정보 */}
            <View style={{ gap: 16, alignItems: 'center' }}>
              <Typography mode="subtitle2" color="gray900">
                회원정보
              </Typography>

              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <Typography mode="body2" color="gray900" style={{ width: 26 }}>
                    이름
                  </Typography>
                  <Typography mode="body2" color="gray600">
                    {userData?.usrNm}
                  </Typography>
                </View>

                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <Typography mode="body2" color="gray900" style={{ width: 26 }}>
                    ID
                  </Typography>
                  <Typography mode="body2" color="gray600">
                    {userData?.mbUid}
                  </Typography>
                </View>
              </View>
            </View>
          </KeyboardAwareScrollView>

          <BottomBtnBox
            buttonKey={'goToLogin'}
            disabled={false}
            label={'로그인'}
            onPress={() =>
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                }),
              )
            }
          />
        </>
      )}
    </ScreenWrapper>
  );
};

export default JoinCompletedScreen;
export { JoinCompletedScreen };

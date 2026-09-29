import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import { getData, removeData } from '@storages/asyncStorage';
import { useDialog } from '@contexts/DialogContext';
import { checkUsrPwd, handleCertifyResult, requestCertifyUrl } from '@apis/usrApi';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  Header,
  KeyboardAwareScrollView,
  ScreenWrapper,
  TextField,
  Typography,
} from '@components/common';

type EditUserCheckScreenProps = NativeStackScreenProps<RootStackParamList, 'EditCheck'>;

const EditUserCheckScreen: React.FC<EditUserCheckScreenProps> = ({ navigation, route }) => {
  // 이전 화면에서 얻어온 사용자 데이터 및 화면 플래그
  const { usrData, flg } = route.params;

  // 플래그에 따라 화면 헤더 설정
  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <Header title={flg === 'usrInfo' ? '회원정보 변경' : '간편 비밀번호 변경'} bgColor="white" leftButton />
      ),
    });
  }, [navigation]);

  // Dialog
  const { alert, confirm } = useDialog();

  /**
   * 마이페이지가 회원 정보를 아직 못 받았거나(조회 중·세션 만료) 실패한 채로 들어오면 usrData 가 null 이다.
   * 그대로 진행하면 usrData.usrNm 접근에서 앱이 죽으므로 안내 후 돌려보낸다.
   */
  useEffect(() => {
    if (usrData) return;
    alert({
      title: '회원 정보 없음',
      message1: '회원 정보를 불러오지 못했습니다.',
      message2: '잠시 후 다시 시도해 주세요.',
    }).then(() => navigation.goBack());
  }, [usrData, alert, navigation]);

  /**
   * 패스워드 입력 후 일치하면 다음 화면으로 이동
   * 패스워드 값이 입력되어야 다음 버튼 활성화
   * 패스워드 불일치 시, 실패 모달창 노출
   */
  const [pwd, setPwd] = useState<string>('');
  const isButtonDisabled = !(pwd.length > 0);

  /**
   * 확인에 통과한 계정 비밀번호 보관용.
   * 간편 비밀번호 변경은 본인인증 화면을 다녀온 뒤에 다음 화면으로 넘어가는데, 그 사이 입력칸(pwd)은 이미 비워지므로
   * 입력칸 상태와 따로 들고 있어야 한다 (전에는 빈 값이 넘어가 마지막 변경 API 에서 "비밀번호가 일치하지 않습니다" 로 실패했다).
   */
  const verifiedPwdRef = useRef<string>('');

  const handleChkPwd = () => {
    if (!usrData) return;
    checkUsrPwd(pwd).then((data) => {
      if (data.resultCd === '0000') {
        // 비밀번호 검증 성공
        if (flg === 'usrInfo') {
          navigation.navigate('EditInfo', {
            usrData,
            pwd: pwd,
          }); // 정보 변경 상세화면으로 이동

          // 다시 화면에 돌아왔을 때를 대비해 입력값 리셋
          setPwd('');
          Keyboard.dismiss();
        } else if (flg === 'pinNo') {
          Keyboard.dismiss();
          verifiedPwdRef.current = pwd; // 본인인증이 끝난 뒤 EditPinNo 로 넘길 값

          // 핀 번호 변경 화면으로 이동 전, 본인 인증
          confirm({
            title: '본인인증',
            message1: '간편 비밀번호 변경 전, 본인인증을 진행해 주세요.',
            confirmText: '본인인증 하기',
          }).then((ok) => {
            if (ok) {
              handleAuth();
            }
          });

          // 다시 화면에 돌아왔을 때를 대비해 입력값 리셋
          setPwd('');
          Keyboard.dismiss();
        }
      } else {
        Keyboard.dismiss();

        // 실패 모달창 보여주기
        alert({
          title: '비밀번호 불일치',
          message1: '입력하신 정보가 일치하지 않습니다.',
          message2: '확인 후 다시 입력해 주세요.',
        });
        setPwd('');
      }
    });
  };

  /**
   * 본인인증
   * 인증 성공 여부 확인
   */
  const handleAuth = async () => {
    try {
      // 인증 화면 URL 요청
      const data = await requestCertifyUrl('01');
      if (data.resultCd === '0000') {
        if (data.returnUrl) {
          navigation.navigate('AuthWeb', { uri: data.returnUrl });
        }
      } else {
        console.log('인증 URL 발급 실패:', data.resultMsg);
      }
    } catch (error) {
      console.error('인증 처리 중 오류:', error);
    }
  };

  // 본인인증 완료 후 화면 복귀 시, 데이터 읽어오기
  const [certData, setCertData] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadCertData = async () => {
        // 본인인증 화면에서 저장했던 certData 가져오기
        const storedCertData = await getData<string>('certData');

        if (storedCertData) {
          console.log('전달받은 간편인증 정보:', storedCertData);
          setCertData(storedCertData); // 상태에 certData 저장
        } else {
          console.log('전달받은 간편인증 정보 없음');
        }
      };

      loadCertData();
    }, []),
  );

  // certData가 업데이트 되었을 때 memberAuthKey 얻기
  useEffect(() => {
    const checkAuthName = async () => {
      if (!certData || !usrData) return;

      // 본인 인증 결과 확인
      const data = await handleCertifyResult(usrData.usrNm, certData);

      if (data.resultCd === '0000') {
        // 본인인증 정보와 계정 정보가 같음
        confirm({
          title: '본인인증',
          message1: '본인인증이 완료되었습니다.',
          confirmText: '확인',
        }).then((ok) => {
          if (ok) {
            navigation.navigate('EditPinNo', {
              usrData,
              pwd: verifiedPwdRef.current, // 입력칸(pwd)은 이미 비워졌으므로 보관해 둔 값을 넘긴다
            }); // 핀 번호 입력 화면으로 이동
            verifiedPwdRef.current = '';
          }
        });
      } else if (data.resultCd === '9999' && data.resultMsg.includes('입력하신 이름')) {
        // 본인인증 정보와 계정 정보가 다름
        alert({
          title: '오류',
          message1: '본인 인증 정보가 로그인하신 계정 정보와 일치하지 않습니다.',
          message2: '입력하신 정보를 다시 한 번 확인해주세요.',
        });
      }

      // 인증 성공 or 실패 후 certData 정리
      setCertData(null);
      await removeData('certData');
    };

    checkAuthName();
  }, [certData, usrData]);

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.container, { gap: 16, flexGrow: 1 }]}
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}
        keyboardShouldPersistTaps="handled">
        <View style={{ gap: 12 }}>
          <Typography mode="subtitle2" color="gray900">
            {flg === 'usrInfo' ? '회원정보' : '간편 비밀번호'} 변경
          </Typography>
          <Typography mode="body2" color="gray600">
            {flg === 'usrInfo' ? '회원정보' : '간편 비밀번호'} 변경을 위해 회원 비밀번호를 재확인해주세요.
          </Typography>
        </View>

        <View style={{ gap: 24 }}>
          {/* 로그인한 본인만 들어오는 화면이라 ID 를 가리지 않는다. 어느 계정의 비밀번호를 묻는지 보여 주는 역할 */}
          <TextField
            disabled
            id={'uid'}
            inputMode={'none'}
            label={'ID'}
            value={usrData?.mbUid ?? ''}
            onChangeText={() => undefined}
            placeholder={''}
          />

          <TextField
            id={'pwd'}
            inputMode={'text'}
            label={'PW'}
            value={pwd}
            onChangeText={(text: string) => setPwd(text)}
            placeholder={'비밀번호를 입력해 주세요.'}
            secure
          />
        </View>
      </KeyboardAwareScrollView>

      <BottomBtnBox
        buttonKey={isButtonDisabled.toString()}
        disabled={isButtonDisabled}
        label={'다음'}
        onPress={handleChkPwd}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 24 },
});

export default EditUserCheckScreen;
export { EditUserCheckScreen };

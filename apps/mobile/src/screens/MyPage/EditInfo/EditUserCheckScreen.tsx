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
import { theme } from '@styles';

type EditUserCheckScreenProps = NativeStackScreenProps<RootStackParamList, 'EditCheck'>;

const EditUserCheckScreen: React.FC<EditUserCheckScreenProps> = ({ navigation, route }) => {
  const { usrData, flg } = route.params;

  // 진입 목적(회원정보·간편 비밀번호)에 따라 헤더 제목을 바꾼다
  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <Header title={flg === 'usrInfo' ? '회원정보 변경' : '간편 비밀번호 변경'} bgColor="white" leftButton />
      ),
    });
  }, [navigation]);

  const { alert, confirm } = useDialog();

  // 마이페이지가 회원 정보를 못 받은 채(조회 중·세션 만료) 들어오면 usrData 가 null 이므로 안내 후 돌려보낸다
  useEffect(() => {
    if (usrData) return;
    alert({
      title: '회원 정보 없음',
      message1: '회원 정보를 불러오지 못했습니다.',
      message2: '잠시 후 다시 시도해 주세요.',
    }).then(() => navigation.goBack());
  }, [usrData, alert, navigation]);

  const [pwd, setPwd] = useState<string>('');
  const isButtonDisabled = !(pwd.length > 0);

  // 본인인증을 다녀오는 동안 입력칸은 비워지므로 확인된 비밀번호를 따로 보관한다
  const verifiedPwdRef = useRef<string>('');

  const handleChkPwd = () => {
    if (!usrData) return;
    checkUsrPwd(pwd).then((data) => {
      if (data.resultCd === '0000') {
        if (flg === 'usrInfo') {
          navigation.navigate('EditInfo', {
            usrData,
            pwd: pwd,
          });

          // 돌아왔을 때 비밀번호가 남지 않게 비운다
          setPwd('');
          Keyboard.dismiss();
        } else if (flg === 'pinNo') {
          Keyboard.dismiss();
          verifiedPwdRef.current = pwd;

          // 간편 비밀번호 변경은 본인인증을 먼저 거친다
          confirm({
            title: '본인인증',
            message1: '간편 비밀번호 변경 전, 본인인증을 진행해 주세요.',
            confirmText: '본인인증 하기',
          }).then((ok) => {
            if (ok) {
              handleAuth();
            }
          });

          // 돌아왔을 때 비밀번호가 남지 않게 비운다
          setPwd('');
          Keyboard.dismiss();
        }
      } else {
        Keyboard.dismiss();

        alert({
          title: '비밀번호 불일치',
          message1: '입력하신 정보가 일치하지 않습니다.',
          message2: '확인 후 다시 입력해 주세요.',
        });
        setPwd('');
      }
    });
  };

  const handleAuth = async () => {
    try {
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

  // 인증 화면이 저장해 둔 인증 결과
  const [certData, setCertData] = useState<string | null>(null);

  // 인증 화면에서 돌아오면 저장된 인증 결과를 읽어 온다
  useFocusEffect(
    useCallback(() => {
      const loadCertData = async () => {
        const storedCertData = await getData<string>('certData');

        if (storedCertData) {
          console.log('전달받은 간편인증 정보:', storedCertData);
          setCertData(storedCertData);
        } else {
          console.log('전달받은 간편인증 정보 없음');
        }
      };

      loadCertData();
    }, []),
  );

  // 인증 결과가 로그인한 계정의 이름과 일치하는지 확인한다
  useEffect(() => {
    const checkAuthName = async () => {
      if (!certData || !usrData) return;

      const data = await handleCertifyResult(usrData.usrNm, certData);

      if (data.resultCd === '0000') {
        confirm({
          title: '본인인증',
          message1: '본인인증이 완료되었습니다.',
          confirmText: '확인',
        }).then((ok) => {
          if (ok) {
            navigation.navigate('EditPinNo', {
              usrData,
              pwd: verifiedPwdRef.current, // 입력칸은 이미 비워졌으므로 보관해 둔 값을 넘긴다
            });
            verifiedPwdRef.current = '';
          }
        });
      } else if (data.resultCd === '9999' && data.resultMsg.includes('입력하신 이름')) {
        alert({
          title: '오류',
          message1: '본인 인증 정보가 로그인하신 계정 정보와 일치하지 않습니다.',
          message2: '입력하신 정보를 다시 한 번 확인해주세요.',
        });
      }

      // 한 번 쓴 인증 결과는 성공·실패와 관계없이 지운다
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
          <Typography mode="heading3" color="gray900">
            {flg === 'usrInfo' ? '회원정보' : '간편 비밀번호'} 변경
          </Typography>
          <Typography mode="body2" color="gray600">
            {flg === 'usrInfo' ? '회원정보' : '간편 비밀번호'} 변경을 위해 회원 비밀번호를 재확인해주세요.
          </Typography>
        </View>

        <View style={{ gap: 24 }}>
          {/* 로그인한 본인만 들어오는 화면이라 ID 를 가리지 않고, 어느 계정의 비밀번호를 묻는지 보여준다 */}
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
  container: { paddingHorizontal: 16, paddingTop: theme.screen.topForm },
});

export default EditUserCheckScreen;
export { EditUserCheckScreen };

import React, { useCallback, useEffect, useState } from 'react';
import { Keyboard, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import { getData, removeData } from '@storages/asyncStorage';
import { useDialog } from '@contexts/DialogContext';
import { findUserId, findUserPw, handleCertifyResult, requestCertifyUrl } from '@apis/usrApi';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  SecondaryButton,
  TabBar,
  TextField,
} from '@components/common';
import styles from './FindScreen.styles';

type FindScreenProps = NativeStackScreenProps<RootStackParamList, 'Find'>;

const FindScreen: React.FC<FindScreenProps> = ({ navigation }) => {
  const { alert } = useDialog();

  const [activeTab, setActiveTab] = useState<1 | 2>(1); // 1: ID 찾기, 2: PW 찾기

  // ID 찾기 입력값
  const [usrname, setUsrname] = useState<string>('');
  const [idEmail, setIdEmail] = useState<string>('');
  const [usrnameError, setUsrnameError] = useState<boolean>(false);

  // PW 찾기 입력값
  const [usrNm, setUsrNm] = useState<string>('');
  const [usrId, setUsrId] = useState<string>('');
  const [pwEmail, setPwEmail] = useState<string>('');
  const [usrNmError, setUsrNmError] = useState<boolean>(false);

  // 탭이 바뀌면 입력값과 인증 상태를 모두 비운다
  useEffect(() => {
    const resetState = async () => {
      setUsrname('');
      setIdEmail('');
      setUsrId('');
      setPwEmail('');
      setAuthSuc(false);
      setUsrnameError(false);
      setUsrNm('');
      setUsrNmError(false);

      // 저장된 본인인증 결과도 지워 다른 탭에서 재사용되지 않게 한다
      setCertData(null);
      await removeData('certData');
    };

    resetState();
  }, [activeTab]);

  // 아이디 찾기
  const handleFindId = () => {
    findUserId(idEmail, usrname).then((data) => {
      console.log('아이디 찾기 결과:', data);

      if (data.resultCd === '0000') {
        navigation.navigate('FindId', { mbUid: data.mbUid, regDnt: data.regDnt });
      } else {
        // 가입자 없음이면 정보 확인 안내를 덧붙이고, 그 외(인증 만료 등)는 서버 문구만 보여준다
        alert({
          title: 'ID 찾기',
          message1: data.resultMsg,
          message2: data.resultCd === 'MEMBER_NOT_FOUND' ? '입력하신 정보를 다시 한 번 확인해주세요.' : undefined,
        });
      }
    });
  };

  // 비밀번호 찾기
  const handleFindPw = () => {
    findUserPw(pwEmail, usrId, usrNm).then((data) => {
      console.log('비밀번호 찾기 결과:', data);

      if (data.resultCd === '0000') {
        // 데모는 임시 비밀번호를 메일 대신 화면에 보여준다
        navigation.navigate('FindPw', { mbUid: data.mbUid, tempPwd: data.tempPwd });
      } else {
        // 가입자 없음이면 정보 확인 안내를 덧붙이고, 그 외(인증 만료 등)는 서버 문구만 보여준다
        alert({
          title: 'PW 찾기',
          message1: data.resultMsg,
          message2: data.resultCd === 'MEMBER_NOT_FOUND' ? '입력하신 정보를 다시 한 번 확인해주세요.' : undefined,
        });
      }
    });
  };

  // 본인인증 완료 여부
  const [authSuc, setAuthSuc] = useState<boolean>(false);

  const handleAuth = async (identCd: '01' | '02') => {
    // 인증 화면에서 돌아왔을 때 키보드가 남지 않도록 미리 닫는다
    Keyboard.dismiss();

    // 이름은 인증 결과와 대조하는 값이라 인증 전에 입력되어 있어야 한다
    if (activeTab === 1 && !usrname.trim()) {
      setUsrnameError(true);
      return;
    }

    if (activeTab === 2 && !usrNm.trim()) {
      setUsrNmError(true);
      return;
    }

    try {
      const data = await requestCertifyUrl(identCd);
      if (data.resultCd === '0000') {
        if (data.returnUrl) {
          navigation.navigate('FindAuthWeb', { uri: data.returnUrl });
        }
      } else {
        console.log('인증 URL 발급 실패:', data.resultMsg);
      }
    } catch (error) {
      console.error('인증 처리 중 오류:', error);
    }
  };

  const [certData, setCertData] = useState<string | null>(null);

  // 인증 화면에서 돌아오면 저장된 인증 결과를 읽어 온다
  useFocusEffect(
    useCallback(() => {
      const loadCertData = async () => {
        const stored = await getData<string>('certData');
        setCertData(stored);

        // 재검증이 끝나기 전까지는 미완료로 되돌려 이름을 고칠 수 있게 한다
        if (stored) {
          setAuthSuc(false);
        }
      };
      loadCertData();
    }, []),
  );

  // 저장된 인증 결과가 입력한 이름과 일치하는지 서버에 확인한다
  useEffect(() => {
    const checkAuthName = async () => {
      if (!certData) return;

      const targetName = activeTab === 1 ? usrname : usrNm;
      const data = await handleCertifyResult(targetName, certData);

      if (data.resultCd === '0000') {
        setAuthSuc(true);
      } else if (data.resultCd === '9999' && data.resultMsg.includes('입력하신 이름')) {
        // 인증 자체는 됐지만 입력한 이름과 다른 경우
        alert({
          title: '오류',
          message1: '본인 인증 정보가 입력하신 이름과 일치하지 않습니다.',
          message2: '입력하신 정보를 다시 한 번 확인해주세요.',
        });
        setAuthSuc(false);

        // 이름을 고친 뒤 다시 인증할 수 있도록 결과를 지운다
        setCertData(null);
        await removeData('certData');
      }
    };

    checkAuthName();
  }, [certData, activeTab, usrname, usrNm]);

  // 입력 칸이 모두 채워지고 본인인증까지 끝나야 활성화된다
  const isButtonDisabled =
    activeTab === 1 ? !(usrname.trim() && idEmail.trim() && authSuc) : !(usrId.trim() && pwEmail.trim() && authSuc);

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.wrap, { flexGrow: 1 }]}
        keyboardShouldPersistTaps="handled"
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        <View>
          <TabBar
            active={activeTab}
            label1={'ID 찾기'}
            label2={'PW 찾기'}
            onPress1={() => setActiveTab(1)}
            onPress2={() => setActiveTab(2)}
          />
        </View>

        {/* ID, PW 찾기 입력 폼 */}
        <View style={{ gap: 24 }}>
          {activeTab === 1 ? (
            <>
              <TextField
                id={'usrname'}
                inputMode={'text'}
                label={'이름'}
                value={usrname}
                onChangeText={(text: string) => {
                  setUsrname(text);
                  if (usrnameError && text.trim()) {
                    setUsrnameError(false);
                  }
                }}
                placeholder={''}
                disabled={authSuc && activeTab === 1} // 본인인증 완료 시 수정 불가
                error={usrnameError}
                descMessage={usrnameError ? '본인인증 전, 이름을 먼저 입력하세요.' : undefined}
              />

              <TextField
                id={'idEmail'}
                inputMode={'email'}
                label={'이메일'}
                value={idEmail}
                onChangeText={(text: string) => setIdEmail(text)}
                placeholder={''}
              />

              <SecondaryButton
                label={authSuc ? '인증완료' : '휴대폰 본인인증'}
                onPress={() => handleAuth('01')}
                size={'lg'}
                style={{ flex: 1 }}
                disabled={authSuc}
              />
            </>
          ) : (
            <>
              <TextField
                id={'usrNm'}
                inputMode={'text'}
                label={'이름'}
                value={usrNm}
                onChangeText={(text: string) => {
                  setUsrNm(text);
                  if (usrNmError && text.trim()) {
                    setUsrNmError(false);
                  }
                }}
                placeholder={''}
                disabled={authSuc && activeTab === 2} // 본인인증 완료 시 수정 불가
                error={usrNmError}
                descMessage={usrNmError ? '본인인증 전, 이름을 먼저 입력하세요.' : undefined}
              />

              <TextField
                id={'usrId'}
                inputMode={'text'}
                label={'ID'}
                value={usrId}
                onChangeText={(text: string) => setUsrId(text)}
                placeholder={''}
              />

              <TextField
                id={'pwEmail'}
                inputMode={'email'}
                label={'이메일'}
                value={pwEmail}
                onChangeText={(text: string) => setPwEmail(text)}
                placeholder={''}
              />

              <SecondaryButton
                label={authSuc ? '인증완료' : '휴대폰 본인인증'}
                onPress={() => handleAuth('01')}
                size={'lg'}
                style={{ flex: 1 }}
                disabled={authSuc}
              />
            </>
          )}
        </View>
      </KeyboardAwareScrollView>

      <BottomBtnBox
        buttonKey={isButtonDisabled.toString()}
        disabled={isButtonDisabled}
        label={activeTab === 1 ? 'ID 찾기' : 'PW 찾기'}
        onPress={() => {
          Keyboard.dismiss();

          if (activeTab === 1) {
            handleFindId();
          } else if (activeTab === 2) {
            handleFindPw();
          }
        }}
      />
    </ScreenWrapper>
  );
};

export default FindScreen;
export { FindScreen };

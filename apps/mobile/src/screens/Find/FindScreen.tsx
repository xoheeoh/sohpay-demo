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
  // Dialog
  const { alert } = useDialog();

  // 활성화 된 탭 상태관리
  const [activeTab, setActiveTab] = useState<1 | 2>(1); // 1: ID 찾기, 2: PW 찾기

  // ID 찾기 입력 내용 상태관리
  const [usrname, setUsrname] = useState<string>('');
  const [idEmail, setIdEmail] = useState<string>('');
  const [usrnameError, setUsrnameError] = useState<boolean>(false);

  // PW 찾기 입력 내용 상태관리
  const [usrNm, setUsrNm] = useState<string>('');
  const [usrId, setUsrId] = useState<string>('');
  const [pwEmail, setPwEmail] = useState<string>('');
  const [usrNmError, setUsrNmError] = useState<boolean>(false);

  // 탭이 바뀌면 기존에 입력했던 내용 및 인증 상태 리셋
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

      // 기존 본인인증 정보도 제거하여 탭 변경 시 재사용되지 않도록 처리
      setCertData(null);
      await removeData('certData');
    };

    resetState();
  }, [activeTab]);

  /**
   * ID, PW 찾기
   * 성공 시, 성공 화면으로 이동
   * 실패 시, 실패 모달 등장
   */
  // 아이디 찾기
  const handleFindId = () => {
    findUserId(idEmail, usrname).then((data) => {
      console.log('아이디 찾기 결과:', data);

      if (data.resultCd === '0000') {
        // 아이디 찾기 성공
        navigation.navigate('FindId', { mbUid: data.mbUid, regDnt: data.regDnt });
      } else {
        // 아이디 찾기 실패. 가입자 없음이면 정보 확인 안내, 그 외(인증 만료 등)는 서버 문구를 그대로 보여준다
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
        // 비밀번호 찾기 성공. 데모는 임시 비밀번호를 메일 대신 화면에 보여준다
        navigation.navigate('FindPw', { mbUid: data.mbUid, tempPwd: data.tempPwd });
      } else {
        // 비밀번호 찾기 실패. 가입자 없음이면 정보 확인 안내, 그 외(인증 만료 등)는 서버 문구를 그대로 보여준다
        alert({
          title: 'PW 찾기',
          message1: data.resultMsg,
          message2: data.resultCd === 'MEMBER_NOT_FOUND' ? '입력하신 정보를 다시 한 번 확인해주세요.' : undefined,
        });
      }
    });
  };

  /**
   * 본인인증
   * 인증 성공 여부 확인
   */
  const [authSuc, setAuthSuc] = useState<boolean>(false);

  // 휴대폰 본인인증 버튼 클릭 이벤트
  const handleAuth = async (identCd: '01' | '02') => {
    // 열린 키보드 닫기 (인증 완료 후 화면 복귀했을 때 대비)
    Keyboard.dismiss();

    // ID 찾기 탭에서 이름이 비어있으면 에러 표시하고 본인인증 로직 실행하지 않음
    if (activeTab === 1 && !usrname.trim()) {
      setUsrnameError(true);
      return;
    }

    // PW 찾기 탭에서 이름이 비어있으면 에러 표시하고 본인인증 로직 실행하지 않음
    if (activeTab === 2 && !usrNm.trim()) {
      setUsrNmError(true);
      return;
    }

    try {
      // 인증 화면 URL 요청
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

  // 화면 포커스 시 certData 로드 및 상태 초기화
  useFocusEffect(
    useCallback(() => {
      const loadCertData = async () => {
        const stored = await getData<string>('certData');
        setCertData(stored);

        // 화면 재진입 시 인증 상태 초기화 (이름 수정 가능하도록)
        if (stored) {
          setAuthSuc(false);
        }
      };
      loadCertData();
    }, []),
  );

  // 입력값 상태/인증 데이터 변경 시 비교
  useEffect(() => {
    const checkAuthName = async () => {
      if (!certData) return;

      // 활성 탭에 따라 해당 탭의 이름 값으로 본인인증 결과 확인
      const targetName = activeTab === 1 ? usrname : usrNm;
      const data = await handleCertifyResult(targetName, certData);

      // 본인인증 확인 성공
      if (data.resultCd === '0000') {
        setAuthSuc(true);
      } else if (data.resultCd === '9999' && data.resultMsg.includes('입력하신 이름')) {
        // 본인인증은 성공했지만 입력한 정보와 다름
        alert({
          title: '오류',
          message1: '본인 인증 정보가 입력하신 이름과 일치하지 않습니다.',
          message2: '입력하신 정보를 다시 한 번 확인해주세요.',
        });
        setAuthSuc(false);

        // 정보 수정 후 본인 인증을 다시 시도할 수 있도록
        setCertData(null);
        await removeData('certData');
      }
    };

    checkAuthName();
  }, [certData, activeTab, usrname, usrNm]);

  // 버튼 활성화 상태 계산 (각 탭일 때, 입력 칸이 모두 입력되고 본인인증 완료해야 활성화)
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
                  // 이름이 입력되면 에러 상태 초기화
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
                  // 이름이 입력되면 에러 상태 초기화
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

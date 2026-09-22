import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import type { RootStackParamList } from '@typ/navigation';
import { IUserData } from '@typ/userType';
import { filterUserId } from '@utils/input';
import { validateEmail } from '@utils/validator';
import { chkDuplicateUid, chkMemberAuthKey, handleCertifyResult, requestCertifyUrl, validationPwd } from '@apis/usrApi';
import { useDialog } from '@contexts/DialogContext';
import { getData, mergeData, removeData } from '@storages/asyncStorage';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  SecondaryButton,
  TextField,
  Typography,
} from '@components/common';
import styles from './JoinStepScreen.styles';

type JoinStepTwoScreenProps = NativeStackScreenProps<RootStackParamList, 'JoinTwo'>;

const JoinStepTwoScreen: React.FC<JoinStepTwoScreenProps> = ({ navigation }) => {
  // Dialog
  const { alert, confirm } = useDialog();

  const scrollViewRef = useRef<ScrollView>(null);
  const usrIdRef = useRef<TextInput>(null);
  const usrPwRef = useRef<TextInput>(null);
  const usrPwChkRef = useRef<TextInput>(null);

  /* 사용자명 입력 상태관리 */
  const [usrNm, setUsrNm] = useState<string>('');
  const [usrNmError, setUsrNmError] = useState<boolean>(false);

  /**
   * 이메일 입력 상태관리
   * 이메일 형식에 어긋나면 오류 설정
   */
  const [usrEmail, setUsrEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<boolean>(false);
  const isEmailChecked = usrEmail.length > 0 && !emailError;

  /**
   * 아이디 입력 상태관리
   * 아이디 형식에 어긋나면 오류 설정
   * 아이디 중복확인
   */
  const [usrId, setUsrId] = useState<string>('');
  const [idError, setIdError] = useState<boolean>(false);
  const [idDuplicate, setIdDuplicate] = useState<boolean>(true); // false: 중복X, true: 중복O
  const isIdChecked = usrId.length > 0 && !idError && !idDuplicate;
  const isDupIdButtonDisabled = !(usrId.length > 0 && !idError); // 아이디 중복확인 버튼 활성화 상태

  // 아이디 중복 확인
  const handleChkId = () => {
    if (usrId) {
      Keyboard.dismiss();

      if (!storedNonce) {
        alert({
          title: '중복확인',
          message1: '중복확인 전, 본인인증을 먼저 완료해 주세요.',
        });
        return;
      }

      chkDuplicateUid(usrId, storedNonce)
        .then((data) => {
          if (data.resultCd === '0000') {
            // 사용 가능한 아이디
            setIdDuplicate(false); // 중복된 아이디가 아님

            alert({
              title: '중복확인',
              message1: '사용할 수 있는 ID입니다!',
            });
          } else if (data.resultCd === 'MB_UID_TAKEN') {
            // 이미 쓰고 있는 아이디
            setIdDuplicate(true);
            alert({
              title: '중복확인',
              message1: '동일한 ID가 존재합니다.',
              message2: 'ID를 다시 입력해 주세요.',
            });
          } else {
            // 아이디 규칙 위반, 네트워크 오류 등. 서버가 준 문구를 그대로 보여준다
            setIdDuplicate(true);
            alert({
              title: '중복확인',
              message1: data.resultMsg,
            });
          }
        })
        .catch((error) => console.error(error));
    }
  };

  /**
   * 비밀번호 입력 상태관리
   * 비밀번호 형식에 어긋나면 오류 설정 (영문, 숫자, 특수문자 8~30자)
   * 비밀번호 확인과 일치하는지 비교
   */
  const [usrPw, setUsrPw] = useState<string>('');
  const [usrPwChk, setUsrPwChk] = useState<string>('');
  const [pwError, setPwError] = useState<boolean>(false);
  const [pwChkError, setPwChkError] = useState<boolean>(false);
  const isPwChecked = usrPw.length > 0 && usrPwChk.length > 0 && !pwError && !pwChkError;

  /**
   * 본인인증
   * 인증 성공 여부 확인
   */
  const [identifySuc, setIdentifySuc] = useState<boolean>(false); // true: 본인인증 성공, false: 본인인증 실패
  const [memberAuthKey, setMemberAuthKey] = useState<string>(''); // 본인인증 키

  // 버튼 활성화 상태 계산 (입력칸이 모두 입력되고, 아이디 중복체크가 되고, 이메일 형식이 맞고, 본인확인이 완료되면 활성화)
  const isButtonDisabled = !(usrNm.length > 0 && isEmailChecked && isIdChecked && isPwChecked && identifySuc);

  // 사용자 데이터 준비
  const prepareUserData = (): Partial<IUserData> => {
    const firstStepData: Partial<IUserData> = {
      usrNm: usrNm,
      email: usrEmail,
      mbUid: usrId,
      pwd: usrPw,
      memberAuthKey: memberAuthKey,
      nonce: storedNonce ?? '',
    };

    console.log('저장된 userData:', firstStepData);
    return firstStepData;
  };

  // 중복 가입자 검증
  const checkDuplicateUser = async (): Promise<boolean> => {
    if (memberAuthKey === '') {
      return false; // memberAuthKey가 없으면 중복 체크 필요X
    }

    try {
      const data = await chkMemberAuthKey(memberAuthKey);
      if (data.resultCd === '0000') {
        console.log('회원가입 가능한 사용자');
        return false;
      } else {
        console.log('중복 가입자:', data.resultMsg);
        return true;
      }
    } catch (error) {
      console.error('중복 가입자 확인 오류:', error);
      return false;
    }
  };

  // 입력한 가입 정보 저장
  const handleSaveJoinData = async () => {
    // 비밀번호 유효성 검사 실행
    validationPwd(usrPw, usrId, memberAuthKey).then(async (data) => {
      if (data.resultCd === '0000') {
        // 1. 저장할 사용자 데이터 준비
        const firstStepData = {
          ...prepareUserData(),
          pwd: usrPw,
        };

        // 2. 중복 가입자 여부 확인
        const isDuplicate = await checkDuplicateUser();
        if (isDuplicate) {
          const ok = await confirm({
            title: '가입 불가',
            message1: '이미 가입 이력이 있는 사용자입니다.',
            message2: '아이디 찾기 후 로그인해 주세요.',
          });
          if (ok) {
            navigation.navigate('Login'); // 로그인 화면으로 돌아가기
          }
          return; // 중복 가입자이므로 더 이상 진행 X
        }

        // 3. 사용자 데이터 저장
        await mergeData<IUserData>('userData', firstStepData);

        // 4. userData에 nonce가 포함되어 저장되었으므로, 별도로 저장된 nonce 삭제
        await removeData('nonce');

        // 5. 저장된 전체 데이터 확인 및 콘솔 출력
        const savedData = await getData<IUserData>('userData');
        console.log('========================================');
        console.log('[회원가입 2단계 화면] AsyncStorage 저장 완료');
        console.log('저장된 전체 userData:', JSON.stringify(savedData, null, 2));
        console.log('========================================');

        // 6. 다음 단계로 이동
        navigation.navigate('JoinThree', { memberAuthKey: memberAuthKey });
      } else {
        // 실패 모달 노출
        alert({
          title: '비밀번호 오류',
          message1: data.resultMsg,
        });
      }
    });
  };

  // 휴대폰 본인인증 / 간편인증 버튼 클릭 이벤트
  const handleAuth = async (identCd: '01' | '02') => {
    // 열린 키보드 닫기 (인증 완료 후 화면 복귀했을 때 대비)
    Keyboard.dismiss();

    // 이름이 비어있으면 에러 표시하고 본인인증 로직 실행하지 않음
    if (!usrNm.trim()) {
      setUsrNmError(true);
      return;
    }

    try {
      // 기존 certData 삭제
      await removeData('certData');

      // 인증 화면 URL 요청
      const data = await requestCertifyUrl(identCd);
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
  const [certData, setCertData] = useState<string | null>(null); // 간편인증 데이터 상태관리
  const [storedNonce, setStoredNonce] = useState<string | null>(null); // 본인인증 논스 상태관리

  useFocusEffect(
    useCallback(() => {
      const loadCertData = async () => {
        // 본인인증 화면에서 저장했던 certData 가져오기
        const storedCertData = await getData<string>('certData');
        const storedNonce = await getData<string>('nonce');

        if (storedCertData) {
          console.log('전달받은 간편인증 정보:', storedCertData, '전달받은 논스:', storedNonce);
          setCertData(storedCertData); // 상태에 certData 저장
          setStoredNonce(storedNonce); // 상태에 nonce 저장
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
      if (!certData) return;

      // 본인 인증 결과 확인
      const data = await handleCertifyResult(usrNm, certData);

      // 본인인증 확인 성공
      if (data.resultCd === '0000') {
        setIdentifySuc(true);
        setMemberAuthKey(data.memberAuthKey);

        alert({
          title: '본인인증',
          message1: '본인인증이 완료되었습니다.',
        });

        // 인증 성공 후 certData 정리
        setCertData(null);
        await removeData('certData');
      } else if (data.resultCd === '9999' && data.resultMsg.includes('입력하신 이름')) {
        // 본인인증은 성공했지만 입력한 정보와 다름
        alert({
          title: '오류',
          message1: '본인 인증 정보가 입력하신 이름과 일치하지 않습니다.',
          message2: '입력하신 정보를 다시 한 번 확인해주세요.',
        });

        setIdentifySuc(false);

        // 정보 수정 후 본인인증을 다시 시도할 수 있도록
        setUsrNm('');
        setCertData(null);
        await removeData('certData');
      }
    };

    checkAuthName();
  }, [certData, usrNm]);

  // 키보드 스크롤/패딩은 KeyboardAwareScrollView가 처리

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.container,
          {
            flexGrow: 1,
          },
        ]}
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}
        extraBottomPadding={60}
        keyboardShouldPersistTaps="handled">
        {/* 회원가입 단계 표시 */}
        <View style={styles.stepBox}>
          <View style={styles.stepBadge}>
            <Typography mode="caption1" color="gray900">
              1
            </Typography>
          </View>

          <View style={styles.stepLine}></View>

          <View style={styles.stepBadgeActive}>
            <Typography mode="caption1" color="white">
              2
            </Typography>
          </View>

          <View style={styles.stepLine}></View>

          <View style={styles.stepBadge}>
            <Typography mode="caption1" color="gray900">
              3
            </Typography>
          </View>
        </View>

        {/* 회원정보 입력 */}
        <View style={{ gap: 16, paddingBottom: 0 }}>
          <Typography mode="heading3" color="gray900">
            회원정보
          </Typography>

          <View style={{ gap: 24 }}>
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
              placeholder={'성명을 입력해 주세요.'}
              disabled={identifySuc} // 본인인증 완료 시 수정 불가
              error={usrNmError}
              descMessage={usrNmError ? '본인인증 전, 이름을 먼저 입력하세요.' : undefined}
            />

            <View style={styles.certify}>
              <SecondaryButton
                label={identifySuc ? '인증완료' : '휴대폰 본인인증'}
                onPress={() => handleAuth('01')}
                size={'large'}
                style={{ flex: 1 }}
                disabled={identifySuc}
              />
            </View>

            <TextField
              id={'usrEmail'}
              inputMode={'email'}
              label={'이메일'}
              value={usrEmail}
              onChangeText={(text: string) => {
                setUsrEmail(text);

                if (text.length > 0) {
                  if (validateEmail(text)) {
                    setEmailError(false);
                  } else {
                    setEmailError(true);
                  }
                } else {
                  setEmailError(false);
                }
              }}
              error={emailError ? true : false}
              descMessage={emailError ? '이메일 주소를 올바르게 입력해 주세요.' : undefined}
              placeholder={'이메일을 입력해 주세요.'}
            />

            <TextField
              id={'usrId'}
              inputMode={'text'}
              label={'ID'}
              value={usrId}
              inputRef={usrIdRef}
              onChangeText={(text: string) => {
                // 입력값 필터링
                const filtered = filterUserId(text);
                setUsrId(filtered);
                setIdDuplicate(true); // 아이디가 바뀌면 중복확인을 다시 받아야 한다

                if (filtered.length > 0) {
                  if (filtered.length < 6) {
                    setIdError(true);
                  } else {
                    setIdError(false);
                  }
                } else {
                  setIdError(false);
                }
              }}
              placeholder={'아이디를 입력해 주세요.'}
              error={idError ? true : false}
              descMessage={
                idError
                  ? '최소 6자리 이상 입력해 주세요.'
                  : '최소 6자리 이상 입력해 주세요. (영문 소문자, 숫자, _ 입력 가능)'
              }
              buttonDisabled={isDupIdButtonDisabled}
              buttonLabel="중복확인"
              buttonEvent={usrId.length > 0 ? handleChkId : () => undefined}
              maxLength={20}
            />

            <TextField
              id={'usrPw'}
              inputMode={'text'}
              label={'PW'}
              value={usrPw}
              inputRef={usrPwRef}
              onChangeText={(text: string) => {
                setUsrPw(text);
                setPwError(text.length > 0 ? text.length < 8 : false);
              }}
              placeholder={'비밀번호를 입력해 주세요.'}
              error={pwError ? true : false}
              descMessage={pwError ? '최소 8자리 이상 입력해 주세요.' : undefined}
              maxLength={25}
              secure
            />

            <TextField
              id={'usrPwChk'}
              inputMode={'text'}
              label={'PW 확인'}
              value={usrPwChk}
              inputRef={usrPwChkRef}
              onChangeText={(text: string) => {
                setUsrPwChk(text);
                setPwChkError(text.length > 0 ? usrPw !== text : false);
              }}
              placeholder={'비밀번호를 다시 입력해 주세요.'}
              error={pwChkError ? true : false}
              descMessage={pwChkError ? '비밀번호가 일치하지 않습니다.' : undefined}
              maxLength={25}
              secure
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      <BottomBtnBox
        buttonKey={isButtonDisabled.toString()}
        disabled={isButtonDisabled}
        label={'다음'}
        onPress={() => handleSaveJoinData()}
      />
    </ScreenWrapper>
  );
};

export default JoinStepTwoScreen;
export { JoinStepTwoScreen };

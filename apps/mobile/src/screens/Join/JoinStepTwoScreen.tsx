import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import type { RootStackParamList } from '@typ/navigation';
import { IUserData } from '@typ/userType';
import { filterUserId } from '@utils/input';
import { validateEmail } from '@utils/validator';
import {
  PWD_RULE,
  chkDuplicateUid,
  chkMemberAuthKey,
  handleCertifyResult,
  requestCertifyUrl,
  validationPwd,
} from '@apis/usrApi';
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
  const { alert, confirm } = useDialog();

  const scrollViewRef = useRef<ScrollView>(null);
  const usrIdRef = useRef<TextInput>(null);
  const usrPwRef = useRef<TextInput>(null);
  const usrPwChkRef = useRef<TextInput>(null);

  // 이름
  const [usrNm, setUsrNm] = useState<string>('');
  const [usrNmError, setUsrNmError] = useState<boolean>(false);

  // 이메일
  const [usrEmail, setUsrEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<boolean>(false);
  const isEmailChecked = usrEmail.length > 0 && !emailError;

  // 아이디
  const [usrId, setUsrId] = useState<string>('');
  const [idError, setIdError] = useState<boolean>(false);
  const [idDuplicate, setIdDuplicate] = useState<boolean>(true); // 중복확인을 통과하기 전까지는 중복으로 본다
  const isIdChecked = usrId.length > 0 && !idError && !idDuplicate;
  const isDupIdButtonDisabled = !(usrId.length > 0 && !idError);

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
            setIdDuplicate(false);

            alert({
              title: '중복확인',
              message1: '사용할 수 있는 ID입니다!',
            });
          } else if (data.resultCd === 'MB_UID_TAKEN') {
            setIdDuplicate(true);
            alert({
              title: '중복확인',
              message1: '동일한 ID가 존재합니다.',
              message2: 'ID를 다시 입력해 주세요.',
            });
          } else {
            // 아이디 규칙 위반, 네트워크 오류 등은 서버 문구를 그대로 보여준다
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

  // 비밀번호
  const [usrPw, setUsrPw] = useState<string>('');
  const [usrPwChk, setUsrPwChk] = useState<string>('');
  const [pwError, setPwError] = useState<boolean>(false);
  const [pwChkError, setPwChkError] = useState<boolean>(false);
  const isPwChecked = usrPw.length > 0 && usrPwChk.length > 0 && !pwError && !pwChkError;

  // 본인인증
  const [identifySuc, setIdentifySuc] = useState<boolean>(false);
  const [memberAuthKey, setMemberAuthKey] = useState<string>('');

  // 모든 입력이 유효하고 아이디 중복확인·본인인증까지 끝나야 활성화된다
  const isButtonDisabled = !(usrNm.length > 0 && isEmailChecked && isIdChecked && isPwChecked && identifySuc);

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

  // 같은 본인인증 정보로 이미 가입한 사용자인지 확인한다
  const checkDuplicateUser = async (): Promise<boolean> => {
    if (memberAuthKey === '') {
      return false;
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

  // 입력한 가입 정보를 저장하고 다음 단계로 넘어간다
  const handleSaveJoinData = async () => {
    // 비밀번호 규칙(아이디 포함 여부 등)은 서버가 검사한다
    validationPwd(usrPw, usrId, memberAuthKey).then(async (data) => {
      if (data.resultCd === '0000') {
        const firstStepData = {
          ...prepareUserData(),
          pwd: usrPw,
        };

        const isDuplicate = await checkDuplicateUser();
        if (isDuplicate) {
          const ok = await confirm({
            title: '가입 불가',
            message1: '이미 가입 이력이 있는 사용자입니다.',
            message2: '아이디 찾기 후 로그인해 주세요.',
          });
          if (ok) {
            navigation.navigate('Login');
          }
          return;
        }

        await mergeData<IUserData>('userData', firstStepData);

        // nonce 는 userData 에 함께 담겼으므로 따로 저장한 값은 지운다
        await removeData('nonce');

        const savedData = await getData<IUserData>('userData');
        console.log('========================================');
        console.log('[회원가입 2단계 화면] AsyncStorage 저장 완료');
        console.log('저장된 전체 userData:', JSON.stringify(savedData, null, 2));
        console.log('========================================');

        navigation.navigate('JoinThree', { memberAuthKey: memberAuthKey });
      } else {
        alert({
          title: '비밀번호 오류',
          message1: data.resultMsg,
        });
      }
    });
  };

  const handleAuth = async (identCd: '01' | '02') => {
    // 인증 화면에서 돌아왔을 때 키보드가 남지 않도록 미리 닫는다
    Keyboard.dismiss();

    // 이름은 인증 결과와 대조하는 값이라 인증 전에 입력되어 있어야 한다
    if (!usrNm.trim()) {
      setUsrNmError(true);
      return;
    }

    try {
      // 이전 인증 결과가 새 인증 결과로 읽히지 않게 지운다
      await removeData('certData');

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

  // 인증 화면이 저장해 둔 인증 결과와 nonce
  const [certData, setCertData] = useState<string | null>(null);
  const [storedNonce, setStoredNonce] = useState<string | null>(null);

  // 인증 화면에서 돌아오면 저장된 인증 결과를 읽어 온다
  useFocusEffect(
    useCallback(() => {
      const loadCertData = async () => {
        const storedCertData = await getData<string>('certData');
        const storedNonce = await getData<string>('nonce');

        if (storedCertData) {
          console.log('전달받은 간편인증 정보:', storedCertData, '전달받은 논스:', storedNonce);
          setCertData(storedCertData);
          setStoredNonce(storedNonce);
        } else {
          console.log('전달받은 간편인증 정보 없음');
        }
      };

      loadCertData();
    }, []),
  );

  // 인증 결과를 입력한 이름과 대조해 memberAuthKey 를 받는다
  useEffect(() => {
    const checkAuthName = async () => {
      if (!certData) return;

      const data = await handleCertifyResult(usrNm, certData);

      if (data.resultCd === '0000') {
        setIdentifySuc(true);
        setMemberAuthKey(data.memberAuthKey);

        alert({
          title: '본인인증',
          message1: '본인인증이 완료되었습니다.',
        });

        // 한 번 쓴 인증 결과가 다시 검증되지 않도록 지운다
        setCertData(null);
        await removeData('certData');
      } else if (data.resultCd === '9999' && data.resultMsg.includes('입력하신 이름')) {
        // 인증 자체는 됐지만 입력한 이름과 다른 경우
        alert({
          title: '오류',
          message1: '본인 인증 정보가 입력하신 이름과 일치하지 않습니다.',
          message2: '입력하신 정보를 다시 한 번 확인해주세요.',
        });

        setIdentifySuc(false);

        // 이름을 고친 뒤 다시 인증할 수 있도록 결과를 지운다
        setUsrNm('');
        setCertData(null);
        await removeData('certData');
      }
    };

    checkAuthName();
  }, [certData, usrNm]);

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
                size={'lg'}
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
                setPwError(text.length > 0 ? !PWD_RULE.test(text) : false);
              }}
              placeholder={'비밀번호를 입력해 주세요.'}
              error={pwError ? true : false}
              descMessage={pwError ? '영문·숫자·특수문자를 포함해 8~20자로 입력해 주세요.' : undefined}
              maxLength={20}
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
              maxLength={20}
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

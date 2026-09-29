import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '@typ/navigation';
import { IRefundAcnt } from '@typ/paymentType';
import { getBankName } from '@dt/bankCd';
import { maskAccountNumber } from '@utils/formatter';
import { validateEmail, isMaskedEmail } from '@utils/validator';
import { getData } from '@storages/asyncStorage';
import { useDialog } from '@contexts/DialogContext';
import { PWD_RULE, editUsrProfile, validationPwd } from '@apis/usrApi';
import { loadRefundAcnt } from '@apis/paymentApi';
import { KeyboardAwareScrollView, ScreenWrapper, TextField, Typography } from '@components/common';

type EditUserInfoScreenProps = NativeStackScreenProps<RootStackParamList, 'EditInfo'>;

const EditUserInfoScreen: React.FC<EditUserInfoScreenProps> = ({ route, navigation }) => {
  // 이전 화면에서 얻어온 현재 패스워드 및 사용자 정보 데이터
  const usrData = route.params.usrData;
  const [usrPwd, setUsrPwd] = useState<string>(route.params.pwd);

  // Dialog
  const { alert } = useDialog();

  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const emailRef = useRef<TextInput>(null);
  const pwdRef = useRef<TextInput>(null);
  const pwdChkRef = useRef<TextInput>(null);

  /**
   * 이메일 입력 상태관리
   * 이메일 형식에 어긋나면 오류 설정
   * 이메일 주소 유효한지 검증 먼저 하고, 성공하면 실제 변경 API 사용
   */
  const [usrEmail, setUsrEmail] = useState<string>(usrData.email);
  const [emailError, setEmailError] = useState<boolean>(false);
  const isEmailButtonDisabled = !(usrEmail.length > 0 && !emailError) || isMaskedEmail(usrEmail); // 이메일 인증 버튼 활성화 상태 (마스킹된 이메일일 때도 비활성화)

  // 실제 이메일 변경 시도 및 결과
  const handleChangeEmail = () => {
    Keyboard.dismiss();

    editUsrProfile(usrPwd, usrEmail, undefined).then((data) => {
      if (data.resultCd === '0000') {
        alert({
          title: '이메일 변경',
          message1: '회원님의 이메일 주소가',
          message2: '성공적으로 변경되었습니다.',
        });
      } else {
        console.log('이메일 주소 수정 실패!', data.resultMsg);

        alert({
          title: '이메일 변경',
          message1: '회원님의 이메일 주소 변경에 실패하였습니다.',
          message2: data.resultMsg,
        });
      }
    });
  };

  /**
   * 비밀번호 변경 시도
   * 성공 여부 상태관리 및 결과 모달창
   */
  const [pwd, setPwd] = useState<string>('');
  const [pwdError, setPwdError] = useState<boolean>(false);

  const [pwdChk, setPwdChk] = useState<string>('');
  const [pwdChkError, setPwdChkError] = useState<boolean>(false);
  const isPwdButtonDisabled = !(pwd.length > 0 && pwdChk.length > 0 && !pwdError && !pwdChkError);

  const handleChangePwd = async () => {
    Keyboard.dismiss();

    // 1. 비밀번호 유효성 검증
    const mbUid = await getData<string>('mbUid');
    validationPwd(pwd, `${mbUid}`, undefined, usrData.brthDt, usrData.hpNo).then((data) => {
      if (data.resultCd === '0000') {
        // 2-1. 유효성 검증 통과 - 비밀번호 수정 실행
        editUsrProfile(usrPwd, undefined, pwd).then((data) => {
          if (data.resultCd === '0000') {
            // 비밀번호 변경 성공 시 현재 비밀번호를 새 비밀번호로 업데이트
            setUsrPwd(pwd);
            // 입력 필드 초기화
            setPwd('');
            setPwdChk('');

            alert({
              title: 'PW 변경',
              message1: '회원님의 PW가',
              message2: '성공적으로 변경되었습니다.',
            });
          } else {
            console.log('패스워드 수정 실패!', data.resultMsg);

            alert({
              title: 'PW 변경',
              message1: '회원님의 PW 변경에 실패하였습니다.',
              message2: data.resultMsg, // 서버가 준 이유 (비밀번호 규칙·현재 비밀번호 불일치 등)
            });
          }
        });
      } else {
        // 2-2. 유효성 검증 통과 못함
        alert({
          title: 'PW 변경',
          message1: data.resultMsg,
        });

        // 기존 입력했던 비밀번호 리셋
        setPwd('');
        setPwdChk('');
      }
    });
  };

  // 등록된 내 계좌 조회
  const [acntData, setAcntData] = useState<IRefundAcnt | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadRefundAcnt().then((data) => {
        console.log('등록된 내 계좌 조회 결과:', data);

        if (data.resultCd === '0000') {
          setAcntData(data);
        }
      });
    }, []),
  );

  // PW와 PW 확인 일치 여부 검증 (pwd 또는 pwdChk가 변경될 때마다)
  useEffect(() => {
    if (pwdChk.length > 0) {
      setPwdChkError(pwd !== pwdChk);
    } else {
      setPwdChkError(false);
    }
  }, [pwd, pwdChk]);

  return (
    <ScreenWrapper backgroundColor="white">
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.container, { gap: 16, flexGrow: 1 }]}
        keyboardShouldPersistTaps="handled">
        <Typography mode="heading3" color="gray900">
          회원정보 변경
        </Typography>

        {/* 회원정보 상세. 앞 화면에서 비밀번호로 본인 확인을 마친 뒤라 이름·ID 는 가리지 않고 그대로 보여 준다 */}
        <View style={{ gap: 24, paddingBottom: 0 }}>
          <TextField
            id={'name'}
            inputMode={'none'}
            label={'이름'}
            value={usrData?.usrNm ?? ''}
            disabled
            onChangeText={() => undefined}
            placeholder={''}
          />

          <TextField
            id={'usrEmail'}
            inputMode={'email'}
            label={'이메일'}
            value={usrEmail}
            inputRef={emailRef}
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
            buttonDisabled={isEmailButtonDisabled}
            buttonLabel={'변경하기'}
            buttonEvent={handleChangeEmail}
          />

          <TextField
            id={'uid'}
            inputMode={'none'}
            label={'ID'}
            value={usrData?.mbUid ?? ''}
            disabled
            onChangeText={() => undefined}
            placeholder={''}
          />

          <TextField
            id={'pwd'}
            inputMode={'text'}
            label={'PW'}
            value={pwd}
            inputRef={pwdRef}
            onChangeText={(text: string) => {
              setPwd(text);
              setPwdError(text.length > 0 ? !PWD_RULE.test(text) : false);
            }}
            placeholder={'비밀번호를 입력해 주세요.'}
            error={pwdError ? true : false}
            descMessage={pwdError ? '영문·숫자·특수문자를 포함해 8~20자로 입력해 주세요.' : undefined}
            maxLength={20}
            secure
          />

          <TextField
            id={'usrPwChk'}
            inputMode={'text'}
            label={'PW 확인'}
            value={pwdChk}
            inputRef={pwdChkRef}
            onChangeText={(text: string) => setPwdChk(text)}
            placeholder={'비밀번호를 다시 입력해 주세요.'}
            error={pwdChkError ? true : false}
            descMessage={pwdChkError ? '비밀번호가 일치하지 않습니다.' : undefined}
            maxLength={20}
            secure
            buttonLabel="변경하기"
            buttonEvent={handleChangePwd}
            buttonDisabled={isPwdButtonDisabled}
          />

          <TextField
            id={'rfndAcnt'}
            inputMode={'text'}
            label={'등록계좌'}
            value={
              acntData && acntData?.rfndAcntNo !== null
                ? `${getBankName(acntData.rfndBankCd)} (${maskAccountNumber(acntData?.rfndAcntNo)})`
                : '-'
            }
            onChangeText={() => undefined}
            placeholder={''}
            buttonLabel={acntData?.rfndAcntNo !== null ? '변경하기' : '등록하기'}
            buttonEvent={
              acntData?.rfndAcntNo !== null
                ? () => navigation.navigate('RefundAuth', { flg: 'edit' })
                : () => navigation.navigate('RefundAuth', { flg: 'first' })
            }
            editable={false}
          />

          <TextField
            id={'identify'}
            inputMode={'none'}
            label={'본인인증'}
            value={'인증완료'}
            disabled
            onChangeText={() => undefined}
            placeholder={''}
          />
        </View>
      </KeyboardAwareScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 24 },
});

export default EditUserInfoScreen;
export { EditUserInfoScreen };

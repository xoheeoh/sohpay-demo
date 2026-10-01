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
import { theme } from '@styles';

type EditUserInfoScreenProps = NativeStackScreenProps<RootStackParamList, 'EditInfo'>;

const EditUserInfoScreen: React.FC<EditUserInfoScreenProps> = ({ route, navigation }) => {
  const usrData = route.params.usrData;
  // 변경 요청마다 현재 비밀번호로 인증하므로 상태로 들고 있다
  const [usrPwd, setUsrPwd] = useState<string>(route.params.pwd);

  const { alert } = useDialog();

  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const emailRef = useRef<TextInput>(null);
  const pwdRef = useRef<TextInput>(null);
  const pwdChkRef = useRef<TextInput>(null);

  // 이메일
  const [usrEmail, setUsrEmail] = useState<string>(usrData.email);
  const [emailError, setEmailError] = useState<boolean>(false);
  // 서버가 가려서 보낸(마스킹) 이메일은 그대로 저장할 수 없으므로 비활성화한다
  const isEmailButtonDisabled = !(usrEmail.length > 0 && !emailError) || isMaskedEmail(usrEmail);

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

  // 비밀번호
  const [pwd, setPwd] = useState<string>('');
  const [pwdError, setPwdError] = useState<boolean>(false);

  const [pwdChk, setPwdChk] = useState<string>('');
  const [pwdChkError, setPwdChkError] = useState<boolean>(false);
  const isPwdButtonDisabled = !(pwd.length > 0 && pwdChk.length > 0 && !pwdError && !pwdChkError);

  const handleChangePwd = async () => {
    Keyboard.dismiss();

    // 비밀번호 규칙(아이디·생년월일·전화번호 포함 여부 등)은 서버가 검사한다
    const mbUid = await getData<string>('mbUid');
    validationPwd(pwd, `${mbUid}`, undefined, usrData.brthDt, usrData.hpNo).then((data) => {
      if (data.resultCd === '0000') {
        editUsrProfile(usrPwd, undefined, pwd).then((data) => {
          if (data.resultCd === '0000') {
            // 이후 변경 요청은 새 비밀번호로 인증해야 한다
            setUsrPwd(pwd);
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
              message2: data.resultMsg, // 비밀번호 규칙 위반, 현재 비밀번호 불일치 등
            });
          }
        });
      } else {
        alert({
          title: 'PW 변경',
          message1: data.resultMsg,
        });

        setPwd('');
        setPwdChk('');
      }
    });
  };

  // 등록된 출금 계좌
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

  // 비밀번호를 고치면 확인칸의 일치 여부도 다시 검사한다
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

        {/* 앞 화면에서 비밀번호로 본인 확인을 마친 뒤라 이름·ID 는 가리지 않는다 */}
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
  // 아래 여백은 KeyboardAwareScrollView 가 계산한다
  container: { paddingHorizontal: 16, paddingTop: theme.screen.topForm },
});

export default EditUserInfoScreen;
export { EditUserInfoScreen };

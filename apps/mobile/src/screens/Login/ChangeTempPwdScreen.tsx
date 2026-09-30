import { useEffect, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import { useDialog } from '@contexts/DialogContext';
import { PWD_RULE, changeTempPwd, validationPwd } from '@apis/usrApi';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  TextField,
  Typography,
} from '@components/common';
import { theme } from '@styles';

type ChangeTempPwdScreenProps = NativeStackScreenProps<RootStackParamList, 'ChangeTempPwd'>;

const ChangeTempPwdScreen: React.FC<ChangeTempPwdScreenProps> = ({ route, navigation }) => {
  const { uid, tempPwd } = route.params;

  const [newPwd, setNewPwd] = useState<string>('');
  const [newPwdChk, setNewPwdChk] = useState<string>('');
  const [newPwError, setNewPwError] = useState<boolean>(false);
  const [newPwChkError, setNewPwChkError] = useState<boolean>(false);

  // 비밀번호를 고치면 확인칸의 일치 여부도 다시 검사한다
  useEffect(() => {
    if (newPwdChk.length === 0) {
      setNewPwChkError(false);
      return;
    }
    const isValidLen = newPwdChk.length >= 8;
    const isMatch = newPwdChk === newPwd;
    setNewPwChkError(!(isValidLen && isMatch));
  }, [newPwd, newPwdChk]);

  const isButtonDisabled = !(newPwd.length > 0 && newPwdChk.length > 0 && !newPwError && !newPwChkError);

  const { alert, confirm } = useDialog();

  const handleChangePwd = async () => {
    try {
      if (!uid) return;

      const validation = await validationPwd(newPwd, uid);
      console.log('비밀번호 유효성 검사 결과:', validation);

      // 길이·연속 숫자 등 비밀번호 규칙은 서버가 검사한다
      if (validation?.resultCd !== '0000') {
        await alert({
          title: '비밀번호 오류',
          message1: validation?.resultMsg ?? '비밀번호 유효성 검증에 실패했습니다.',
        });
        return;
      }

      const changed = await changeTempPwd(uid, tempPwd, newPwd);
      console.log('비밀번호 변경 결과:', changed);
      Keyboard.dismiss();

      if (changed?.resultCd === '0000') {
        const ok = await confirm({
          title: '비밀번호 변경',
          message1: '비밀번호 변경에 성공했습니다.',
          message2: '변경된 비밀번호로 로그인을 다시 시도해 주세요.',
          confirmText: '확인',
        });
        if (ok) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } else {
        await alert({
          title: '비밀번호 변경',
          message1: '비밀번호 변경에 실패했습니다.',
          message2: changed?.resultMsg,
        });
      }
    } catch (e) {
      console.error('비밀번호 변경 처리 중 오류:', e);
      await alert({
        title: '오류',
        message1: '요청 처리 중 오류가 발생했습니다.',
        message2: '잠시 후 다시 시도해 주세요.',
      });
    }
  };

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.wrap]}
        keyboardShouldPersistTaps="handled"
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        <Typography mode="heading3" color="gray900">
          신규 비밀번호 입력
        </Typography>

        <View style={{ gap: 24 }}>
          <TextField
            id={'pwd'}
            inputMode={'text'}
            label={'PW'}
            value={newPwd}
            onChangeText={(text: string) => {
              setNewPwd(text);
              setNewPwError(text.length > 0 ? !PWD_RULE.test(text) : false);
            }}
            placeholder={'비밀번호를 입력해 주세요.'}
            error={newPwError ? true : false}
            descMessage={newPwError ? '영문·숫자·특수문자를 포함해 8~20자로 입력해 주세요.' : undefined}
            maxLength={20}
            secure
          />

          <TextField
            id={'pwdChk'}
            inputMode={'text'}
            label={'PW 확인'}
            value={newPwdChk}
            onChangeText={(text: string) => {
              setNewPwdChk(text);
              // 입력 중에도 바로 반영되도록 길이와 일치 여부를 함께 검사한다
              if (text.length === 0) {
                setNewPwChkError(false);
                return;
              }
              const isValidLen = text.length >= 8;
              const isMatch = text === newPwd;
              setNewPwChkError(!(isValidLen && isMatch));
            }}
            placeholder={'비밀번호를 입력해 주세요.'}
            error={newPwChkError ? true : false}
            descMessage={newPwChkError ? '비밀번호가 일치하지 않습니다.' : undefined}
            maxLength={20}
            secure
          />
        </View>
      </KeyboardAwareScrollView>

      <BottomBtnBox
        buttonKey={isButtonDisabled.toString()}
        disabled={isButtonDisabled}
        label={'다음'}
        onPress={handleChangePwd}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: theme.screen.topForm,
    gap: 16,
    flexGrow: 1,
  },
});

export default ChangeTempPwdScreen;
export { ChangeTempPwdScreen };

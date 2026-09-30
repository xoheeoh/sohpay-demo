import { useEffect, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import { getData } from '@storages/asyncStorage';
import { useDialog } from '@contexts/DialogContext';
import { checkUsrPwd } from '@apis/usrApi';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  TextField,
  Typography,
} from '@components/common';
import { theme } from '@styles';

type WithdrawalScreenProps = NativeStackScreenProps<RootStackParamList, 'Withdrawal'>;

const WithdrawalScreen: React.FC<WithdrawalScreenProps> = ({ navigation }) => {
  // 어느 계정을 탈퇴하는지 보여주기 위한 로그인 아이디
  const [uid, setUid] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      const mbUid = await getData<string>('mbUid');

      if (mbUid) {
        setUid(mbUid);
      }
    };

    fetchData();
  }, []);

  const { alert } = useDialog();

  const [pwd, setPwd] = useState<string>('');
  const isButtonDisabled = !(pwd.length > 0);

  const handleChkPwd = () => {
    Keyboard.dismiss();

    checkUsrPwd(pwd).then((data) => {
      if (data.resultCd === '0000') {
        navigation.navigate('WithdrawalAgr', { pwd: pwd });
      } else {
        alert({
          title: '비밀번호 불일치',
          message1: '입력하신 정보가 일치하지 않습니다.',
          message2: '확인 후 다시 입력해 주세요.',
        });
        setPwd('');
      }
    });
  };

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.container, { gap: 16, flexGrow: 1 }]}
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}
        keyboardShouldPersistTaps="handled">
        <View style={{ gap: 12 }}>
          <Typography mode="heading3" color="gray900">
            회원탈퇴
          </Typography>
          <Typography mode="body2" color="gray600">
            회원탈퇴 진행을 위해 회원 비밀번호를 재확인해주세요.
          </Typography>
        </View>

        <View style={{ gap: 24 }}>
          {/* 로그인한 본인만 들어오는 화면이라 ID 를 가리지 않고, 어느 계정을 탈퇴하는지 보여준다 */}
          <TextField
            disabled
            id={'uid'}
            inputMode={'none'}
            label={'ID'}
            value={uid}
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

export default WithdrawalScreen;
export { WithdrawalScreen };

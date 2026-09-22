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

type WithdrawalScreenProps = NativeStackScreenProps<RootStackParamList, 'Withdrawal'>;

const WithdrawalScreen: React.FC<WithdrawalScreenProps> = ({ navigation }) => {
  // uid 정보 불러오기
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

  // Dialog
  const { alert } = useDialog();

  /**
   * 패스워드 입력 후 일치하면 다음 화면으로 이동
   * 패스워드 값이 입력되어야 다음 버튼 활성화
   * 패스워드 불일치 시, 실패 모달창 노출
   */
  const [pwd, setPwd] = useState<string>('');
  const isButtonDisabled = !(pwd.length > 0);

  const handleChkPwd = () => {
    Keyboard.dismiss();

    checkUsrPwd(pwd).then((data) => {
      if (data.resultCd === '0000') {
        // 비밀번호 검증 성공
        navigation.navigate('WithdrawalAgr', { pwd: pwd }); // 탈퇴 동의 화면으로 이동
      } else {
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

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.container, { gap: 16, flexGrow: 1 }]}
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}
        keyboardShouldPersistTaps="handled">
        <View style={{ gap: 12 }}>
          <Typography mode="subtitle2" color="gray900">
            회원탈퇴
          </Typography>
          <Typography mode="body2" color="gray600">
            회원탈퇴 진행을 위해 회원 비밀번호를 재확인해주세요.
          </Typography>
        </View>

        <View style={{ gap: 24 }}>
          {/* 로그인한 본인만 들어오는 화면이라 ID 를 가리지 않는다. 어느 계정을 탈퇴하는지 보여 주는 역할 */}
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
  container: { paddingHorizontal: 16, paddingVertical: 24 },
});

export default WithdrawalScreen;
export { WithdrawalScreen };

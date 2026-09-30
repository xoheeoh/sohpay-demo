import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '@typ/navigation';
import { useDialog } from '@contexts/DialogContext';
import { chkPaymentQR } from '@apis/paymentApi';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  TextField,
  Typography,
} from '@components/common';

type CodeInputScreenProps = NativeStackScreenProps<RootStackParamList, 'CodeInput'>;

const CodeInputScreen: React.FC<CodeInputScreenProps> = ({ navigation }) => {
  // Dialog
  const { alert } = useDialog();

  const [code, setCode] = useState<string>('');
  const isButtonDisabled = code.length > 0 ? false : true;

  // 결제코드 조회
  const handleChkCode = () => {
    chkPaymentQR(code).then((data) => {
      console.log('결제코드 조회 결과:', data);

      if (data.resultCd === '0000') {
        navigation.navigate('CodeInfo', { data: data });
      } else {
        // 서버가 구분해 주는 이유(만료·이미 결제됨·없는 코드)를 그대로 보여준다
        alert({
          title: '결제코드 오류',
          message1: data.resultMsg,
          message2: '확인 후 다시 입력해 주세요.',
        });
        setCode('');
      }
    });
  };

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}
        contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.inputBox}>
          <Typography mode="heading3" color="gray900">
            결제코드를 입력해 주세요.
          </Typography>

          <TextField
            id={'code'}
            inputMode={'numeric'}
            label={'결제코드'}
            value={code}
            onChangeText={(text: string) => setCode(text)}
            placeholder={''}
          />
        </View>
      </KeyboardAwareScrollView>

      <BottomBtnBox
        buttonKey={isButtonDisabled.toString()}
        disabled={isButtonDisabled}
        label={'확인'}
        onPress={handleChkCode}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  inputBox: { paddingVertical: 24, paddingHorizontal: 16, gap: 16 },
});

export default CodeInputScreen;
export { CodeInputScreen };

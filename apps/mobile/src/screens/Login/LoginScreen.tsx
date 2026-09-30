import { useEffect, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';

import type { RootStackParamList } from '@typ/navigation';
import { useDialog } from '@contexts/DialogContext';
import { checkTokenInAsyncStorage, getData, storeData, storeEncryptedToken } from '@storages/asyncStorage';
import { memberLogin } from '@apis/usrApi';
import {
  CheckBox,
  PrimaryButton,
  ScreenWrapper,
  TextButton,
  TextField,
  Typography,
  Wordmark,
} from '@components/common';
import { theme } from '@styles';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [userId, setUserId] = useState<string>('');
  const [userPw, setUserPw] = useState<string>('');
  const [idSave, setIdSave] = useState<boolean>(false);

  const { alert, confirm } = useDialog();

  const handleLogin = async () => {
    Keyboard.dismiss();

    const trimmedUserId = userId.trim();
    const trimmedUserPw = userPw.trim();

    if (!trimmedUserId && !trimmedUserPw) {
      await alert({
        title: '로그인',
        message1: '아이디와 비밀번호를 입력해주세요.',
      });
      return;
    }

    if (!trimmedUserId) {
      await alert({
        title: '로그인',
        message1: '아이디를 입력해주세요.',
      });
      return;
    }

    if (!trimmedUserPw) {
      await alert({
        title: '로그인',
        message1: '비밀번호를 입력해주세요.',
      });
      return;
    }

    try {
      const data = await memberLogin(trimmedUserId, trimmedUserPw);

      if (data.resultCd === '0000') {
        const { at, rt } = data;
        await storeEncryptedToken({ at, rt });

        // 보안 점검: 저장소에 토큰이 남아 있는지 확인한다
        await checkTokenInAsyncStorage();

        await storeData('mbUid', userId);

        if (idSave) {
          await storeData('uid', userId);
          await storeData('idSave', true);
        } else {
          await storeData('uid', '');
          await storeData('idSave', false);
        }

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Dashboard' }],
          }),
        );
      } else if (data.resultCd === '9003') {
        const ok = await confirm({
          title: '로그인',
          message1: '임시 비밀번호이니',
          message2: '비밀번호 변경 후 다시 로그인해 주세요.',
          confirmText: '확인',
        });
        if (ok) {
          const uidForChangePwd = trimmedUserId;
          const tempPwdForChange = trimmedUserPw;

          // 비밀번호 변경 뒤 로그인 화면이 다시 마운트되면 저장소에서 복원하므로, 정상 로그인과 같게 아이디 저장값을 맞춘다
          if (idSave) {
            await storeData('uid', userId);
            await storeData('idSave', true);
          } else {
            await storeData('uid', '');
            await storeData('idSave', false);
          }

          // 로그인 화면은 스택에 남아 상태가 유지되므로 비밀번호는 비우고, 아이디 저장을 끈 경우 아이디도 비운다
          setUserPw('');
          if (!idSave) {
            setUserId('');
          }

          navigation.navigate('ChangeTempPwd', { uid: uidForChangePwd, tempPwd: tempPwdForChange });
        }
      } else {
        // 아이디·비밀번호 오류, 탈퇴 계정 등 서버가 준 사유를 그대로 보여준다
        await alert({
          title: '로그인',
          message1: '로그인에 실패했습니다.',
          message2: data.resultMsg,
        });
        setUserPw('');
      }
    } catch (error) {
      console.error('로그인 처리 중 오류 발생:', error);
    }
  };

  // 저장해 둔 아이디를 복원한다
  useEffect(() => {
    const fetchData = async () => {
      const savedUserId = await getData<string>('uid');
      const savedIdSave = await getData<boolean>('idSave');

      if (savedUserId) {
        setUserId(savedUserId);
      }

      if (savedIdSave !== null) {
        setIdSave(savedIdSave);
      }
    };

    fetchData();
  }, []);

  return (
    <ScreenWrapper backgroundColor="white" topComponent={false} keyboardOffsetOverride={0} hasHeader={false}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        {/* 브랜드 */}
        <View style={styles.brand}>
          <Wordmark height={40} />
          <Typography mode="body1" color="gray500">
            충전하고, 스캔하고, 끝.
          </Typography>
        </View>

        {/* 입력 */}
        <View style={{ gap: 12 }}>
          <TextField
            id="userId"
            inputMode="text"
            label="아이디"
            value={userId}
            onChangeText={setUserId}
            placeholder=""
          />
          <TextField
            id="userPw"
            inputMode="text"
            label="비밀번호"
            value={userPw}
            onChangeText={setUserPw}
            placeholder=""
            secure
          />
          <CheckBox
            isChecked={idSave}
            setIsChecked={setIdSave}
            style={{ marginTop: 4, marginLeft: 2 }}
            labelComponent={
              <Typography mode="body2" color="gray700" style={{ flexShrink: 1 }}>
                아이디 저장
              </Typography>
            }
          />
        </View>

        {/* 액션 */}
        <View style={{ gap: 16 }}>
          <PrimaryButton label="로그인" onPress={handleLogin} size="lg" />

          <View style={styles.btnBox}>
            <TextButton label="아이디/비밀번호 찾기" onPress={() => navigation.navigate('Find')} size="sm" />
            <View style={styles.line} />
            <TextButton label="회원가입" onPress={() => navigation.navigate('JoinOne')} size="sm" />
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 24, paddingVertical: 32, flexGrow: 1, justifyContent: 'center', gap: 36 },
  brand: { gap: 10, marginBottom: 8 },
  btnBox: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  line: { backgroundColor: theme.colors.gray200, width: 1, height: 12 },
});

export default LoginScreen;
export { LoginScreen };

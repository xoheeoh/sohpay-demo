import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { useDialog } from '@contexts/DialogContext';
import { withdrawalUser } from '@apis/usrApi';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  CheckBox,
  KeyboardAwareScrollView,
  ScreenWrapper,
  Typography,
} from '@components/common';
import { layout, theme } from '@styles';

type WithdrawalAgrScreenProps = NativeStackScreenProps<RootStackParamList, 'WithdrawalAgr'>;

const WithdrawalAgrScreen: React.FC<WithdrawalAgrScreenProps> = ({ navigation, route }) => {
  // 이전 화면에서 가져온 패스워드
  const pwd = route.params.pwd;

  // Dialog
  const { alert } = useDialog();

  /**
   * 탈퇴 동의 여부 확인
   * 동의 체크박스 체크: 회원 탈퇴 버튼 활성화
   * 버튼 클릭 시 회원 탈퇴 함수 실행
   */
  const [agrChecked, setAgrChecked] = useState<boolean>(false);
  const isButtonDisabled = !agrChecked;

  const handleWithdrawal = () => {
    if (pwd) {
      withdrawalUser(pwd).then((data) => {
        if (data.resultCd === '0000') {
          // 회원 탈퇴 성공
          navigation.navigate('WithdrawalSuc'); // 성공 화면으로 이동
        } else {
          // 실패 모달 노출
          alert({
            title: '회원탈퇴 실패',
            message1: '현재 고객님 계정에 잔액이 존재하여\n회원 탈퇴에 실패하였습니다.',
            message2: '잔액 출금이 완료된 이후 다시 시도해주시기 바랍니다.',
          });
          navigation.pop(2);
        }
      });
    }
  };

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.container, { gap: 24 }]}
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        {/* 탈퇴 정보 알림 */}
        <View style={styles.alertBox}>
          <View style={{ gap: 12 }}>
            <Icon source={'alert-circle'} size={36} color={theme.colors.red500} />
            <Typography mode="body2" color="red500">
              회원 탈퇴 시, 회원과 관련한 모든 데이터가 복구할 수 없는 형태로 폐기됩니다.
            </Typography>
          </View>

          <View style={styles.infoBox}>
            <View style={layout.rowCenter}>
              <Typography mode="body2" color="gray900" style={{ width: 80 }}>
                회원정보
              </Typography>
              <Typography mode="body2" color="gray600">
                ID, PW, 본인인증 등
              </Typography>
            </View>

            <View style={layout.rowCenter}>
              <Typography mode="body2" color="gray900" style={{ width: 80 }}>
                결제정보
              </Typography>
              <Typography mode="body2" color="gray600">
                충전내역, 결제내역, 출금내역 등
              </Typography>
            </View>
          </View>
        </View>

        {/* 탈퇴 동의 체크박스 */}
        <CheckBox
          isChecked={agrChecked}
          setIsChecked={setAgrChecked}
          labelComponent={
            <Typography mode="body2" color="gray900" style={{ flexShrink: 1 }}>
              SohPay를 탈퇴하고 모든 데이터를 삭제하는 것에 동의합니다.
            </Typography>
          }
        />
      </KeyboardAwareScrollView>

      <BottomBtnBox
        buttonKey={isButtonDisabled.toString()}
        disabled={isButtonDisabled}
        label={'회원탈퇴'}
        onPress={handleWithdrawal}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 24 },
  alertBox: {
    backgroundColor: theme.colors.red50,
    borderWidth: 1,
    borderColor: theme.colors.red500,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 32,
  },
  infoBox: { backgroundColor: 'white', borderRadius: 12, gap: 12, padding: 12 },
});

export default WithdrawalAgrScreen;
export { WithdrawalAgrScreen };

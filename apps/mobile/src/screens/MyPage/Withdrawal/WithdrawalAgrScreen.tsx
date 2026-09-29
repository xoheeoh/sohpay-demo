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
  InfoBox,
  KeyboardAwareScrollView,
  ScreenWrapper,
  Typography,
} from '@components/common';
import { layout, theme } from '@styles';

type WithdrawalAgrScreenProps = NativeStackScreenProps<RootStackParamList, 'WithdrawalAgr'>;

/** 탈퇴 시 함께 폐기되는 정보 목록 */
const DELETED_DATA = [
  { icon: 'account-outline', label: '회원정보', desc: 'ID, 비밀번호, 본인인증 정보' },
  { icon: 'receipt-text-outline', label: '결제정보', desc: '충전·결제·출금 내역' },
  { icon: 'bank-outline', label: '계좌정보', desc: '등록된 출금 계좌' },
];

const WithdrawalAgrScreen: React.FC<WithdrawalAgrScreenProps> = ({ navigation, route }) => {
  // 이전 화면에서 가져온 패스워드
  const pwd = route.params.pwd;

  // Dialog
  const { alert, confirm } = useDialog();

  /**
   * 탈퇴 동의 여부 확인
   * 동의 체크박스 체크: 회원 탈퇴 버튼 활성화
   * 버튼 클릭 시 회원 탈퇴 함수 실행
   */
  const [agrChecked, setAgrChecked] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isButtonDisabled = !agrChecked || isSubmitting;

  const handleWithdrawal = async () => {
    if (!pwd || isSubmitting) return;
    setIsSubmitting(true);

    const data = await withdrawalUser(pwd);
    setIsSubmitting(false);

    if (data.resultCd === '0000') {
      // 회원 탈퇴 성공
      navigation.navigate('WithdrawalSuc'); // 성공 화면으로 이동
      return;
    }

    if (data.resultCd === 'BALANCE_REMAINING') {
      // 잔액이 남아 있어 서버가 거절: 출금 화면으로 바로 갈 수 있게 한다
      const goRefund = await confirm({
        title: '잔액이 남아 있어요',
        message1: '잔액을 모두 출금한 뒤에 탈퇴할 수 있습니다.',
        message2: '지금 출금 화면으로 이동할까요?',
        confirmText: '출금하러 가기',
      });
      if (goRefund) navigation.navigate('Refund');
      return;
    }

    // 그 외 실패(네트워크 등): 서버가 준 이유를 그대로 보여주고 이 화면에 남는다
    alert({
      title: '회원탈퇴 실패',
      message1: data.resultMsg,
      message2: '잠시 후 다시 시도해 주세요.',
    });
  };

  return (
    <ScreenWrapper backgroundColor={theme.colors.bg} keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.wrap}
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        {/* 경고 카드: 무엇이 사라지는지 */}
        <View style={styles.card}>
          <View style={[layout.rowCenter, { gap: 12 }]}>
            <View style={styles.warnCircle}>
              <Icon source="alert-circle-outline" size={22} color={theme.colors.red500} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Typography mode="subtitle2" color="gray900">
                탈퇴 전에 꼭 확인해 주세요
              </Typography>
              <Typography mode="body2" color="gray600">
                탈퇴하면 아래 정보가 복구할 수 없는 형태로 폐기됩니다.
              </Typography>
            </View>
          </View>

          <View style={styles.deletedList}>
            {DELETED_DATA.map((item, index) => (
              <View
                key={item.label}
                style={[layout.rowCenter, styles.deletedRow, index > 0 && styles.deletedRowDivider]}>
                <Icon source={item.icon} size={18} color={theme.colors.gray400} />
                <Typography mode="body2" color="gray900" style={styles.deletedLabel}>
                  {item.label}
                </Typography>
                <Typography mode="body2" color="gray600" style={{ flex: 1 }}>
                  {item.desc}
                </Typography>
              </View>
            ))}
          </View>

          {/* 잔액 조건: 서버가 잔액이 남아 있으면 탈퇴를 거절하므로 미리 알려준다 */}
          <InfoBox tone="yellow">잔액이 남아 있으면 탈퇴할 수 없어요. 먼저 잔액을 모두 출금해 주세요.</InfoBox>
        </View>

        {/* 동의 체크: 카드 밖 회색 배경 위에 둔다 */}
        <View style={styles.agree}>
          <CheckBox
            isChecked={agrChecked}
            setIsChecked={setAgrChecked}
            labelComponent={
              <Typography mode="body2" color="gray900" style={{ flexShrink: 1 }}>
                위 내용을 확인했으며, SohPay를 탈퇴하고 모든 데이터를 삭제하는 것에 동의합니다.
              </Typography>
            }
          />
        </View>
      </KeyboardAwareScrollView>

      <BottomBtnBox
        backgroundColor={theme.colors.bg}
        buttonKey={isButtonDisabled.toString()}
        disabled={isButtonDisabled}
        label={'회원탈퇴'}
        onPress={handleWithdrawal}
      />
    </ScreenWrapper>
  );
};

// 회원정보·출금 확인 화면과 같은 카드 모양
const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 24, gap: 16 },
  // 카드 안쪽 여백(20)에 맞춰 체크박스 시작 위치를 카드 내용과 나란히 둔다
  agree: { paddingHorizontal: 4, paddingTop: 4 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
    padding: 20,
    gap: 16,
  },
  warnCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.red50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletedList: { backgroundColor: theme.colors.gray50, borderRadius: theme.radius.md, paddingHorizontal: 14 },
  deletedRow: { gap: 10, paddingVertical: 12 },
  deletedRowDivider: { borderTopWidth: 1, borderTopColor: theme.colors.gray100 },
  deletedLabel: { width: 64 },
});

export default WithdrawalAgrScreen;
export { WithdrawalAgrScreen };

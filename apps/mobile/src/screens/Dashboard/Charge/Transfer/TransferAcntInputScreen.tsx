import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon, IconButton } from 'react-native-paper';

import { RootStackParamList } from '@typ/navigation';
import { getBankName } from '@dt/bankCd';
import { useDialog } from '@contexts/DialogContext';
import { getData } from '@storages/asyncStorage';
import { SelectBank } from '@components/dashboard';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  BottomSheet,
  CheckBox,
  KeyboardAwareScrollView,
  ScreenWrapper,
  TextField,
  Typography,
} from '@components/common';
import { layout, theme } from '@styles';

type TransferAcntInputScreenProps = NativeStackScreenProps<RootStackParamList, 'TransferAcntInput'>;

const TransferAcntInputScreen = ({ navigation, route }: TransferAcntInputScreenProps) => {
  const { amount } = route.params;
  const { alert } = useDialog();

  // 은행 선택 모달
  const [onBankModal, setOnBankModal] = useState<boolean>(false);

  // 입력값 상태관리
  const [bankCd, setBankCd] = useState<string>('');
  const [acntNo, setAcntNo] = useState<string>('');
  const [acntUsrNm, setAcntUsrNm] = useState<string>('');

  // 약관 동의
  const [agree, setAgree] = useState<boolean>(false);

  // 버튼 활성화 유무
  const isButtonDisabled = !(bankCd !== '' && acntNo.length > 0 && acntUsrNm.length > 0 && agree);

  const handleAcntConfirm = async () => {
    Keyboard.dismiss();
    const usrNm = await getData<string>('usrNm');

    // 본인 명의 계좌가 아니면 진행 불가
    if (usrNm !== acntUsrNm) {
      alert({
        title: '오류',
        message1: '본인 명의의 계좌에 대한 인증만 가능합니다.',
        message2: '입력하신 예금주명을 다시 확인해주세요.',
      });
      return;
    }

    // 핀 번호 입력 화면으로 이동
    navigation.navigate('PinCharge', {
      chargeAmt: amount,
    });
  };

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        <View style={[styles.wrap, { gap: 16 }]}>
          <Typography mode="heading3" color="gray900">
            충전을 위한{'\n'}계좌 정보를 입력해주세요.
          </Typography>

          {/* 은행 선택 */}
          <Pressable onPress={() => setOnBankModal(true)} style={styles.selectDropdown}>
            <Typography mode="body2" color="gray900" style={{ width: '80%' }}>
              {bankCd ? getBankName(bankCd) : '은행을 선택해주세요.'}
            </Typography>

            <Icon source={'chevron-down'} color={theme.colors.gray600} size={24} />
          </Pressable>

          {/* 계좌번호 */}
          <TextField
            id={'acntNo'}
            inputMode={'numeric'}
            label={'계좌번호'}
            value={acntNo}
            onChangeText={(text: string) => setAcntNo(text)}
            placeholder={'계좌번호를 입력해주세요.'}
          />

          {/* 예금주명 */}
          <TextField
            id={'acntUsrNm'}
            inputMode={'text'}
            label={'예금주명'}
            value={acntUsrNm}
            onChangeText={(text: string) => setAcntUsrNm(text)}
            placeholder={'예금주명을 입력해주세요.'}
          />
        </View>

        <View style={styles.divider} />

        <View style={[styles.wrap, { gap: 16 }]}>
          <View style={layout.rowBetween}>
            <CheckBox
              isChecked={agree}
              setIsChecked={() => setAgree(!agree)}
              labelComponent={
                <Typography mode="body2" color="gray900" style={{ flexShrink: 1 }}>
                  개인(신용)정보 제3자 제공 동의{' '}
                  <Typography mode="body2" color="red500">
                    (필수)
                  </Typography>
                </Typography>
              }
            />

            <IconButton
              icon="chevron-right"
              size={24}
              iconColor={theme.colors.gray600}
              onPress={() => navigation.navigate('TermContent', { flg: 0, title: '개인(신용)정보 제3자 제공 동의' })}
              style={styles.iconButton}
            />
          </View>

          <View style={styles.infoBox}>
            <Icon source={'information'} size={24} color={theme.colors.gray600} />

            <Typography mode="caption1" color="gray600" style={{ flexShrink: 1 }}>
              입력하신 계좌 정보는 충전에 1회 사용되며 '내 계좌' 정보에 저장되지 않습니다. 저장된 계좌 정보 수정을
              원하시는 경우, '마이페이지 {'>'} 계좌관리' 메뉴에서 업데이트 해주세요.
            </Typography>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <BottomBtnBox
        label="다음"
        buttonKey={isButtonDisabled.toString()}
        disabled={isButtonDisabled}
        onPress={handleAcntConfirm}
      />

      {/* 은행 선택 모달 */}
      <BottomSheet
        visible={onBankModal}
        setVisible={setOnBankModal}
        title={'은행 선택'}
        content={<SelectBank onSelectBank={(bankCd: string) => setBankCd(bankCd)} setVisible={setOnBankModal} />}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingVertical: 24, paddingHorizontal: 16 },
  selectDropdown: {
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.gray150,
    ...layout.rowBetween,
  },
  divider: { backgroundColor: theme.colors.gray100, height: 1, marginHorizontal: 16 },
  iconButton: { margin: 0, width: 24, height: 24 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.gray50,
    flex: 1,
  },
});

export default TransferAcntInputScreen;
export { TransferAcntInputScreen };

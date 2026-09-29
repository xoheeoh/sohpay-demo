import { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon, IconButton } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { useDialog } from '@contexts/DialogContext';
import { getData } from '@storages/asyncStorage';
import { requestAcntConfirm } from '@apis/paymentApi';
import { getBankName } from '@dt/bankCd';
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

type RefundAuthScreenProps = NativeStackScreenProps<RootStackParamList, 'RefundAuth'>;

const RefundAuthScreen = ({ navigation, route }: RefundAuthScreenProps) => {
  // flg: first => 환불계좌 최초 등록 / flg: edit => 환불계좌 수정
  const { flg } = route.params;

  // Dialog
  const { alert } = useDialog();

  // 은행 선택 모달
  const [onBankModal, setOnBankModal] = useState<boolean>(false);

  // 입력값 상태관리
  const [bankCd, setBankCd] = useState<string>('');
  const [acntNo, setAcntNo] = useState<string>('');
  const [acntUsrNm, setAcntUsrNm] = useState<string>('');

  // 약관 동의
  const [agree, setAgree] = useState<boolean>(false);

  /**
   * 본인 명의 확인: 예금주명이 로그인한 회원 이름과 같아야 한다 (출금 계좌는 돈이 나가는 곳이라 타인 계좌를 막는다).
   * 회원 이름은 대시보드에서 저장해 둔 값을 쓰고, 공백 차이("김 데모")는 무시하고 비교한다. 서버도 같은 검사를 한다.
   */
  const [memberName, setMemberName] = useState<string>('');
  useEffect(() => {
    getData<string>('usrNm').then((name) => setMemberName(name ?? ''));
  }, []);

  const normalizeName = (name: string) => name.replace(/\s+/g, '');
  const isHolderNameMismatch =
    acntUsrNm.length > 0 && memberName.length > 0 && normalizeName(acntUsrNm) !== normalizeName(memberName);

  // 버튼 활성화 유무
  const isButtonDisabled = !(
    bankCd !== '' &&
    acntNo.length > 0 &&
    acntUsrNm.length > 0 &&
    !isHolderNameMismatch &&
    agree
  );

  const handleAcntConfirm = () => {
    Keyboard.dismiss();

    requestAcntConfirm(bankCd, acntNo, acntUsrNm).then((data) => {
      console.log('환불계좌 1원 인증 요청 결과:', data);

      if (data.resultCd === '0000') {
        // 환불계좌 1원 인증 입력 화면으로 이동
        navigation.navigate('RefundAuthConfirm', {
          bankCd: bankCd,
          acntNo: acntNo,
          acntNm: acntUsrNm,
          nonce: data.nonce,
          flg: flg,
        });
      } else {
        const errMsg = data.resultMsg;

        alert({
          title: '송금 실패',
          message1: '1원 송금에 실패하였습니다.',
          message2: errMsg.includes('명의')
            ? errMsg
            : errMsg.includes('횟수')
              ? errMsg
              : '입력하신 계좌 정보를 다시 한 번 확인해주세요.',
        });
      }
    });
  };

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}
        keyboardShouldPersistTaps="handled">
        <View style={[styles.wrap, { gap: 16 }]}>
          <Typography mode="heading3" color="gray900">
            1원 인증을 위한{'\n'}계좌 정보를 등록해주세요.
          </Typography>

          {/* 은행 선택 */}
          <Pressable onPress={() => setOnBankModal(true)} style={styles.selectDropdown}>
            {/* 선택 전 안내 문구는 입력칸의 자리표시자 라벨과 같은 색으로 */}
            <Typography mode="body2" color={bankCd ? 'gray900' : 'gray400'} style={{ width: '80%' }}>
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
            error={isHolderNameMismatch}
            descMessage={
              isHolderNameMismatch ? '본인 명의 계좌만 등록할 수 있어요. 예금주명이 회원 이름과 달라요.' : undefined
            }
          />

          {/* 다음 단계 안내: 1원 인증이 처음인 사용자가 "다음"을 누르면 무슨 일이 생기는지 알 수 있게 */}
          <View style={styles.infoBox}>
            <View style={styles.infoIcon}>
              <Icon source="information-outline" size={18} color={theme.colors.gray600} />
            </View>
            <Typography mode="caption1" color="gray600" style={{ flex: 1 }}>
              다음을 누르면 입력한 계좌로 1원을 보내드려요. 입금자명에 적힌 숫자 3자리를 다음 화면에 입력하면 인증이
              끝납니다.{'\n'}데모에서는 실제 입금 없이 인증번호가 화면에 안내됩니다.
            </Typography>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.wrap}>
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
  // 아래 입력칸(TextField)과 같은 모서리·배경·테두리를 써서 한 묶음으로 보이게 한다
  selectDropdown: {
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: theme.colors.gray50,
    borderWidth: 1,
    borderColor: theme.colors.line,
    ...layout.rowBetween,
  },
  divider: { backgroundColor: theme.colors.gray100, height: 1, marginHorizontal: 16 },
  iconButton: { margin: 0, width: 24, height: 24 },
  // 안내 상자 (1:1 상담 답변중 안내 띠와 같은 톤)
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.gray50,
  },
  // 아이콘을 첫 줄 글자 높이(16)에 맞춰 가운데에 둔다
  infoIcon: { height: 16, justifyContent: 'center' },
});

export default RefundAuthScreen;
export { RefundAuthScreen };

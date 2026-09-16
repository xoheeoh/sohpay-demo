import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, StyleSheet, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '@typ/navigation';
import { useDialog } from '@contexts/DialogContext';
import { getBankErrorMessage } from '@dt/authErrorCd';
import { getBankName } from '@dt/bankCd';
import { BankErrorCode } from '@dt/enum';
import { chkAcntConfirmNo, editRefundAcnt, enrollRefundAcnt } from '@apis/paymentApi';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  Typography,
} from '@components/common';
import { layout, theme } from '@styles';

type RefundAuthConfirmScreenProps = NativeStackScreenProps<RootStackParamList, 'RefundAuthConfirm'>;

const RefundAuthConfirmScreen = ({ navigation, route }: RefundAuthConfirmScreenProps) => {
  // 이전 화면에서 얻어온 1원 인증 계좌 정보 파라미터
  const { bankCd, acntNo, acntNm, nonce, flg } = route.params;

  const [errorCode, setErrorCode] = useState<BankErrorCode | null>(null); // 에러코드
  const [certNum, setCertNum] = useState<string>(''); // 인증번호 숫자 3자리

  const scrollViewRef = useRef<any>(null);
  const certNumRef = useRef<TextInput>(null);
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);

  const insets = useSafeAreaInsets();

  // 인증번호 입력 Input 포커스
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const borderColor = isFocused ? theme.colors.primary : theme.colors.gray150;

  // 다음 버튼 활성화 유무
  const isButtonDisabled = !(certNum.length >= 3);

  // Dialog
  const { alert } = useDialog();

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    // iOS는 키보드 프레임 변화/레이아웃 타이밍 편차가 커서,
    // 공통 KeyboardAwareScrollView가 해도 가끔 덜 올라오는 기기가 있어
    // 이 화면은 "포커스 + 키보드 visible"일 때 한 번 더 아래로 밀어줌.
    if (Platform.OS !== 'ios') return;
    if (!isFocused) return;
    if (!keyboardVisible) return;
    const sv = scrollViewRef.current;
    if (!sv?.scrollToEnd) return;
    setTimeout(() => sv.scrollToEnd({ animated: true }), 50);
  }, [isFocused, keyboardVisible]);

  // 1원 인증번호 검증
  const handleCertifyNo = () => {
    Keyboard.dismiss();

    chkAcntConfirmNo(certNum, nonce).then((data) => {
      console.log('1원 인증 검증 결과:', data);

      if (data.resultCd === '0000') {
        if (flg === 'edit') {
          editRefundAcnt(bankCd, acntNo, acntNm).then((data) => {
            console.log('환불계좌 수정 결과:', data);

            if (data.resultCd === '0000') {
              alert({
                title: '변경 완료',
                message1: '계좌 정보가 변경되었습니다.',
              }).then(() => navigation.pop(2)); // 계좌 정보 입력 이전 화면으로 이동
            } else {
              alert({
                title: '변경 실패',
                message1: '계좌 정보 변경에 실패했습니다.',
                message2: data.resultMsg,
                confirmText: '돌아가기',
              }).then(() => navigation.goBack()); // 다시 은행 선택 화면으로 이동
            }
          });
        } else if (flg === 'first') {
          enrollRefundAcnt(bankCd, acntNo, acntNm).then((data) => {
            console.log('환불계좌 등록 결과:', data);

            if (data.resultCd === '0000') {
              alert({
                title: '등록 완료',
                message1: '계좌 정보가 등록되었습니다.',
              }).then(() => navigation.pop(2)); // 계좌 정보 입력 이전 화면으로 이동
            } else {
              alert({
                title: '등록 실패',
                message1: '계좌 정보 등록에 실패했습니다.',
                message2: data.resultMsg,
                confirmText: '돌아가기',
              }).then(() => navigation.goBack()); // 다시 은행 선택 화면으로 이동
            }
          });
        }
      } else {
        setErrorCode(data.resultCd);
      }
    });
  };

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        contentContainerStyle={{
          gap: 32,
          paddingHorizontal: 16,
          paddingTop: 24,
        }}
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}
        extraBottomPadding={60}
        keyboardShouldPersistTaps="handled">
        <Typography mode="heading3" color="gray900">
          입력하신 계좌에 입금된 1원의{'\n'}입금자명 숫자 3자리를 입력해주세요.
        </Typography>

        <View style={styles.cardBox}>
          <View style={styles.cardNum}>
            <Typography color="primary" mode="subtitle3">
              {getBankName(bankCd)}
              {'  '}
              {acntNo}
            </Typography>
          </View>

          <View style={{ gap: 8 }}>
            <View style={layout.rowBetween}>
              <Typography mode="body1" color="gray900">
                입금자명
              </Typography>

              <Typography mode="heading1" color="gray900">
                1원인증{' '}
                <Typography mode="heading1" color="primary">
                  ***
                </Typography>
              </Typography>
            </View>

            <View style={layout.rowBetween}>
              <Typography mode="body1" color="gray900">
                입금액
              </Typography>

              <Typography mode="heading3" color="gray900">
                1원
              </Typography>
            </View>
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <Typography mode="body2" color="gray900">
            숫자 3자리
          </Typography>

          <View style={[styles.inputContainer, { borderColor: borderColor }]}>
            <TextInput
              ref={certNumRef}
              onFocus={() => {
                setIsFocused(true);
              }}
              onBlur={() => setIsFocused(false)}
              inputMode="numeric"
              style={styles.input}
              id="certNum"
              value={certNum}
              onChangeText={(x: string) => setCertNum(x)}
            />
          </View>

          {/* 1원 인증 실패 시 보이는 오류 메시지 박스 */}
          {errorCode && (
            <View style={styles.errorBox}>
              <Icon source={'alert-circle'} size={24} color={theme.colors.red500} />
              <View>
                <Typography mode="body2" color="red500">
                  {getBankErrorMessage(errorCode).msg1}
                </Typography>
                {getBankErrorMessage(errorCode).msg2 && (
                  <Typography mode="body2" color="red500">
                    {getBankErrorMessage(errorCode).msg2}
                  </Typography>
                )}
              </View>
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>

      <BottomBtnBox
        label="다음"
        buttonKey={isButtonDisabled.toString()}
        disabled={isButtonDisabled}
        onPress={handleCertifyNo}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  cardBox: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.gray100,
    gap: 16,
    borderWidth: 1,
    borderColor: theme.colors.gray150,
    borderRadius: 12,
  },
  cardNum: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'baseline',
    backgroundColor: 'white',
  },
  inputContainer: {
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    flex: 1,
    borderWidth: 1,
  },
  input: {
    fontSize: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 56,
    color: theme.colors.gray600,
    fontFamily: 'Pretendard-Regular',
    includeFontPadding: false, // 안드로이드 기본 패딩 제거
  },
  errorBox: {
    borderWidth: 1,
    borderColor: theme.colors.red500,
    backgroundColor: theme.colors.red50,
    padding: 12,
    borderRadius: 4,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});

export default RefundAuthConfirmScreen;
export { RefundAuthConfirmScreen };

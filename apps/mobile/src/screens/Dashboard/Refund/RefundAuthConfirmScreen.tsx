import { useEffect, useRef, useState } from 'react';
import { Image, Keyboard, Platform, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import { useDialog } from '@contexts/DialogContext';
import { getBankImage, getBankName } from '@dt/bankCd';
import { maskAccountNumber } from '@utils/formatter';
import { chkAcntConfirmNo, editRefundAcnt, enrollRefundAcnt } from '@apis/paymentApi';
import {
  Badge,
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  InfoBox,
  KeyboardAwareScrollView,
  ScreenWrapper,
  TextField,
  Typography,
} from '@components/common';
import { layout, theme } from '@styles';

type RefundAuthConfirmScreenProps = NativeStackScreenProps<RootStackParamList, 'RefundAuthConfirm'>;

const RefundAuthConfirmScreen = ({ navigation, route }: RefundAuthConfirmScreenProps) => {
  // 이전 화면에서 얻어온 1원 인증 계좌 정보 파라미터
  const { bankCd, acntNo, acntNm, nonce, flg } = route.params;

  // 인증 실패 문구. 서버 오류 코드에 맞춘 문구(client.ts MESSAGES)를 그대로 보여준다
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [certNum, setCertNum] = useState<string>(''); // 인증번호 숫자 3자리

  const scrollViewRef = useRef<any>(null);
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);

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
    // 이 화면은 키보드가 올라올 때 한 번 더 아래로 밀어줌. (입력칸이 하나뿐이라 키보드가 보이면 곧 그 입력칸에 포커스된 상태다)
    if (Platform.OS !== 'ios') return;
    if (!keyboardVisible) return;
    const sv = scrollViewRef.current;
    if (!sv?.scrollToEnd) return;
    setTimeout(() => sv.scrollToEnd({ animated: true }), 50);
  }, [keyboardVisible]);

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
        setErrorMsg(data.resultMsg);
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

        {/* 입금 내역 카드: 은행 앱에 뜨는 입금 알림처럼 보이게. 계좌 카드(계좌관리·출금 확인)와 같은 줄 구성 */}
        <View style={styles.depositCard}>
          <View style={[layout.rowCenter, { gap: 12 }]}>
            <Image source={getBankImage(bankCd)} style={styles.bankLogo} />
            <View style={{ flex: 1, gap: 2 }}>
              <Typography mode="subtitle2" color="gray900">
                {getBankName(bankCd)}
              </Typography>
              <Typography mode="body2" color="gray600" style={{ letterSpacing: 0.5 }}>
                {maskAccountNumber(acntNo)}
              </Typography>
            </View>
            <Badge label="입금" tone="blue" />
          </View>

          <View style={styles.depositDivider} />

          <View style={{ gap: 10 }}>
            <View style={[layout.rowBetween, { gap: 16 }]}>
              <Typography mode="body2" color="gray500">
                입금자명
              </Typography>
              <Typography mode="subtitle1" color="gray900">
                소페이{' '}
                <Typography mode="subtitle1" color="primary">
                  ***
                </Typography>
              </Typography>
            </View>

            <View style={[layout.rowBetween, { gap: 16 }]}>
              <Typography mode="body2" color="gray500">
                입금액
              </Typography>
              <Typography mode="subtitle3" color="gray900">
                1원
              </Typography>
            </View>
          </View>

          <Typography mode="caption1" color="gray400">
            입금자명의 *** 자리에 적힌 숫자 3자리가 인증번호예요.
          </Typography>
        </View>

        <View style={{ gap: 12 }}>
          {/* 다른 화면과 같은 공용 입력칸. 라벨이 안에서 떠오르고, 포커스 표시는 컨테이너 테두리 색이 담당한다 */}
          <TextField
            id={'certNum'}
            inputMode={'numeric'}
            label={'인증번호 3자리'}
            value={certNum}
            onChangeText={(x: string) => {
              setCertNum(x.replace(/[^0-9]/g, '').slice(0, 3)); // 숫자 3자리만
              if (errorMsg) setErrorMsg(null); // 다시 입력하기 시작하면 이전 오류 표시를 지운다
            }}
            placeholder={''}
            error={!!errorMsg}
            descMessage={errorMsg ?? undefined}
          />

          {/* 데모 안내 */}
          <InfoBox>
            데모에서는 실제 입금 없이, 이전 화면에서 다음을 눌렀을 때 뜬 알림에 인증번호 3자리가 함께 표시됩니다.
          </InfoBox>
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
  // 입금 내역 카드 (계좌관리·출금 확인 화면의 계좌 줄과 같은 연회색 상자)
  depositCard: {
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 14,
  },
  bankLogo: { width: 44, height: 44, borderRadius: 22 }, // 계좌관리·출금 계좌 확인의 은행 로고와 같은 크기
  depositDivider: { height: 1, backgroundColor: theme.colors.gray150 },
});

export default RefundAuthConfirmScreen;
export { RefundAuthConfirmScreen };

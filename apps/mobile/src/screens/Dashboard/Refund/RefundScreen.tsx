import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { loadUserAmt } from '@apis/commonApi';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  SecondaryButton,
  TextField,
  Typography,
  typographyStyles,
} from '@components/common';
import { BottomAmtBtn } from '@components/dashboard';
import { theme } from '@styles';

type RefundScreenProps = NativeStackScreenProps<RootStackParamList, 'Refund'>;

const RefundScreen: React.FC<RefundScreenProps> = ({ navigation }) => {
  // 회원 잔액 출금 가능 금액 불러오기
  const [rmnAmt, setRmnAmt] = useState<number>(0);

  useEffect(() => {
    loadUserAmt().then((data) => {
      console.log('회원 잔액 조회 결과:', data);

      if (data.resultCd === '0000') {
        setRmnAmt(Number(data.ppCanRfndRmnAmt));
      }
    });
  }, []);

  // 잔액 출금 금액
  const [withdrawalAmt, setWithdrawalAmt] = useState('');

  /**
   * 출금 금액 검증 (충전하기 화면과 같은 방식: 틀린 값이면 입력칸 아래 문구가 빨갛게 바뀌고 다음 버튼이 꺼진다)
   * 서버(request_refund)도 0원 이하·잔액 초과를 거절하므로 같은 기준으로 미리 알려준다
   */
  const validateWithdrawalAmount = (amount: string): { isValid: boolean; errorMessage?: string } => {
    // 값이 입력되지 않은 최초 상태: 오류로 보지 않는다 (버튼만 꺼짐)
    if (!amount) {
      return { isValid: true };
    }

    const numAmount = Number(amount);
    if (numAmount === 0) {
      return { isValid: false, errorMessage: '0원은 출금할 수 없어요. 1원 이상 입력해 주세요.' };
    }
    if (numAmount > rmnAmt) {
      return { isValid: false, errorMessage: `출금 가능 금액(${rmnAmt.toLocaleString('ko-KR')}원)을 초과했어요.` };
    }

    return { isValid: true };
  };

  // 다음 버튼 활성화 상태 (비어 있거나 검증에 걸리면 비활성화)
  const validation = validateWithdrawalAmount(withdrawalAmt);
  const isButtonDisabled = !withdrawalAmt || !validation.isValid;

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        <View style={[styles.container, { gap: 16 }]}>
          <Typography mode="heading3" color="gray900">
            출금하실 금액을 입력해주세요.
          </Typography>

          <View>
            <TextField
              id={'withdrawal'}
              inputMode={'numeric'}
              label={'잔액 출금 금액'}
              value={withdrawalAmt}
              onChangeText={(x) => {
                const digits = x.replace(/[^0-9]/g, '');
                if (digits.length === 0) {
                  setWithdrawalAmt('');
                  return;
                }

                setWithdrawalAmt(Number(digits).toString());
              }}
              placeholder={'잔액 출금 금액을 입력해주세요.'}
            />
            {/* 왼쪽 문구는 입력칸의 설명(desc)이므로 입력칸 바로 아래 위에 붙인다. 버튼과 세로 가운데를 맞추지 않는다. (충전하기 화면과 같은 정렬) */}
            <View style={styles.descRow}>
              {validation.isValid ? (
                <View style={styles.desc}>
                  <View style={styles.descIcon}>
                    <Icon source={'information'} color={theme.colors.gray900} size={18} />
                  </View>

                  <Typography mode="caption1" color="gray600" style={styles.descText}>
                    잔액 출금 가능 금액은 {rmnAmt.toLocaleString('ko-KR')}원 입니다.
                  </Typography>
                </View>
              ) : (
                <View style={styles.desc}>
                  <View style={styles.descIcon}>
                    <Icon source={'information'} color={theme.colors.red500} size={18} />
                  </View>

                  <Typography mode="caption1" color="red500" style={styles.descText}>
                    {validation.errorMessage}
                  </Typography>
                </View>
              )}
              <SecondaryButton label={'전액 입력'} onPress={() => setWithdrawalAmt(rmnAmt.toString())} size={'md'} />
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <BottomAmtBtn
        add={(value: number) =>
          setWithdrawalAmt((prev) => {
            const newVal = Number(prev || 0) + value;
            return newVal.toString();
          })
        }
      />

      <BottomBtnBox
        buttonKey={isButtonDisabled.toString()}
        disabled={isButtonDisabled}
        label={'다음'}
        onPress={() => {
          // 틀린 값이면 버튼이 꺼져 있어 여기까지 오지 않지만, 안전장치로 한 번 더 막는다
          if (isButtonDisabled) return;
          navigation.navigate('RefundAcnt', { amt: Number(withdrawalAmt) });
        }}
      />
    </ScreenWrapper>
  );
};

// 설명 문구·전액 입력 버튼 정렬은 충전하기(ChargeAmtScreen)와 같은 값을 쓴다
const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 24 },
  // 설명 문구(왼쪽)와 전액 입력 버튼(오른쪽). 문구는 위에 붙고, 버튼은 자기 높이만 차지한다.
  descRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  // 아이콘과 문구를 위 정렬로 나란히 둔다. 남는 폭만 써서 문구가 길어지면 버튼을 밀지 않고 줄바꿈된다.
  desc: { flex: 1, flexDirection: 'row', gap: 4, alignItems: 'flex-start' },
  // 아이콘을 "글자 한 줄 높이"짜리 상자에 가운데로 넣어, 문구가 여러 줄이 되어도 첫 줄 가운데에 오게 한다. 1.5px 보정 이유는 충전하기 화면 주석 참고.
  descIcon: {
    height: typographyStyles.caption1.lineHeight,
    justifyContent: 'center',
    transform: [{ translateY: -1.5 }],
  },
  descText: { flexShrink: 1 },
});

export default RefundScreen;
export { RefundScreen };

import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';

import { IRmnAmt } from '@typ/paymentType';
import type { RootStackParamList } from '@typ/navigation';
import { filterOnlyNumber } from '@utils/input';
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

type ChargeAmtScreenProps = NativeStackScreenProps<RootStackParamList, 'ChargeAmt'>;

/** 충전 금액 단위(원). 서버의 create_charge 규칙(1,000원 단위)과 같아야 한다 */
const CHARGE_UNIT = 1000;

const ChargeAmtScreen: React.FC<ChargeAmtScreenProps> = ({ navigation }) => {
  // 입력한 충전 금액 상태관리
  const [chargeAmt, setChargeAmt] = useState<string>('');

  // 현재 잔액 조회
  const [rmnAmtData, setRmnAmtData] = useState<IRmnAmt>();

  useEffect(() => {
    loadUserAmt().then((data) => {
      console.log('회원 잔액 조회 결과:', data);

      if (data.resultCd === '0000') {
        setRmnAmtData(data);
      }
    });
  }, []);

  // 충전 금액 검증 함수
  const validateChargeAmount = (amount: string): { isValid: boolean; errorMessage?: string } => {
    const numAmount = Number(amount);

    // 값이 입력되지 않은 최초 상태
    if (!amount || amount.length === 0) {
      return { isValid: true };
    }

    // 최대 충전 금액 체크 (머니 잔액 포함 200만 원)
    const currentBalance = rmnAmtData ? Number(rmnAmtData.moneyAmt) : 0;
    const totalAmount = currentBalance + numAmount;
    if (totalAmount > 2000000) {
      return { isValid: false, errorMessage: '충전 한도를 초과했습니다. (최대 200만 원)' };
    }

    // 최소 금액·1,000원 단위 체크. 서버(create_charge)가 같은 규칙으로 거절하므로 여기서 미리 알려준다
    if (numAmount < CHARGE_UNIT) {
      return { isValid: false, errorMessage: '최소 충전 가능 금액은 1,000원입니다.' };
    }
    if (numAmount % CHARGE_UNIT !== 0) {
      return { isValid: false, errorMessage: '충전은 1,000원 단위로 입력해 주세요.' };
    }

    return { isValid: true };
  };

  // 다음 버튼 활성화 상태 계산 (chargeAmt가 비어 있거나 0인 경우 or 충전 가능한 값이 아닌 경우 버튼 비활성화)
  const validation = validateChargeAmount(chargeAmt);
  const isButtonDisabled = !validation.isValid || !chargeAmt || Number(chargeAmt) <= 0;

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.wrap, { flexGrow: 1 }]}
        keyboardShouldPersistTaps="handled">
        <Typography mode="heading3" color="gray900">
          충전 금액을 입력해주세요.
        </Typography>

        <View>
          <TextField
            id={'goodsAmt'}
            inputMode={'numeric'}
            label={'충전 금액'}
            value={chargeAmt}
            onChangeText={(text: string) => {
              // 입력값 필터링
              const filtered = filterOnlyNumber(text);
              setChargeAmt(filtered);
            }}
            placeholder={''}
          />
          {/* 왼쪽 문구는 입력칸의 설명(desc)이므로 입력칸 바로 아래 위에 붙인다. 버튼과 세로 가운데를 맞추지 않는다. */}
          <View style={styles.descRow}>
            {validation.isValid ? (
              <View style={styles.desc}>
                <View style={styles.descIcon}>
                  <Icon source={'information'} color={theme.colors.gray900} size={18} />
                </View>

                <Typography mode="caption1" color="gray600" style={styles.descText}>
                  충전 가능 한도 금액은 200만 원 입니다.
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
            <SecondaryButton
              label={'전액 입력'}
              // 잔액은 최대 200만 원을 넘을 수 없음 (200만 - 현재 내 머니 잔액). 1,000원 단위 아래는 버린다 (예: 1,854,900 → 1,854,000)
              onPress={() => {
                if (rmnAmtData) {
                  const maxChargeAmount = 2000000 - Number(rmnAmtData.moneyAmt);
                  const roundedDown = Math.floor(maxChargeAmount / CHARGE_UNIT) * CHARGE_UNIT;
                  setChargeAmt(Math.max(roundedDown, 0).toString());
                }
              }}
              size={'md'}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      <BottomAmtBtn
        add={(value: number) =>
          setChargeAmt((prev) => {
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
          navigation.navigate('TransferAcntCharge', { amount: chargeAmt });
        }}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingVertical: 24, paddingHorizontal: 16, gap: 16 },
  // 설명 문구(왼쪽)와 전액 입력 버튼(오른쪽). 문구는 위에 붙고, 버튼은 자기 높이만 차지한다.
  descRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  // 아이콘과 문구를 위 정렬로 나란히 둔다. 남는 폭만 써서 문구가 길어지면 버튼을 밀지 않고 줄바꿈된다.
  desc: { flex: 1, flexDirection: 'row', gap: 4, alignItems: 'flex-start' },
  // 아이콘을 "글자 한 줄 높이"짜리 상자에 가운데로 넣는다. 그래서 문구가 여러 줄이 되어도 아이콘은 항상 첫 줄의 가운데에 온다.
  // (alignItems: 'center' 는 문구 블록 전체의 가운데라서 줄바꿈되면 첫 줄에서 벗어난다)
  // 상자 기준으로는 정확히 가운데지만, 한글은 획이 위쪽에 몰려 있어 눈에는 글자가 아이콘보다 살짝 위에 있는 것처럼 보인다.
  // 글리프 잉크 박스의 중심은 서로 같게 측정되지만(0.04px 차이), 4배 확대로 비교하면 아이콘을 1.5px 올린 상태가 눈으로 가장 잘 맞아 그 값을 쓴다.
  // 출금하기(RefundScreen) 와 같은 값을 쓴다.
  descIcon: {
    height: typographyStyles.caption1.lineHeight,
    justifyContent: 'center',
    transform: [{ translateY: -1.5 }],
  },
  descText: { flexShrink: 1 },
});

export default ChargeAmtScreen;
export { ChargeAmtScreen };

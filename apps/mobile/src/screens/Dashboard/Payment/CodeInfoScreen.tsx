import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '@typ/navigation';
import { IRmnAmt } from '@typ/paymentType';
import { useDialog } from '@contexts/DialogContext';
import { loadUserAmt } from '@apis/commonApi';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  Typography,
} from '@components/common';
import { layout, theme } from '@styles';

type CodeInfoScreenProps = NativeStackScreenProps<RootStackParamList, 'CodeInfo'>;

const CodeInfoScreen: React.FC<CodeInfoScreenProps> = ({ navigation, route }) => {
  // 이전 화면에서 얻어온 결제 정보 파라미터
  const data = route.params.data;

  // Dialog
  const { alert } = useDialog();

  // 회원 잔액 불러오기
  const [rmnAmtData, setRmnAmtData] = useState<IRmnAmt>();
  const [visible, setVisible] = useState<boolean>(false);
  const [goodsAmt, _] = useState<number>(data.goodsAmt);

  useEffect(() => {
    const fetchUserBalance = async () => {
      loadUserAmt().then((data) => {
        console.log('회원 잔액 조회 결과:', data);

        if (data.resultCd === '0000') {
          setRmnAmtData(data);

          // 회원 잔액이 구매 금액보다 작은지 검사
          if (Number(data.sumPpRmnAmt) < goodsAmt) {
            setVisible(false);

            alert({
              title: '잔액 부족',
              message1: '잔액이 부족합니다.',
              message2: '결제하려는 상품 금액을 충전해 주세요.',
            }).then(() => navigation.pop(2));
          } else {
            setVisible(true);
          }
        }
      });
    };

    fetchUserBalance();
  }, []);

  // 결제 후 총잔액
  const sumPpRmnAmt = Number(rmnAmtData?.sumPpRmnAmt || 0);
  const remainTotal = sumPpRmnAmt - goodsAmt;

  if (!visible) return null;

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        {/* 결제 요약 */}
        <View style={styles.container}>
          <View style={{ gap: 8 }}>
            <Typography mode="subtitle1" color="gray600">
              {data.coNm}
            </Typography>
            <Typography mode="body2" color="gray600">
              {data.goodsNm}
            </Typography>
          </View>

          <Typography mode="subtitle1" color="gray900" style={{ alignSelf: 'flex-end' }}>
            {data.goodsAmt.toLocaleString('ko-KR')} 원
          </Typography>
        </View>

        <View style={styles.divider}></View>

        {/* 상세 정보 */}
        <View style={[styles.container, { gap: 32 }]}>
          {/* 결제 정보 */}
          <View style={{ gap: 16, paddingBottom: 16 }}>
            <Typography mode="subtitle1" color="gray900">
              결제정보
            </Typography>

            <View style={{ gap: 8 }}>
              <View style={layout.rowBetween}>
                <Typography mode="body2" color="gray900">
                  결제금액
                </Typography>

                <Typography mode="heading3" color="primary">
                  {data.goodsAmt.toLocaleString('ko-KR')}원
                </Typography>
              </View>

              <View style={layout.rowBetween}>
                <Typography mode="body2" color="gray900">
                  결제 후 잔액
                </Typography>

                <Typography mode="heading3" color="gray600">
                  {remainTotal.toLocaleString('ko-KR')}원
                </Typography>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <BottomBtnBox
        buttonKey={'payment'}
        disabled={false}
        label={'결제하기'}
        onPress={() => navigation.navigate('PinPayQR', { data: data })}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 24, gap: 12 },
  divider: { backgroundColor: theme.colors.gray100, height: 1, marginHorizontal: 16 },
});

export default CodeInfoScreen;
export { CodeInfoScreen };

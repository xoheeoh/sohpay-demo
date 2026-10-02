import { View } from 'react-native';
import { Typography } from '@components/common';

/** 데모용 약관 본문. 실제 서비스 약관은 법무 검토를 거친 문서로 교체한다. */
const Term2 = () => {
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 16 }}>
        <Typography mode="subtitle1" color="gray900">
          개인(신용)정보 수집 및 이용 동의
        </Typography>
        <Typography mode="body2" color="gray600">
          이 데모는 실제 개인정보를 수집하지 않습니다. 입력한 값은 데모 데이터베이스에만 저장되며 언제든 삭제할 수
          있습니다.
        </Typography>
      </View>

      <View style={{ gap: 16 }}>
        <Typography mode="subtitle1" color="gray900">
          제1조 (목적)
        </Typography>
        <Typography mode="body2" color="gray600">
          이 약관은 SohPay(이하 “서비스”)가 제공하는 데모 기능의 이용 조건과 절차를 정하는 것을 목적으로 합니다.
        </Typography>
      </View>

      <View style={{ gap: 16 }}>
        <Typography mode="subtitle1" color="gray900">
          제2조 (데모 서비스의 성격)
        </Typography>
        <Typography mode="body2" color="gray600">
          서비스의 충전·결제·출금은 모의 서버에서 처리되며 실제 자금 이동이 발생하지 않습니다. 화면에 표시되는 잔액과
          거래 내역은 데모 데이터입니다.
        </Typography>
      </View>

      <View style={{ gap: 16 }}>
        <Typography mode="subtitle1" color="gray900">
          제3조 (데이터의 보관과 삭제)
        </Typography>
        <Typography mode="body2" color="gray600">
          가입 시 입력한 정보는 데모 데이터베이스에만 저장되며, 회원 탈퇴 시 이용할 수 없는 상태로 전환됩니다. 데모
          데이터는 예고 없이 초기화될 수 있습니다.
        </Typography>
      </View>
    </View>
  );
};

export default Term2;
export { Term2 };

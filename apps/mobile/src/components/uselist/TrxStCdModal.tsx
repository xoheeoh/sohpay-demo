import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { PrimaryButton, Radio } from '@components/common';

interface TrxStCdModalProps {
  handleSelectedTrxStCd: () => void;
  onTrxStCdChange: (getCd: string, trxStCd: string, radio: string) => void; // getCd, 거래상태, radio value를 부모로 전달하는 콜백
  radioValue: string;
  getCd: string;
}

const TrxStCdModal: React.FC<TrxStCdModalProps> = ({ handleSelectedTrxStCd, onTrxStCdChange, radioValue, getCd }) => {
  /**
   * 라디오 버튼 선택 값에 따라 조회 trxStCd 설정
   */
  const [selectedTrxStCd, setSelectedTrxStCd] = useState<string>(radioValue); // 선택된 radio value값
  const [trxStCd, setTrxStCd] = useState<string>(''); // 조회 조건

  const trxStCdRadioButtons =
    getCd === 'USE'
      ? [
          { id: 'all', label: '모두', value: '9' },
          { id: 'confirm', label: '승인', value: '0' },
          { id: 'cancel', label: '취소', value: '1' },
        ]
      : getCd === 'CHRG' || getCd === 'RFND'
        ? [
            // 충전·출금은 성공 / 실패 (실패 = 모의 결제창 승인 거절·취소, 은행 오류 등)
            { id: 'all', label: '모두', value: '9' },
            { id: 'success', label: '성공', value: '1' },
            { id: 'fail', label: '실패', value: '2' },
          ]
        : [{ id: 'all', label: '모두', value: '9' }]; // 거래 종류가 "모두"일 때는 상태 구분 없음

  // 선택한 radio에 따른 조회 조건 설정
  useEffect(() => {
    const selectedOption = trxStCdRadioButtons.find((button) => button.id === selectedTrxStCd);
    if (selectedOption) {
      setTrxStCd(selectedOption.value); // 선택된 id의 value 값을 getCd에 설정
    }
  }, [selectedTrxStCd]);

  // 조회 옵션 모달 선택 버튼 활성화 상태 계산
  const isButtonDisabled = !(trxStCd !== '');

  // 조회 조건 선택 완료 후 해당 값 부모로 전달
  const handleSelectTrxStCdWithValues = () => {
    onTrxStCdChange(getCd, trxStCd, selectedTrxStCd);
    handleSelectedTrxStCd();
  };

  return (
    <>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Radio selectedId={selectedTrxStCd} setSelectedId={setSelectedTrxStCd} radioButtons={trxStCdRadioButtons} />
      </ScrollView>
      <View style={{ paddingVertical: 24 }}>
        <PrimaryButton
          key={isButtonDisabled.toString()}
          disabled={isButtonDisabled}
          label={'선택'}
          onPress={handleSelectTrxStCdWithValues}
          size={'lg'}
        />
      </View>
    </>
  );
};

export default TrxStCdModal;
export { TrxStCdModal };

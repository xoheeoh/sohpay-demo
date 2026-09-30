import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { PrimaryButton, Radio } from '@components/common';

interface TrxStCdModalProps {
  handleSelectedTrxStCd: () => void;
  onTrxStCdChange: (getCd: string, trxStCd: string, radio: string) => void;
  radioValue: string;
  getCd: string;
}

const TrxStCdModal: React.FC<TrxStCdModalProps> = ({ handleSelectedTrxStCd, onTrxStCdChange, radioValue, getCd }) => {
  const [selectedTrxStCd, setSelectedTrxStCd] = useState<string>(radioValue);
  const [trxStCd, setTrxStCd] = useState<string>('');

  const trxStCdRadioButtons =
    getCd === 'USE'
      ? [
          { id: 'all', label: '모두', value: '9' },
          { id: 'confirm', label: '승인', value: '0' },
          { id: 'cancel', label: '취소', value: '1' },
        ]
      : getCd === 'CHRG' || getCd === 'RFND'
        ? [
            // 충전·출금은 성공 / 실패
            { id: 'all', label: '모두', value: '9' },
            { id: 'success', label: '성공', value: '1' },
            { id: 'fail', label: '실패', value: '2' },
          ]
        : [{ id: 'all', label: '모두', value: '9' }]; // 거래 종류가 "모두"일 때는 상태 구분 없음

  // 라디오 선택값 → 조회 trxStCd
  useEffect(() => {
    const selectedOption = trxStCdRadioButtons.find((button) => button.id === selectedTrxStCd);
    if (selectedOption) {
      setTrxStCd(selectedOption.value);
    }
  }, [selectedTrxStCd]);

  const isButtonDisabled = !(trxStCd !== '');

  const handleSelectTrxStCdWithValues = () => {
    onTrxStCdChange(getCd, trxStCd, selectedTrxStCd);
    handleSelectedTrxStCd();
  };

  return (
    <>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Radio selectedId={selectedTrxStCd} setSelectedId={setSelectedTrxStCd} radioButtons={trxStCdRadioButtons} />
      </ScrollView>
      {/* 아래 여백은 BottomSheet 가 준다 */}
      <View style={{ paddingTop: 24 }}>
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

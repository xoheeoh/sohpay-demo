import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { PrimaryButton, Radio } from '@components/common';

interface GetCdModalProps {
  handleSelectedGetCd: () => void;
  onGetCdChange: (getCd: string, radio: string) => void;
  radioValue: string;
}

const GetCdModal: React.FC<GetCdModalProps> = ({ handleSelectedGetCd, onGetCdChange, radioValue }) => {
  const [selectedGetCd, setSelectedGetCd] = useState<string>(radioValue);
  const [getCd, setGetCd] = useState<string>('');

  // ALL: 결제·충전·출금 모두 | USE: 결제 | CHRG: 충전 | RFND: 출금
  const getCdRadioButtons = [
    { id: 'all', label: '모두', value: 'ALL' },
    { id: 'use', label: '결제', value: 'USE' },
    { id: 'charge', label: '충전', value: 'CHRG' },
    { id: 'refund', label: '출금', value: 'RFND' },
  ];

  // 라디오 선택값 → 조회 getCd
  useEffect(() => {
    const selectedOption = getCdRadioButtons.find((button) => button.id === selectedGetCd);
    if (selectedOption) {
      setGetCd(selectedOption.value);
    }
  }, [selectedGetCd]);

  const isButtonDisabled = !(getCd !== '');

  const handleSelectGetCdWithValues = () => {
    onGetCdChange(getCd, selectedGetCd);
    handleSelectedGetCd();
  };

  return (
    <>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Radio selectedId={selectedGetCd} setSelectedId={setSelectedGetCd} radioButtons={getCdRadioButtons} />
      </ScrollView>
      {/* 아래 여백은 BottomSheet 가 준다 */}
      <View style={{ paddingTop: 24 }}>
        <PrimaryButton
          key={isButtonDisabled.toString()}
          disabled={isButtonDisabled}
          label={'선택'}
          onPress={handleSelectGetCdWithValues}
          size={'lg'}
        />
      </View>
    </>
  );
};

export default GetCdModal;
export { GetCdModal };

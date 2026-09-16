import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { PrimaryButton, Radio } from '@components/common';

interface GetCdModalProps {
  handleSelectedGetCd: () => void;
  onGetCdChange: (getCd: string, radio: string) => void; // 거래종류, radio value를 부모로 전달하는 콜백
  radioValue: string;
}

const GetCdModal: React.FC<GetCdModalProps> = ({ handleSelectedGetCd, onGetCdChange, radioValue }) => {
  /**
   * 라디오 버튼 선택 값에 따라 조회 getCd 설정
   */
  const [selectedGetCd, setSelectedGetCd] = useState<string>(radioValue); // 선택된 radio value값
  const [getCd, setGetCd] = useState<string>(''); // 조회 조건

  const getCdRadioButtons = [
    { id: 'use', label: '결제', value: 'USE' },
    { id: 'charge', label: '충전', value: 'CHRG' },
  ];

  // 선택한 radio에 따른 조회 조건 설정
  useEffect(() => {
    const selectedOption = getCdRadioButtons.find((button) => button.id === selectedGetCd);
    if (selectedOption) {
      setGetCd(selectedOption.value); // 선택된 id의 value 값을 getCd에 설정
    }
  }, [selectedGetCd]);

  // 조회 옵션 모달 선택 버튼 활성화 상태 계산
  const isButtonDisabled = !(getCd !== '');

  // 조회 조건 선택 완료 후 해당 값 부모로 전달
  const handleSelectGetCdWithValues = () => {
    onGetCdChange(getCd, selectedGetCd);
    handleSelectedGetCd();
  };

  return (
    <>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Radio selectedId={selectedGetCd} setSelectedId={setSelectedGetCd} radioButtons={getCdRadioButtons} />
      </ScrollView>
      <View style={{ paddingVertical: 24 }}>
        <PrimaryButton
          key={isButtonDisabled.toString()}
          disabled={isButtonDisabled}
          label={'선택'}
          onPress={handleSelectGetCdWithValues}
          size={'large'}
        />
      </View>
    </>
  );
};

export default GetCdModal;
export { GetCdModal };

import { useEffect, useRef, useState } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';

import { CheckBox, Dropdown, Textarea, TextField, Typography } from '@components/common';

interface InquiryEnrollScreenProps {
  title: string;
  setTitle: (value: string) => void;
  content: string;
  setContent: (value: string) => void;
  mappedOption: string;
  setMappedOption: (value: string) => void;
  onButtonStateChange: (disabled: boolean) => void; // 부모로 상태 전달 콜백
  dropdownRef?: React.RefObject<any>; // 드롭다운 제어용 ref (스크롤 시 닫기 위함)
  parentScrollRef: React.RefObject<ScrollView>; // 키보드 오픈 시 부모 스크롤 제어
}

const InquiryEnrollScreen: React.FC<InquiryEnrollScreenProps> = ({
  title,
  setTitle,
  content,
  setContent,
  mappedOption,
  setMappedOption,
  onButtonStateChange,
  dropdownRef,
  parentScrollRef,
}) => {
  // 문의 카테고리
  const optionMapping: Record<string, string> = {
    결제: '01',
    충전: '02',
    출금: '03',
    계정: '04',
  };
  const [selectedOption, setSelectedOption] = useState<string>('항목을 선택하세요.'); // 선택된 항목(카테고리)

  // 카테고리 선택 처리
  const handleSelectOption = (option: string) => {
    setSelectedOption(option); // 표시용 옵션 업데이트
    setMappedOption(optionMapping[option]); // 검색용 value 업데이트
  };

  const [isChecked, setIsChecked] = useState<boolean>(false); // 체크박스 동의
  const textareaContainerRef = useRef<View | null>(null);

  // 버튼 활성화 상태 계산
  const isButtonDisabled = !(
    title.length > 0 &&
    selectedOption !== '항목을 선택하세요.' &&
    mappedOption !== '' &&
    content.length > 0 &&
    isChecked
  );

  // 버튼 활성화 상태 부모로 전달
  useEffect(() => {
    onButtonStateChange(isButtonDisabled);
  }, [isButtonDisabled, onButtonStateChange]);

  return (
    <View style={styles.wrap}>
      {/* 제목 입력 */}
      <TextField
        id={'title'}
        inputMode={'text'}
        label={'제목'}
        value={title}
        onChangeText={(text: string) => setTitle(text)}
        placeholder={''}
      />

      {/* 카테고리 선택 */}
      <Dropdown
        ref={dropdownRef}
        placeholder={selectedOption}
        options={Object.keys(optionMapping)} // 매핑 객체의 키를 옵션으로 사용
        onSelect={(option) => handleSelectOption(option)}
      />

      {/* 내용 입력 */}
      <View
        ref={(ref) => {
          textareaContainerRef.current = ref;
        }}>
        <Textarea
          value={content}
          setValue={setContent}
          onFocus={() => {
            dropdownRef?.current?.close?.();
          }}
        />
      </View>

      {/* 동의 체크박스 */}
      <CheckBox
        isChecked={isChecked}
        setIsChecked={() => setIsChecked(!isChecked)}
        labelComponent={
          <Typography mode="body2" color="gray900" style={{ flexShrink: 1 }}>
            개인정보 수집 및 이용에 동의합니다.
          </Typography>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, paddingTop: 24, paddingHorizontal: 16, gap: 24 },
});

export default InquiryEnrollScreen;

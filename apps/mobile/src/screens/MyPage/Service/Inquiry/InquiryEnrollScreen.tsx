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
  onButtonStateChange: (disabled: boolean) => void; // 부모의 하단 버튼 활성화 상태를 갱신한다
  dropdownRef?: React.RefObject<any>; // 스크롤이 시작되면 드롭다운을 닫기 위한 ref
  parentScrollRef: React.RefObject<ScrollView>; // 키보드가 열릴 때 부모 스크롤을 제어한다
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
  const [selectedOption, setSelectedOption] = useState<string>('항목을 선택하세요.');

  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
    setMappedOption(optionMapping[option]);
  };

  const [isChecked, setIsChecked] = useState<boolean>(false);
  const textareaContainerRef = useRef<View | null>(null);

  const isButtonDisabled = !(
    title.length > 0 &&
    selectedOption !== '항목을 선택하세요.' &&
    mappedOption !== '' &&
    content.length > 0 &&
    isChecked
  );

  // 하단 버튼은 부모 화면에 있어 활성화 상태를 올려 보낸다
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
        options={Object.keys(optionMapping)}
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
          height={200}
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

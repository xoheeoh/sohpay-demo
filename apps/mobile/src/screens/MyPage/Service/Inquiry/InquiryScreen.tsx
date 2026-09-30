import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@typ/navigation';
import { useDialog } from '@contexts/DialogContext';
import { enrollInquiry } from '@apis/commonApi';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  TabBar,
} from '@components/common';
import InquiryEnrollScreen from './InquiryEnrollScreen';
import InquiryListScreen from './InquiryListScreen';

type InquiryScreenProps = NativeStackScreenProps<RootStackParamList, 'Inquiry'>;

const InquiryScreen: React.FC<InquiryScreenProps> = () => {
  const [activeTab, setActiveTab] = useState<1 | 2>(1); // 1: 문의하기, 2: 문의내역

  const { alert, confirm } = useDialog();

  // 문의하기 탭 입력값
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [mappedOption, setMappedOption] = useState<string>(''); // 카테고리 코드

  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(true);
  const handleButtonStateChange = (disabled: boolean) => {
    setIsButtonDisabled(disabled);
  };

  // 등록 요청이 진행 중인 동안 버튼을 잠가 같은 문의가 두 번 등록되지 않게 한다
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 스크롤이 시작되면 각 탭의 드롭다운을 닫기 위한 ref
  const inquiryDropdownRef = useRef<any>(null);
  const inquiryListDropdownRef = useRef<any>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  /**
   * 등록 성공 후 입력값을 비우고 문의내역 탭으로 이동한다.
   * 카테고리 문구·동의 체크는 문의하기 탭 안의 상태라 탭이 바뀌면 함께 초기화되고, 문의내역 탭은 올라올 때 목록을 새로 불러온다.
   */
  const resetFormAndShowHistory = () => {
    setTitle('');
    setContent('');
    setMappedOption('');
    setIsButtonDisabled(true);
    setActiveTab(2);
  };

  const handleSubmitInquiry = async () => {
    if (isButtonDisabled || isSubmitting) return;
    setIsSubmitting(true);

    const data = await enrollInquiry(title, content, mappedOption);
    setIsSubmitting(false);

    if (data.resultCd === '0000') {
      console.log('문의 등록 성공');

      confirm({
        title: '1:1 상담 등록',
        message1: '1:1 상담 내용이 정상적으로 등록되었습니다.',
        message2: '문의내역에서 답변을 확인해주세요.',
        confirmText: '확인',
      }).then(() => {
        // 확인이든 바깥 터치든 등록된 내용이 폼에 남아 중복 등록되지 않도록 항상 비운다
        resetFormAndShowHistory();
      });
    } else {
      // 입력한 내용은 남겨 두어 다시 시도할 수 있게 한다
      alert({
        title: '문의 등록 실패',
        message1: data.resultMsg,
        message2: '잠시 후 다시 시도해 주세요.',
      });
    }
  };

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      {/* 메뉴 탭: 스크롤 밖에 두어 두 탭 모두에서 화면 위에 고정된다 */}
      <View style={styles.tabWrap}>
        <TabBar
          active={activeTab}
          label1={'문의하기'}
          label2={'문의내역'}
          onPress1={() => setActiveTab(1)}
          onPress2={() => setActiveTab(2)}
        />
      </View>

      {activeTab === 1 ? (
        <>
          {/* 문의하기: 키보드가 올라오면 입력칸이 따라 올라가도록 키보드 대응 스크롤을 쓴다 */}
          <KeyboardAwareScrollView
            ref={(ref) => {
              scrollRef.current = ref;
            }}
            style={{ flexGrow: 1 }}
            keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}
            extraBottomPadding={60}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => inquiryDropdownRef.current?.close?.()}>
            <InquiryEnrollScreen
              title={title}
              setTitle={setTitle}
              content={content}
              setContent={setContent}
              mappedOption={mappedOption}
              setMappedOption={setMappedOption}
              onButtonStateChange={handleButtonStateChange}
              dropdownRef={inquiryDropdownRef}
              parentScrollRef={scrollRef as React.RefObject<ScrollView>}
            />
          </KeyboardAwareScrollView>

          <BottomBtnBox
            buttonKey={(isButtonDisabled || isSubmitting).toString()}
            disabled={isButtonDisabled || isSubmitting}
            label={'문의하기'}
            onPress={handleSubmitInquiry}
          />
        </>
      ) : (
        /* 문의내역: 검색창·건수는 고정되고 목록만 InquiryListScreen 안에서 스크롤된다 */
        <InquiryListScreen dropdownRef={inquiryListDropdownRef} />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  tabWrap: { paddingTop: 24, paddingHorizontal: 16 },
});

export default InquiryScreen;
export { InquiryScreen };

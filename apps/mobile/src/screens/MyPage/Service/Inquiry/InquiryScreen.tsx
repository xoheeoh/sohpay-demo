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
  // 활성화 된 탭 상태관리
  const [activeTab, setActiveTab] = useState<1 | 2>(1); // 1: 문의하기, 2: 문의내역

  // Dialog
  const { alert, confirm } = useDialog();

  /**
   * 문의하기 화면: 문의 내용 입력 상태 확인 후, 버튼 활성화
   * 등록 성공하면 성공 모달
   */
  const [title, setTitle] = useState<string>(''); // 제목
  const [content, setContent] = useState<string>(''); // 내용
  const [mappedOption, setMappedOption] = useState<string>(''); // 실제 검색용 카테고리 value

  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(true);
  const handleButtonStateChange = (disabled: boolean) => {
    setIsButtonDisabled(disabled);
  };

  // 등록 요청이 진행 중인 동안 버튼을 잠가 같은 문의가 두 번 등록되지 않게 한다
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 문의하기/문의내역 탭 내 드롭다운 제어용 ref (스크롤 시 드롭다운 닫기 위함)
  const inquiryDropdownRef = useRef<any>(null);
  const inquiryListDropdownRef = useRef<any>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  /**
   * 등록 성공 후 처리: 문의하기 탭 입력값을 모두 비우고 문의내역 탭으로 이동
   * - 카테고리 표시 문구·동의 체크는 문의하기 탭 컴포넌트 안의 상태라, 탭이 바뀌어 컴포넌트가 내려가면 함께 초기화된다
   * - 문의내역 탭은 올라올 때 목록을 새로 불러오므로 방금 등록한 문의가 맨 위에 보인다
   */
  const resetFormAndShowHistory = () => {
    setTitle('');
    setContent('');
    setMappedOption('');
    setIsButtonDisabled(true);
    setActiveTab(2);
  };

  // 문의 등록하기
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
        // 확인 버튼이든 바깥 터치든, 이미 등록된 내용이 폼에 남아 중복 등록되지 않도록 항상 비운다
        resetFormAndShowHistory();
      });
    } else {
      // 실패 이유를 화면에 보여준다. 입력한 내용은 그대로 남겨 다시 시도할 수 있게 한다
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
          {/* 문의하기: 키보드가 올라오면 입력칸이 따라 올라가야 해서 키보드 대응 스크롤을 쓴다 */}
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
        /* 문의내역: 검색창·건수는 고정, 목록만 스크롤 (스크롤은 InquiryListScreen 안에 있다) */
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

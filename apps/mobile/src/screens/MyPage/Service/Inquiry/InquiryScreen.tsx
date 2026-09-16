import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { useDialog } from '@contexts/DialogContext';
import { enrollInquiry } from '@apis/commonApi';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  TabBar,
  Typography,
} from '@components/common';
import InquiryEnrollScreen from './InquiryEnrollScreen';
import InquiryListScreen from './InquiryListScreen';
import { theme } from '@styles';

type InquiryScreenProps = NativeStackScreenProps<RootStackParamList, 'Inquiry'>;

const InquiryScreen: React.FC<InquiryScreenProps> = ({ navigation }) => {
  // 상단 FAQ 바로가기 알림창 보이기 여부 상태관리
  const [alertShow, setAlertShow] = useState<boolean>(true);
  // 활성화 된 탭 상태관리
  const [activeTab, setActiveTab] = useState<1 | 2>(1); // 1: 문의하기, 2: 문의내역

  // Dialog
  const { confirm } = useDialog();

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

  // 문의하기/문의내역 탭 내 드롭다운 제어용 ref (스크롤 시 드롭다운 닫기 위함)
  const inquiryDropdownRef = useRef<any>(null);
  const inquiryListDropdownRef = useRef<any>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  // 문의 등록하기
  const handleSubmitInquiry = () => {
    if (!isButtonDisabled) {
      enrollInquiry(title, content, mappedOption).then((data) => {
        if (data.resultCd === '0000') {
          console.log('문의 등록 성공');

          confirm({
            title: '1:1 상담 등록',
            message1: '1:1 상담 내용이 정상적으로 등록되었습니다.',
            message2: '문의내역에서 답변을 확인해주세요.',
            confirmText: '확인',
          }).then((ok) => {
            if (ok) {
              navigation.goBack();
            }
          });
        } else {
          console.log('문의 등록 실패:', data.resultMsg);
        }
      });
    }
  };

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      {/* FAQ 바로가기 안내 메시지 */}
      {alertShow ? (
        <View style={styles.alertContainer}>
          <View style={styles.alertBox}>
            <Icon source={'information'} size={20} color={theme.colors.gray600} />

            <View style={{ gap: 8, flex: 1 }}>
              <Typography mode="caption1" color="gray600" style={{ textAlign: 'left' }}>
                문의 전, 다른 회원들이 자주 남기신 자주 묻는 질문을 통해 궁금하신 점에 대한 답변이 있는지 먼저
                확인해주세요.
              </Typography>

              <Pressable style={styles.textButton} onPress={() => navigation.navigate('FAQ')}>
                <Typography mode="caption1" color="gray900">
                  FAQ 바로가기 {'>'}
                </Typography>
              </Pressable>
            </View>

            <Pressable onPress={() => setAlertShow(false)}>
              <Icon source={'close'} size={20} color={theme.colors.gray900} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <KeyboardAwareScrollView
        ref={(ref) => {
          scrollRef.current = ref;
        }}
        style={{ flexGrow: 1 }}
        keyboardAccessoryHeight={activeTab === 1 ? BOTTOM_BTN_BOX_KEYBOARD_INSET : 0}
        extraBottomPadding={60}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => {
          inquiryDropdownRef.current?.close?.();
          inquiryListDropdownRef.current?.close?.();
        }}>
        <View style={styles.wrap}>
          {/* 메뉴 탭 */}
          <TabBar
            active={activeTab}
            label1={'문의하기'}
            label2={'문의내역'}
            onPress1={() => setActiveTab(1)}
            onPress2={() => setActiveTab(2)}
          />
        </View>

        {activeTab === 1 ? (
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
        ) : (
          <InquiryListScreen dropdownRef={inquiryListDropdownRef} />
        )}
      </KeyboardAwareScrollView>

      {activeTab === 1 && (
        <BottomBtnBox
          buttonKey={isButtonDisabled.toString()}
          disabled={isButtonDisabled}
          label={'문의'}
          onPress={handleSubmitInquiry}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingTop: 24, paddingHorizontal: 16, gap: 24 },
  alertContainer: { paddingHorizontal: 16, paddingTop: 24, backgroundColor: 'white' },
  alertBox: {
    borderRadius: 4,
    backgroundColor: theme.colors.gray50,
    borderWidth: 1,
    borderColor: theme.colors.gray150,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 8,
  },
  textButton: { height: 24, justifyContent: 'center', alignSelf: 'baseline' },
});

export default InquiryScreen;
export { InquiryScreen };

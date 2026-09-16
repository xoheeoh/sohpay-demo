import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import RenderHtml from 'react-native-render-html';
import Accordion from 'react-native-collapsible/Accordion';

import type { RootStackParamList } from '@typ/navigation';
import { IFAQList } from '@typ/commonType';
import { InquiryFAQ } from '@apis/commonApi';
import { Dropdown, ScreenWrapper, SearchBox, Typography } from '@components/common';
import { layout, theme } from '@styles';

type FAQScreenProps = NativeStackScreenProps<RootStackParamList, 'FAQ'>;

const FAQScreen: React.FC<FAQScreenProps> = () => {
  // FAQ 카테고리
  const optionMapping: Record<string, string> = {
    전체: '', // 전체는 빈 문자열로 처리 (임의 지정)
    'TOP 10': '00',
    '계약/변경': '01',
    결제: '02',
    지급: '03',
    기술: '04',
    모바일: '05',
    기타: '99',
  };

  // 상태 관리
  const [selectedOption, setSelectedOption] = useState<string>('전체'); // 표시용 카테고리
  const [mappedOption, setMappedOption] = useState<string>(''); // 실제 검색용 카테고리
  const [searchQuery, setSearchQuery] = useState<string>(''); // 검색어
  const [isLoading, setIsLoading] = useState<boolean>(true); // 로딩 상태
  const [viewNum, setViewNum] = useState<number>(0); // 조회 결과 개수
  const [FAQData, setFAQData] = useState<IFAQList[]>([]); // 조회된 데이터
  const [activeSections, setActiveSections] = useState<number[]>([]); // 아코디언 활성화 상태

  // 드롭다운 제어용 ref (스크롤 시 드롭다운 닫기 위함)
  const dropdownRef = useRef<any>(null);

  // RenderHtml에 넘기는 객체 props는 메모이제이션해서 불필요한 엔진 업데이트를 줄임
  const contentWidth = useMemo(() => Dimensions.get('window').width - 62, []);
  const renderHtmlBaseStyle = useMemo(() => ({ lineHeight: 21 }), []);
  const renderHtmlDefaultTextProps = useMemo(() => ({ lineBreakStrategyIOS: 'hangul-word' as const }), []);

  // 옵션 선택 처리
  const handleSelectOption = (option: string) => {
    // 카테고리 변경 시 기존 아코디언 열림 상태 초기화
    setActiveSections([]);
    setSelectedOption(option); // 표시용 옵션 업데이트
    const mappedValue = optionMapping[option];
    setMappedOption(mappedValue); // 검색용 카테고리 업데이트

    // 전체를 선택하면 검색어를 초기화하고 전체 조회 실행
    if (option === '전체') {
      setSearchQuery('');
      fetchFAQs();
    } else if (option !== '전체') {
      fetchFAQs('', mappedValue);
    }
  };

  // FAQ 초기 전체 조회
  const fetchFAQs = async (title?: string, ctgr?: string) => {
    setIsLoading(true);

    try {
      const data = await InquiryFAQ(title, ctgr);

      if (data.resultCd === '0000') {
        // listData가 null인 경우 빈 배열로 처리
        const listData = data.listData || [];

        // 새 목록이 들어올 때는 기존 열림 상태를 유지하지 않음
        setActiveSections([]);
        setFAQData(listData);
        setViewNum(listData.length);
      } else {
        console.log('FAQ 조회 실패:', data.resultMsg);
        setActiveSections([]);
        setFAQData([]); // 조회 실패 시 빈 배열로 초기화
        setViewNum(0);
      }
    } catch (error) {
      console.error('FAQ 조회 중 오류:', error);
      setActiveSections([]);
      setFAQData([]); // 에러 발생 시 빈 배열로 초기화
      setViewNum(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs(); // 검색어와 카테고리 값 없이 전체 조회
  }, []);

  // 검색 버튼 클릭 이벤트
  const handleSearch = () => {
    // 카테고리가 전체일 경우 동작하지 않음
    if (selectedOption !== '전체') {
      setActiveSections([]);
      fetchFAQs(searchQuery, mappedOption); // 검색어와 카테고리 값으로 조회
    }
  };

  // 질문 헤더 (보이는 부분)
  const renderHeader = (section: any, _: any, isActive: boolean) => (
    <View style={[layout.rowBetween, styles.header, { alignItems: 'stretch' }]}>
      <View style={layout.rowCenter}>
        <Typography mode="subtitle3" color="blue500" style={{ width: 20 }}>
          Q.
        </Typography>
        <Typography mode="body2" color="gray900" style={{ flexShrink: 1 }}>
          [{section.ctgrNm}] {section.title}
        </Typography>
      </View>

      <Icon source={isActive ? 'chevron-up' : 'chevron-down'} size={24} color={theme.colors.gray900} />
    </View>
  );

  // 답변 내용 (접혀있는 부분)
  const renderContent = (section: any) => {
    let readBody = section?.body ?? '';

    // 엔티티 치환
    readBody = readBody
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&#40;', '(')
      .replaceAll('&#41;', ')')
      .replaceAll('&#x27;', "'")
      .replaceAll('&#x3d;', '=');

    // 유효하지 않은 이미지 src(about:blank/빈값/없음)는 RenderHtml에서 에러를 유발하므로 제거
    readBody = readBody.replace(/<img\b[^>]*>/gi, (tag: string) => {
      const srcMatch = tag.match(/\bsrc\s*=\s*(["']?)([^"'\s>]+)\1/i);
      if (!srcMatch) return '';
      const src = srcMatch[2].trim();
      if (!src || /^about:(?:\/\/\/)?blank$/i.test(src)) return '';
      return tag;
    });

    return (
      <View style={styles.content}>
        <Typography mode="subtitle3" color="red500" style={{ width: 20 }}>
          A.
        </Typography>

        <Typography mode="body2" color="gray600" style={{ flexShrink: 1 }}>
          <RenderHtml
            contentWidth={contentWidth}
            source={{ html: readBody }}
            baseStyle={renderHtmlBaseStyle}
            defaultTextProps={renderHtmlDefaultTextProps}
          />
        </Typography>
      </View>
    );
  };

  // 클릭하면 활성화 질문 업데이트
  const updateSections = (sections: number[]) => {
    // 동일 참조/동일 값으로 들어오는 경우 첫 클릭이 씹히는 현상을 방지하기 위해 항상 새 배열로 갱신
    setActiveSections(Array.isArray(sections) ? [...sections] : []);
  };

  return (
    <ScreenWrapper backgroundColor="white" topComponent={false}>
      <ScrollView contentContainerStyle={styles.wrap} onScrollBeginDrag={() => dropdownRef.current?.close?.()}>
        {/* 검색 바 */}
        <View style={styles.search}>
          <View style={{ width: 110 }}>
            <Dropdown
              ref={dropdownRef}
              placeholder={selectedOption}
              options={Object.keys(optionMapping)} // 매핑 객체의 키를 옵션으로 사용
              onSelect={(option) => handleSelectOption(option)}
            />
          </View>
          <SearchBox
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onPress={handleSearch}
            disabled={selectedOption === '전체'}
          />
        </View>

        {/* 조회 결과 */}
        {!isLoading ? (
          <>
            <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 }}>
              <Typography mode="body2" color="gray900">
                전체{' '}
                <Typography mode="subtitle3" color="blue500">
                  ({viewNum}
                </Typography>
                건)
              </Typography>
            </View>

            {FAQData.length > 0 ? (
              <Accordion
                sectionContainerStyle={styles.qna}
                sections={FAQData}
                activeSections={activeSections}
                renderHeader={renderHeader}
                renderContent={renderContent}
                onChange={updateSections}
                underlayColor={theme.colors.gray100}
                touchableComponent={Pressable}
                expandMultiple={false}
              />
            ) : (
              <View style={{ padding: 16 }}>
                <Typography mode="body2" color="gray600">
                  등록된 내역이 없습니다.
                </Typography>
              </View>
            )}
          </>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator color={theme.colors.primary} size={'large'} />
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { flexGrow: 1 },
  search: {
    backgroundColor: theme.colors.gray50,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  qna: { paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.gray150 },
  header: { paddingVertical: 16 },
  content: { paddingBottom: 16, flexDirection: 'row' },
});

export default FAQScreen;
export { FAQScreen };

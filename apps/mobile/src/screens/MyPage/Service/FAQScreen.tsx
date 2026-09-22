import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import RenderHtml from 'react-native-render-html';
import Accordion from 'react-native-collapsible/Accordion';

import type { RootStackParamList } from '@typ/navigation';
import { IFAQList } from '@typ/commonType';
import { FAQ_CTGR_NM, InquiryFAQ } from '@apis/commonApi';
import { Badge, Dropdown, ScreenWrapper, SearchBox, Typography } from '@components/common';
import { useAppWidth } from '@utils/dimensions';
import { layout, theme } from '@styles';

type FAQScreenProps = NativeStackScreenProps<RootStackParamList, 'FAQ'>;

const ALL_CATEGORY_LABEL = '전체';

// 카테고리 선택 옵션: "표시 이름 → 검색용 코드". API 의 코드표(FAQ_CTGR_NM)에서 뒤집어 만들어 코드가 어긋나지 않게 한다.
const CATEGORY_CODE_BY_LABEL: Record<string, string> = {
  [ALL_CATEGORY_LABEL]: '', // 전체는 빈 문자열 = 카테고리 조건 없음
  ...Object.fromEntries(Object.entries(FAQ_CTGR_NM).map(([code, label]) => [label, code])),
};

// 화면 여백(16) + 카드 안 여백(18) + 답변 패널 여백(14) 를 양쪽으로 뺀 값 = 답변 HTML 이 실제로 차지하는 폭
const CONTENT_SIDE_INSET = (16 + 18 + 14) * 2;

/**
 * 답변 본문 전처리. 본문은 (전신 앱의) 관리자 HTML 편집기 출력물이라 HTML 로 그린다.
 *  - 편집기가 저장한 HTML 엔티티를 원래 문자로 되돌린다
 *  - src 가 비어 있거나 about:blank 인 <img> 는 RenderHtml 에서 에러를 내므로 제거한다
 */
const sanitizeAnswerHtml = (body: string | undefined): string => {
  let html = body ?? '';

  html = html
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&#40;', '(')
    .replaceAll('&#41;', ')')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#x3d;', '=');

  html = html.replace(/<img\b[^>]*>/gi, (tag: string) => {
    const srcMatch = tag.match(/\bsrc\s*=\s*(["']?)([^"'\s>]+)\1/i);
    if (!srcMatch) return '';
    const src = srcMatch[2].trim();
    if (!src || /^about:(?:\/\/\/)?blank$/i.test(src)) return '';
    return tag;
  });

  return html;
};

const FAQScreen: React.FC<FAQScreenProps> = () => {
  // 검색 조건
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState<string>(ALL_CATEGORY_LABEL);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 조회 결과
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [faqList, setFaqList] = useState<IFAQList[]>([]);
  const [activeSections, setActiveSections] = useState<number[]>([]); // 펼쳐진 질문

  // 드롭다운 제어용 ref (스크롤 시 드롭다운 닫기 위함)
  const dropdownRef = useRef<{ close: () => void } | null>(null);

  // FAQ 조회 (검색어·카테고리 없으면 전체)
  const fetchFAQs = async (title: string, categoryLabel: string) => {
    setIsLoading(true);
    setActiveSections([]); // 새 목록이 들어오면 열림 상태는 초기화

    try {
      const data = await InquiryFAQ(title.trim(), CATEGORY_CODE_BY_LABEL[categoryLabel]);
      if (data.resultCd === '0000') {
        setFaqList(data.listData || []);
      } else {
        console.log('FAQ 조회 실패:', data.resultMsg);
        setFaqList([]);
      }
    } catch (error) {
      console.error('FAQ 조회 중 오류:', error);
      setFaqList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs('', ALL_CATEGORY_LABEL);
  }, []);

  // 카테고리를 고르면 현재 검색어를 유지한 채 바로 다시 조회
  const handleSelectCategory = (label: string) => {
    setSelectedCategoryLabel(label);
    fetchFAQs(searchQuery, label);
  };

  // 검색 (엔터)
  const handleSearch = () => fetchFAQs(searchQuery, selectedCategoryLabel);

  // 답변 HTML 렌더링 설정 (웹에서는 앱 프레임 폭 700px 기준)
  const appWidth = useAppWidth();
  const contentWidth = appWidth - CONTENT_SIDE_INSET;
  const renderHtmlBaseStyle = useMemo(
    () => ({ fontFamily: 'Pretendard-Regular', fontSize: 14, lineHeight: 21, color: theme.colors.gray700 }),
    [],
  );
  const renderHtmlDefaultTextProps = useMemo(() => ({ lineBreakStrategyIOS: 'hangul-word' as const }), []);

  // 질문 (항상 보이는 부분)
  const renderHeader = (section: IFAQList, index: number, isActive: boolean) => (
    <View style={[styles.itemHeader, index > 0 && styles.itemDivider]}>
      <View style={styles.itemTitleBox}>
        <Badge label={section.ctgrNm} tone="blue" />
        <Typography mode="subtitle2" color={isActive ? 'primary' : 'gray900'}>
          {section.title}
        </Typography>
      </View>

      <Icon source={isActive ? 'chevron-up' : 'chevron-down'} size={22} color={theme.colors.gray400} />
    </View>
  );

  // 답변 (펼쳤을 때 보이는 부분)
  const renderContent = (section: IFAQList) => (
    <View style={styles.itemBody}>
      <View style={styles.answerPanel}>
        <Typography mode="subtitle3" color="primary">
          A.
        </Typography>
        <View style={{ flex: 1 }}>
          <RenderHtml
            contentWidth={contentWidth - 28} // "A." 표시 폭(16) + 간격(12)
            source={{ html: sanitizeAnswerHtml(section.body) }}
            baseStyle={renderHtmlBaseStyle}
            defaultTextProps={renderHtmlDefaultTextProps}
          />
        </View>
      </View>
    </View>
  );

  return (
    <ScreenWrapper backgroundColor={theme.colors.bg} topComponent={false}>
      <ScrollView
        contentContainerStyle={styles.wrap}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => dropdownRef.current?.close()}>
        {/* 검색 조건 */}
        <View style={styles.searchCard}>
          <View style={{ width: 104 }}>
            <Dropdown
              ref={dropdownRef}
              placeholder={selectedCategoryLabel}
              options={Object.keys(CATEGORY_CODE_BY_LABEL)}
              onSelect={handleSelectCategory}
            />
          </View>
          <SearchBox
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onPress={handleSearch}
            disabled={false}
          />
        </View>

        {/* 결과 */}
        {isLoading ? (
          <View style={styles.emptyBox}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : (
          <View style={styles.section}>
            <View style={[layout.rowCenter, styles.sectionTitle, { gap: 4 }]}>
              <Typography mode="subtitle3" color="gray500">
                전체
              </Typography>
              <Typography mode="subtitle3" color="primary">
                {faqList.length}
              </Typography>
              <Typography mode="subtitle3" color="gray500">
                건
              </Typography>
            </View>

            {faqList.length > 0 ? (
              <View style={styles.card}>
                <Accordion
                  sections={faqList}
                  activeSections={activeSections}
                  renderHeader={renderHeader}
                  renderContent={renderContent}
                  // 같은 값이 다시 들어와도 새 배열로 갱신해 첫 클릭이 씹히는 현상을 막는다
                  onChange={(sections) => setActiveSections(Array.isArray(sections) ? [...sections] : [])}
                  touchableComponent={Pressable}
                  expandMultiple={false} // 하나의 질문만 열리도록
                />
              </View>
            ) : (
              <View style={[styles.card, styles.emptyBox]}>
                <View style={styles.emptyIcon}>
                  <Icon source="message-question-outline" size={22} color={theme.colors.primary} />
                </View>
                <Typography mode="body2" color="gray500">
                  조건에 맞는 질문이 없습니다.
                </Typography>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  // 공지사항(NoticeScreen)·고객센터와 같은 화면 여백
  wrap: { paddingHorizontal: 16, paddingVertical: 24, gap: 24, flexGrow: 1 },
  section: { gap: 8 },
  sectionTitle: { paddingHorizontal: 4 },

  // 검색 조건 카드 (회색 배경 위 흰 카드 → 그 안의 회색 입력칸이 보이게)
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
  },

  // 질문 목록 카드
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  itemDivider: { borderTopWidth: 1, borderTopColor: theme.colors.gray100 },
  itemTitleBox: { flex: 1, gap: 6 },
  itemBody: { paddingHorizontal: 18, paddingBottom: 18 },
  answerPanel: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  // 비어 있음 / 불러오는 중
  emptyBox: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 48 },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FAQScreen;
export { FAQScreen };

import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import RenderHtml from 'react-native-render-html';
import Accordion from 'react-native-collapsible/Accordion';

import { IMyInquiryList } from '@typ/commonType';
import { loadMyInquiry } from '@apis/commonApi';
import { Badge, Dropdown, SearchBox, SkeletonList, Typography } from '@components/common';
import { layout, theme } from '@styles';
import { getAppWidth } from '@utils/dimensions';
import { formatYYYYMMDDDate } from '@utils/formatter';

interface InquiryListScreenProps {
  dropdownRef?: React.RefObject<any>; // 스크롤이 시작되면 드롭다운을 닫기 위한 ref
}

/** 문의 상태값 (loadMyInquiry 가 answer 유무로 만들어 준다): '0' 접수(답변중) | '1' 답변완료 */
const INQUIRY_ANSWERED = '1';

const InquiryListScreen: React.FC<InquiryListScreenProps> = ({ dropdownRef }) => {
  // 문의 카테고리
  const optionMapping: Record<string, string> = {
    전체: '', // 빈 문자열 = 카테고리 조건 없음
    결제: '01',
    충전: '02',
    출금: '03',
    계정: '04',
  };
  // 코드 → 이름. 목록 배지에 표시하기 위해 뒤집은 표
  const categoryName: Record<string, string> = Object.fromEntries(
    Object.entries(optionMapping).map(([name, code]) => [code, name]),
  );

  const [selectedOption, setSelectedOption] = useState<string>('전체'); // 표시용 카테고리
  const [mappedOption, setMappedOption] = useState<string>(''); // 검색용 카테고리 코드
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewNum, setViewNum] = useState<number>(0);
  const [qnaData, setQnaData] = useState<IMyInquiryList[]>([]);
  const [activeSections, setActiveSections] = useState<number[]>([]); // 펼쳐진 문의

  // RenderHtml 에 넘기는 객체 props 는 메모이제이션해 불필요한 엔진 업데이트를 줄인다
  const contentWidth = useMemo(() => getAppWidth() - 62, []);
  const renderHtmlBaseStyle = useMemo(() => ({ lineHeight: 21, color: theme.colors.gray600 }), []);
  const renderHtmlDefaultTextProps = useMemo(() => ({ lineBreakStrategyIOS: 'hangul-word' as const }), []);

  const handleSelectOption = (option: string) => {
    setActiveSections([]);
    setSelectedOption(option);
    const mappedValue = optionMapping[option];
    setMappedOption(mappedValue);

    // 카테고리를 바꾸면 검색어 없이 바로 조회한다. 전체는 카테고리 조건도 보내지 않는다
    if (option === '전체') {
      setSearchQuery('');
      fetchQnAs(undefined, undefined);
    } else {
      setSearchQuery('');
      fetchQnAs(undefined, mappedValue);
    }
  };

  // 문의 내역 조회. 검색어·카테고리가 없으면 전체
  const fetchQnAs = async (title?: string, ctgr?: string) => {
    setIsLoading(true);

    try {
      const data = await loadMyInquiry(title, ctgr);

      if (data.resultCd === '0000') {
        const listData = data.listData || [];

        // 새 목록에서는 열림 상태를 초기화한다
        setActiveSections([]);
        setQnaData(listData);
        setViewNum(listData.length);
      } else {
        console.log('QnA 조회 실패:', data.resultMsg);
        setActiveSections([]);
        setQnaData([]);
        setViewNum(0);
      }
    } catch (error) {
      console.error('QnA 조회 중 오류:', error);
      setActiveSections([]);
      setQnaData([]);
      setViewNum(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQnAs();
  }, []);

  const handleSearch = () => {
    // 전체 카테고리에서는 검색을 지원하지 않는다
    if (selectedOption !== '전체') {
      setActiveSections([]);
      fetchQnAs(searchQuery, mappedOption);
    }
  };

  // 'YYYYMMDD' → 'YYYY/MM/DD'. formatYYYYMMDDDate 는 8자리 미만이면 예외를 던지므로 비어 있으면 빈 문자열을 돌려준다
  const formatDate = (ymd?: string) => (ymd && ymd.length >= 8 ? formatYYYYMMDDDate(ymd) : '');

  // 헤더(항상 보이는 부분): 상태·카테고리 배지, 문의일, 제목, 펼침 화살표
  const renderHeader = (section: IMyInquiryList, index: number, isActive: boolean) => {
    const answered = section.qnaStType === INQUIRY_ANSWERED;

    return (
      <View style={[styles.itemHeader, index > 0 && styles.itemDivider]}>
        {/* 첫 줄: 답변 상태 배지 / 문의일 */}
        <View style={[layout.rowBetween, { gap: 8 }]}>
          <Badge label={answered ? '답변완료' : '답변중'} tone={answered ? 'blue' : 'yellow'} />
          <Typography mode="caption1" color="gray400">
            {formatDate(section.regDt)}
          </Typography>
        </View>

        {/* 둘째 줄: [카테고리] 제목 / 펼침 화살표 */}
        <View style={[layout.rowBetween, { gap: 12 }]}>
          <Typography mode="subtitle2" color={isActive ? 'primary' : 'gray900'} style={{ flex: 1 }}>
            <Typography mode="subtitle2" color={isActive ? 'blue400' : 'gray500'}>
              [{categoryName[section.ctgr] ?? '기타'}]{' '}
            </Typography>
            {section.head}
          </Typography>

          <Icon source={isActive ? 'chevron-up' : 'chevron-down'} size={22} color={theme.colors.gray400} />
        </View>
      </View>
    );
  };

  // 펼쳤을 때 보이는 부분: 문의 내용과, 답변완료면 답변 패널·답변중이면 안내 패널
  const renderContent = (section: IMyInquiryList) => {
    const answered = section.qnaStType === INQUIRY_ANSWERED && !!section.answerList;

    // answerList 는 배열이 아니라 답변 한 건이다. 서버가 이스케이프한 특수문자를 되돌린 뒤 HTML 로 그린다
    const answerHtml = section.answerList?.body
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&#40;', '(')
      .replaceAll('&#41;', ')')
      .replaceAll('&#x27;', "'")
      .replaceAll('&#x3d;', '=');

    return (
      <View style={styles.itemBody}>
        {/* 문의 내용은 편집기를 쓰지 않아 줄바꿈만 처리한다 */}
        <View style={[layout.rowCenter, styles.questionPanel]}>
          <Typography mode="subtitle3" color="primary" style={styles.qaMark}>
            Q.
          </Typography>
          <Typography mode="body2" color="gray700" style={{ flex: 1 }}>
            {section.body.replace(/\\n/g, '\n')}
          </Typography>
        </View>

        {answered ? (
          <View style={styles.answerPanel}>
            <View style={[layout.rowBetween, { gap: 8 }]}>
              <View style={[layout.rowCenter, { gap: 6 }]}>
                <Typography mode="subtitle3" color="primary" style={styles.qaMark}>
                  A.
                </Typography>
                <Typography mode="subtitle3" color="gray900">
                  고객센터 답변
                </Typography>
              </View>
              <Typography mode="caption1" color="gray400">
                {formatDate(section.answerList?.regDt)}
              </Typography>
            </View>

            <RenderHtml
              contentWidth={contentWidth}
              source={{ html: answerHtml ?? '' }}
              baseStyle={renderHtmlBaseStyle}
              defaultTextProps={renderHtmlDefaultTextProps}
            />
          </View>
        ) : (
          <View style={[layout.rowCenter, styles.pendingPanel]}>
            <Icon source="clock-outline" size={16} color={theme.colors.yellow700} />
            <Typography mode="caption1" color="gray600" style={{ flex: 1 }}>
              답변을 준비하고 있어요. 답변이 등록되면 이곳에 표시됩니다.
            </Typography>
          </View>
        )}
      </View>
    );
  };

  const updateSections = (sections: number[]) => {
    // 같은 값이 다시 들어와도 새 배열로 갱신해 첫 클릭이 무시되는 현상을 막는다
    setActiveSections(Array.isArray(sections) ? [...sections] : []);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* 고정 영역: 검색 바 + 건수. 드롭다운 목록이 아래 스크롤 영역 위에 그려지도록 zIndex 를 준다 */}
      <View style={styles.fixedTop}>
        <View style={styles.search}>
          <View style={{ width: 100 }}>
            <Dropdown
              ref={dropdownRef}
              placeholder={selectedOption}
              options={Object.keys(optionMapping)}
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

        {/* 조회 결과 건수 */}
        {!isLoading && (
          <Typography mode="body2" color="gray900">
            전체{' '}
            <Typography mode="subtitle3" color="blue500">
              ({viewNum}건)
            </Typography>
          </Typography>
        )}
      </View>

      {/* 스크롤 영역: 문의·답변 목록만 스크롤된다 */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => dropdownRef?.current?.close?.()}>
        {/* 조회가 끝나기 전에는 목록 자리에 자리표시자를 보여준다 */}
        {isLoading && (
          <View style={styles.list}>
            <SkeletonList rows={5} />
          </View>
        )}

        {/* 결과 없음 */}
        {!isLoading && qnaData.length === 0 && (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Icon source="message-text-outline" size={20} color={theme.colors.primary} />
            </View>
            <Typography mode="body2" color="gray500">
              등록된 문의가 없습니다.
            </Typography>
          </View>
        )}

        <Accordion
          sectionContainerStyle={styles.list}
          sections={isLoading ? [] : qnaData}
          activeSections={activeSections}
          renderHeader={renderHeader}
          renderContent={renderContent}
          onChange={updateSections}
          touchableComponent={Pressable}
          expandMultiple={false} // 하나의 문의만 열리도록
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // 탭 바 아래에 들어가는 내용물이라 헤더 간격 토큰이 아닌 탭과의 간격(24)을 쓴다. 문의하기 탭(InquiryEnrollScreen)과 같은 값
  fixedTop: { paddingTop: 24, paddingHorizontal: 16, paddingBottom: 16, gap: 24, zIndex: 1 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  listContent: { paddingBottom: theme.screen.bottom },

  // 문의 한 건
  list: { paddingHorizontal: 16 },
  itemHeader: { gap: 8, paddingVertical: 16 },
  itemDivider: { borderTopWidth: 1, borderTopColor: theme.colors.gray100 },
  itemBody: { gap: 8, paddingBottom: 18 },
  qaMark: { width: 20 },
  questionPanel: { alignItems: 'flex-start', gap: 4, paddingHorizontal: 4 },
  answerPanel: {
    gap: 8,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pendingPanel: {
    gap: 8,
    backgroundColor: theme.colors.yellow50,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  // 비어 있음
  emptyBox: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 40 },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default InquiryListScreen;

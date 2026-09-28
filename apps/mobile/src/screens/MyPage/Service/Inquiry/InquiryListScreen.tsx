import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import RenderHtml from 'react-native-render-html';
import Accordion from 'react-native-collapsible/Accordion';

import { IMyInquiryList } from '@typ/commonType';
import { loadMyInquiry } from '@apis/commonApi';
import { Badge, Dropdown, SearchBox, Typography } from '@components/common';
import { layout, theme } from '@styles';
import { getAppWidth } from '@utils/dimensions';
import { formatYYYYMMDDDate } from '@utils/formatter';

interface InquiryListScreenProps {
  dropdownRef?: React.RefObject<any>; // 드롭다운 제어용 ref (스크롤 시 닫기 위함)
}

/** 문의 상태값 (loadMyInquiry 가 answer 유무로 만들어 준다): '0' 접수(답변중) | '1' 답변완료 */
const INQUIRY_ANSWERED = '1';

const InquiryListScreen: React.FC<InquiryListScreenProps> = ({ dropdownRef }) => {
  // 문의 카테고리
  const optionMapping: Record<string, string> = {
    전체: '', // 전체는 빈 문자열로 처리 (임의 지정)
    결제: '01',
    충전: '02',
    출금: '03',
    계정: '04',
  };
  // 코드 → 이름 (목록 배지에 "결제" 처럼 표시하기 위해 거꾸로 만든 표)
  const categoryName: Record<string, string> = Object.fromEntries(
    Object.entries(optionMapping).map(([name, code]) => [code, name]),
  );

  // 상태 관리
  const [selectedOption, setSelectedOption] = useState<string>('전체'); // 표시용 카테고리
  const [mappedOption, setMappedOption] = useState<string>(''); // 실제 검색용 카테고리
  const [searchQuery, setSearchQuery] = useState<string>(''); // 검색어
  const [isLoading, setIsLoading] = useState<boolean>(true); // 로딩 상태
  const [viewNum, setViewNum] = useState<number>(0); // 조회 결과 개수
  const [qnaData, setQnaData] = useState<IMyInquiryList[]>([]); // 조회된 데이터
  const [activeSections, setActiveSections] = useState<number[]>([]); // 아코디언 활성화 상태

  // RenderHtml에 넘기는 객체 props는 메모이제이션해서 불필요한 엔진 업데이트를 줄임
  const contentWidth = useMemo(() => getAppWidth() - 62, []);
  const renderHtmlBaseStyle = useMemo(() => ({ lineHeight: 21, color: theme.colors.gray600 }), []);
  const renderHtmlDefaultTextProps = useMemo(() => ({ lineBreakStrategyIOS: 'hangul-word' as const }), []);

  // 옵션 선택 처리
  const handleSelectOption = (option: string) => {
    // 카테고리 변경 시 기존 아코디언 열림 상태 초기화
    setActiveSections([]);
    setSelectedOption(option); // 표시용 옵션 업데이트
    const mappedValue = optionMapping[option];
    setMappedOption(mappedValue); // 검색용 value 업데이트

    // 카테고리 변경 시 즉시 해당 카테고리로 조회 (검색어 없이: head 미전송)
    // 전체 검색의 경우에는 ctgr 값도 미전송
    if (option === '전체') {
      setSearchQuery('');
      fetchQnAs(undefined, undefined);
    } else {
      setSearchQuery('');
      fetchQnAs(undefined, mappedValue);
    }
  };

  // QnA 초기 전체 조회
  const fetchQnAs = async (title?: string, ctgr?: string) => {
    setIsLoading(true);

    try {
      const data = await loadMyInquiry(title, ctgr);

      if (data.resultCd === '0000') {
        // listData가 null인 경우 빈 배열로 처리
        const listData = data.listData || [];

        // 새 목록이 들어올 때는 기존 열림 상태를 유지하지 않음
        setActiveSections([]);
        setQnaData(listData);
        setViewNum(listData.length);
      } else {
        console.log('QnA 조회 실패:', data.resultMsg);
        setActiveSections([]);
        setQnaData([]); // 조회 실패 시 빈 배열로 초기화
        setViewNum(0);
      }
    } catch (error) {
      console.error('QnA 조회 중 오류:', error);
      setActiveSections([]);
      setQnaData([]); // 에러 발생 시 빈 배열로 초기화
      setViewNum(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQnAs(); // 검색어와 카테고리 값 없이 전체 조회
  }, []);

  // 검색 버튼 클릭 이벤트
  const handleSearch = () => {
    // 카테고리가 전체일 경우 동작하지 않음
    if (selectedOption !== '전체') {
      setActiveSections([]);
      fetchQnAs(searchQuery, mappedOption); // 검색어와 카테고리 값으로 조회
    }
  };

  // 'YYYYMMDD' → 'YYYY/MM/DD'. 값이 비어 있으면 빈 문자열 (formatYYYYMMDDDate 는 8자리 미만이면 예외를 던진다)
  const formatDate = (ymd?: string) => (ymd && ymd.length >= 8 ? formatYYYYMMDDDate(ymd) : '');

  // 질문 헤더 (항상 보이는 부분): 상태·카테고리 배지 + 문의일, 제목, 펼침 화살표
  const renderHeader = (section: IMyInquiryList, index: number, isActive: boolean) => {
    const answered = section.qnaStType === INQUIRY_ANSWERED;

    return (
      <View style={[styles.itemHeader, index > 0 && styles.itemDivider]}>
        {/* 첫 줄: 답변 상태 배지(왼쪽) / 문의일(오른쪽 끝, 화살표 위까지 차지) */}
        <View style={[layout.rowBetween, { gap: 8 }]}>
          <Badge label={answered ? '답변완료' : '답변중'} tone={answered ? 'blue' : 'yellow'} />
          <Typography mode="caption1" color="gray400">
            {formatDate(section.regDt)}
          </Typography>
        </View>

        {/* 둘째 줄: [카테고리] 제목 / 펼침 화살표. 대괄호 부분은 제목보다 한 단계 연하게 */}
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

  // 펼쳤을 때 보이는 부분: 문의 내용 + (답변완료면) 답변 패널 / (답변중이면) 안내 패널
  const renderContent = (section: IMyInquiryList) => {
    const answered = section.qnaStType === INQUIRY_ANSWERED && !!section.answerList;

    // answerList 는 배열이 아니라 답변 한 건(객체)이다. 서버가 이스케이프한 특수문자를 되돌린 뒤 HTML 로 그린다
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
        {/* 문의 내용: 에디터를 사용하지 않기 때문에 단순 줄바꿈만 처리 */}
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

  // 클릭하면 활성화 질문 업데이트
  const updateSections = (sections: number[]) => {
    // 동일 참조/동일 값으로 들어오는 경우 첫 클릭이 씹히는 현상을 방지하기 위해 항상 새 배열로 갱신
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
              ({viewNum}
            </Typography>
            건)
          </Typography>
        )}
      </View>

      {/* 스크롤 영역: 문의·답변 목록만 스크롤된다 */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => dropdownRef?.current?.close?.()}>
        {/* 결과가 없는 경우 메시지 표시 */}
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
          sections={qnaData}
          activeSections={activeSections}
          renderHeader={renderHeader}
          renderContent={renderContent}
          onChange={updateSections}
          touchableComponent={Pressable}
          expandMultiple={false} // 하나의 섹션만 열리도록 설정
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fixedTop: { paddingTop: 24, paddingHorizontal: 16, paddingBottom: 16, gap: 24, zIndex: 1 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  listContent: { paddingBottom: 24 },

  // 문의 한 건 (FAQ 화면의 목록과 같은 모양)
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

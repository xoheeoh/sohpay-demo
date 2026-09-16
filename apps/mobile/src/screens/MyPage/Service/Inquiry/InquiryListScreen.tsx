import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Divider, Icon } from 'react-native-paper';
import RenderHtml from 'react-native-render-html';
import Accordion from 'react-native-collapsible/Accordion';

import { IMyInquiryList } from '@typ/commonType';
import { loadMyInquiry } from '@apis/commonApi';
import { Dropdown, SearchBox, Typography } from '@components/common';
import { layout, theme } from '@styles';
import { getAppWidth } from '@utils/dimensions';

interface InquiryListScreenProps {
  dropdownRef?: React.RefObject<any>; // 드롭다운 제어용 ref (스크롤 시 닫기 위함)
}

const InquiryListScreen: React.FC<InquiryListScreenProps> = ({ dropdownRef }) => {
  // 문의 카테고리
  const optionMapping: Record<string, string> = {
    전체: '', // 전체는 빈 문자열로 처리 (임의 지정)
    결제: '01',
    충전: '02',
    출금: '03',
    계정: '04',
  };

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

  // 질문 헤더 (보이는 부분)
  const renderHeader = (section: any, _: any, isActive: boolean) => (
    <View style={{ paddingVertical: 16 }}>
      <Typography mode="caption1" color={section.qnaStType === '03' ? 'blue500' : 'gray800'}>
        {section.qnaStType === '03' ? '답변완료' : '답변중'}
      </Typography>

      <View style={[layout.rowBetween, { paddingTop: 8, alignItems: 'stretch' }]}>
        <View style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'stretch' }}>
          <Typography mode="subtitle3" color="blue500" style={{ width: 20 }}>
            Q.
          </Typography>
          <Typography mode="body2" color="gray900" style={{ flexShrink: 1 }}>
            {section.head}
          </Typography>
        </View>

        <Icon source={isActive ? 'chevron-up' : 'chevron-down'} size={24} color={theme.colors.gray900} />
      </View>
    </View>
  );

  // 답변 내용 (접혀있는 부분)
  const renderContent = (section: any) => {
    const parsed =
      section.answerList &&
      section.answerList[0].body
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&#40;', '(')
        .replaceAll('&#41;', ')')
        .replaceAll('&#x27;', "'")
        .replaceAll('&#x3d;', '=');

    return (
      <View style={styles.content}>
        <Typography mode="body2" color="gray600" style={{ flexShrink: 1 }}>
          {/* 에디터를 사용하지 않기 때문에 단순 줄바꿈만 처리 */}
          {section.body.replace(/\\n/g, '\n')}
        </Typography>

        {section.qnaStType === '03' && (
          <>
            <Divider style={{ backgroundColor: theme.colors.gray200 }} />

            <View style={{ gap: 8 }}>
              <Typography mode="subtitle3" color="red500" style={{ width: 20 }}>
                A.
              </Typography>

              <Typography mode="body2" color="gray600" style={{ flexShrink: 1 }}>
                <RenderHtml
                  contentWidth={contentWidth}
                  source={{ html: parsed }}
                  baseStyle={renderHtmlBaseStyle}
                  defaultTextProps={renderHtmlDefaultTextProps}
                />
              </Typography>
            </View>
          </>
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
    <View style={{ gap: 24 }}>
      <View style={styles.wrap}>
        {/* 검색 바 */}
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
      </View>

      {/* 조회 결과 */}
      {!isLoading && (
        <View style={{ paddingHorizontal: 16 }}>
          <Typography mode="body2" color="gray900">
            전체{' '}
            <Typography mode="subtitle3" color="blue500">
              ({viewNum}
            </Typography>
            건)
          </Typography>
        </View>
      )}

      {/* 결과가 없는 경우 메시지 표시 */}
      {!isLoading && qnaData.length === 0 && (
        <View style={{ paddingHorizontal: 16 }}>
          <Typography mode="body2" color="gray600">
            등록된 내역이 없습니다.
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
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingTop: 24, paddingHorizontal: 16, gap: 24 },
  content: { gap: 16, paddingBottom: 16 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  list: { paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.gray150 },
});

export default InquiryListScreen;

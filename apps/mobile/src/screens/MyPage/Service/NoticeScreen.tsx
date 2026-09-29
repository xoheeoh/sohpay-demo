import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import Accordion from 'react-native-collapsible/Accordion';
import RenderHtml from 'react-native-render-html';

import type { RootStackParamList } from '@typ/navigation';
import { INoticeList } from '@typ/commonType';
import { InquiryNotice } from '@apis/commonApi';
import { Badge, ScreenWrapper, SkeletonList, Typography } from '@components/common';
import { formatYYYYMMDDDate, getTodayDate } from '@utils/formatter';
import { useAppWidth } from '@utils/dimensions';
import { layout, theme } from '@styles';

type NoticeScreenProps = NativeStackScreenProps<RootStackParamList, 'Notice'>;

// 화면 여백(16) + 본문 패널 여백(14) 를 양쪽으로 뺀 값 = 본문 HTML 이 실제로 차지하는 폭
const CONTENT_SIDE_INSET = (16 + 14) * 2;

/** 공지 구분 배지 색: "중요"는 눈에 띄게 빨강, 그 외(일반 등)는 파랑 */
const noticeTone = (notiCdNm: string) => (notiCdNm === '중요' ? 'red' : 'blue');

const NoticeScreen: React.FC<NoticeScreenProps> = () => {
  // 공지사항 리스트
  const [noticeData, setNoticeData] = useState<INoticeList[]>([]);
  // 첫 조회가 끝났는지 (끝나기 전에는 "공지 없음" 문구를 보여주지 않는다)
  const [isLoaded, setIsLoaded] = useState(false);

  // 등록된 공지사항 조회
  useEffect(() => {
    InquiryNotice()
      .then((data) => {
        if (data.resultCd === '0000') {
          console.log('공지사항 조회 결과:', data);

          // 조회 결과 공지사항이 존재하는 경우에만
          if (data.listData !== null) {
            const today = getTodayDate();

            // frDt와 toDt 사이에 포함되는 공지만 필터링
            const filteredData = data.listData.filter(
              (notice: INoticeList) => today >= notice.frDt && today <= notice.toDt,
            );

            setNoticeData(filteredData);
          }
        } else {
          console.log('공지사항 조회 실패:', data.resultMsg);
        }
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const [activeSections, setActiveSections] = useState<number[]>([]);

  // 본문 HTML 렌더링 설정 (웹에서는 앱 프레임 폭 700px 기준)
  const appWidth = useAppWidth();
  const contentWidth = appWidth - CONTENT_SIDE_INSET;
  const renderHtmlBaseStyle = useMemo(
    () => ({ fontFamily: 'Pretendard-Regular', fontSize: 14, lineHeight: 21, color: theme.colors.gray700 }),
    [],
  );
  const renderHtmlDefaultTextProps = useMemo(() => ({ lineBreakStrategyIOS: 'hangul-word' as const }), []);

  // 공지사항 헤더 (항상 보이는 부분): 1:1 상담 문의내역과 같은 두 줄 구성
  const renderHeader = (section: INoticeList, index: number, isActive: boolean) => (
    <View style={[styles.itemHeader, index > 0 && styles.itemDivider]}>
      {/* 첫 줄: 공지 구분 배지(왼쪽) / 등록일(오른쪽 끝, 화살표 위까지 차지) */}
      <View style={[layout.rowBetween, { gap: 8 }]}>
        <Badge label={section.notiCdNm} tone={noticeTone(section.notiCdNm)} />
        <Typography mode="caption1" color="gray400">
          {formatYYYYMMDDDate(section.regDt)}
        </Typography>
      </View>

      {/* 둘째 줄: 제목 / 펼침 화살표 */}
      <View style={[layout.rowBetween, { gap: 12 }]}>
        <Typography mode="subtitle2" color={isActive ? 'primary' : 'gray900'} style={{ flex: 1 }}>
          {section.title}
        </Typography>

        <Icon source={isActive ? 'chevron-up' : 'chevron-down'} size={22} color={theme.colors.gray400} />
      </View>
    </View>
  );

  // 공지사항 본문 (펼쳤을 때 보이는 부분)
  const renderContent = (section: INoticeList) => (
    <View style={styles.itemBody}>
      <View style={styles.bodyPanel}>
        <RenderHtml
          contentWidth={contentWidth}
          source={{ html: section.body }}
          baseStyle={renderHtmlBaseStyle}
          defaultTextProps={renderHtmlDefaultTextProps}
        />
      </View>
    </View>
  );

  return (
    <ScreenWrapper backgroundColor="white" topComponent={false}>
      {/* 고정 영역: 건수 (1:1 상담 문의내역·FAQ 와 같은 구성) */}
      {isLoaded && (
        <View style={styles.fixedTop}>
          <Typography mode="body2" color="gray900">
            전체{' '}
            <Typography mode="subtitle3" color="blue500">
              ({noticeData.length}
            </Typography>
            건)
          </Typography>
        </View>
      )}

      {/* 스크롤 영역: 공지 목록만 스크롤된다 */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent}>
        {!isLoaded ? (
          // 조회가 끝나기 전에는 목록 자리에 자리표시자를 보여준다 (다른 목록 화면과 같은 방식)
          <View style={styles.list}>
            <SkeletonList rows={5} />
          </View>
        ) : noticeData.length > 0 ? (
          <Accordion
            sectionContainerStyle={styles.list}
            sections={noticeData}
            activeSections={activeSections}
            renderHeader={renderHeader}
            renderContent={renderContent}
            onChange={setActiveSections}
            touchableComponent={Pressable}
            expandMultiple={false} // 하나의 공지만 열리도록
          />
        ) : (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Icon source="bullhorn-variant-outline" size={20} color={theme.colors.primary} />
            </View>
            <Typography mode="body2" color="gray500">
              등록된 공지사항이 없습니다.
            </Typography>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

// 1:1 상담 문의내역(InquiryListScreen)·FAQ 와 같은 여백·모양을 쓴다
const styles = StyleSheet.create({
  fixedTop: { paddingTop: 24, paddingHorizontal: 16, paddingBottom: 16 },
  listContent: { paddingBottom: 24 },

  // 공지 한 건
  list: { paddingHorizontal: 16 },
  itemHeader: { gap: 8, paddingVertical: 16 },
  itemDivider: { borderTopWidth: 1, borderTopColor: theme.colors.gray100 },
  itemBody: { paddingBottom: 18 },
  bodyPanel: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  // 비어 있음 / 불러오는 중
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

export default NoticeScreen;
export { NoticeScreen };

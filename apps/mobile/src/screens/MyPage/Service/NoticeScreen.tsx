import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import Accordion from 'react-native-collapsible/Accordion';
import RenderHtml from 'react-native-render-html';

import type { RootStackParamList } from '@typ/navigation';
import { INoticeList } from '@typ/commonType';
import { InquiryNotice } from '@apis/commonApi';
import { Badge, ScreenWrapper, Typography } from '@components/common';
import { formatYYYYMMDDDate, getTodayDate } from '@utils/formatter';
import { useAppWidth } from '@utils/dimensions';
import { layout, theme } from '@styles';

type NoticeScreenProps = NativeStackScreenProps<RootStackParamList, 'Notice'>;

// 화면 여백(16) + 카드 안 여백(18) + 본문 패널 여백(14) 를 양쪽으로 뺀 값 = 본문 HTML 이 실제로 차지하는 폭
const CONTENT_SIDE_INSET = (16 + 18 + 14) * 2;

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

  // 공지사항 헤더 (항상 보이는 부분)
  const renderHeader = (section: INoticeList, index: number, isActive: boolean) => (
    <View style={[styles.itemHeader, index > 0 && styles.itemDivider]}>
      <View style={styles.itemTitleBox}>
        <View style={[layout.rowCenter, { gap: 8 }]}>
          <Badge label={section.notiCdNm} tone="blue" />
          <Typography mode="caption1" color="gray500">
            {formatYYYYMMDDDate(section.regDt)}
          </Typography>
        </View>
        <Typography mode="subtitle2" color={isActive ? 'primary' : 'gray900'}>
          {section.title}
        </Typography>
      </View>

      <Icon source={isActive ? 'chevron-up' : 'chevron-down'} size={22} color={theme.colors.gray400} />
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
    <ScreenWrapper backgroundColor={theme.colors.bg} topComponent={false}>
      <ScrollView contentContainerStyle={styles.wrap}>
        {!isLoaded ? (
          <View style={styles.emptyBox}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : noticeData.length > 0 ? (
          <View style={styles.card}>
            <Accordion
              sections={noticeData}
              activeSections={activeSections}
              renderHeader={renderHeader}
              renderContent={renderContent}
              onChange={setActiveSections}
              touchableComponent={Pressable}
              expandMultiple={false} // 하나의 공지만 열리도록
            />
          </View>
        ) : (
          <View style={[styles.card, styles.emptyBox]}>
            <View style={styles.emptyIcon}>
              <Icon source="bullhorn-variant-outline" size={22} color={theme.colors.primary} />
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

const styles = StyleSheet.create({
  // 고객센터(ServiceScreen)·마이페이지와 같은 화면 여백
  wrap: { paddingHorizontal: 16, paddingVertical: 24, flexGrow: 1 },

  // 공지 목록 카드
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
  bodyPanel: {
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

export default NoticeScreen;
export { NoticeScreen };

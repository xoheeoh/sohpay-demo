import type { RootStackParamList } from '@typ/navigation';
import { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import Accordion from 'react-native-collapsible/Accordion';
import { ScreenWrapper, Typography } from '@components/common';
import { formatYYYYMMDDDate, getTodayDate } from '@utils/formatter';
import { InquiryNotice } from '@apis/commonApi';
import { INoticeList } from '@typ/commonType';
import { theme } from '@styles';
import RenderHtml from 'react-native-render-html';
import { layout } from '@styles';

type NoticeScreenProps = NativeStackScreenProps<RootStackParamList, 'Notice'>;

const NoticeScreen: React.FC<NoticeScreenProps> = () => {
  // 공지사항 리스트
  const [noticeData, setNoticeData] = useState<INoticeList[]>([]);

  // 등록된 공지사항 조회
  useEffect(() => {
    InquiryNotice().then((data) => {
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
    });
  }, []);

  const [activeSections, setActiveSections] = useState<number[]>([]);

  // 공지사항 헤더 (보이는 부분)
  const renderHeader = (section: any, _: any, isActive: boolean) => (
    <View style={[layout.rowBetween, { gap: 8 }]}>
      <View style={{ gap: 8, flexShrink: 1 }}>
        <Typography mode="subtitle2" color="gray800">
          [{section.notiCdNm}] {section.title}
        </Typography>
        <Typography mode="caption1" color="gray600">
          {formatYYYYMMDDDate(section.regDt)}
        </Typography>
      </View>

      <Icon source={isActive ? 'chevron-up' : 'chevron-down'} size={24} color={theme.colors.gray900} />
    </View>
  );

  // 공지사항 본문 (접혀있는 부분)
  const renderContent = (section: any) => (
    <View style={styles.content}>
      <Typography mode="body2" color="gray600">
        <RenderHtml contentWidth={Dimensions.get('window').width - 62} source={{ html: section.body }} />
      </Typography>
    </View>
  );

  // 클릭하면 활성화 공지 업데이트
  const updateSections = (sections: number[]) => {
    setActiveSections(sections);
  };

  return (
    <ScreenWrapper backgroundColor={theme.colors.bg} topComponent={true}>
      {noticeData.length > 0 ? (
        <ScrollView contentContainerStyle={styles.wrap}>
          <Accordion
            sectionContainerStyle={styles.notice}
            sections={noticeData}
            activeSections={activeSections}
            renderHeader={renderHeader}
            renderContent={renderContent}
            onChange={updateSections}
            underlayColor={theme.colors.gray100}
            touchableComponent={Pressable}
            expandMultiple={false} // 하나의 섹션만 열리도록 설정
          />
        </ScrollView>
      ) : (
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          <Typography mode="body2" color="gray600">
            등록된 공지사항이 없습니다.
          </Typography>
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { backgroundColor: theme.colors.gray50, height: '100%' },
  notice: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: theme.colors.gray150 },
  content: { paddingTop: 24, gap: 12 },
});

export default NoticeScreen;
export { NoticeScreen };

import { useCallback, useState } from 'react';
import { FlatList, Image, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Divider, Icon } from 'react-native-paper';

import { IRmnAmt, ListDataItem } from '@typ/paymentType';
import type { RootStackParamList } from '@typ/navigation';
import { IUserProfile } from '@typ/userType';
import { storeData } from '@storages/asyncStorage';
import { loadUserAmt, loadUsrInfoData } from '@apis/commonApi';
import { getUseList } from '@apis/paymentApi';
import { BalanceInfo, GradientButton, TransactionItem } from '@components/dashboard';
import { ScreenWrapper, Skeleton, Typography } from '@components/common';
import { layout, theme } from '@styles';

type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  // 사용자 정보 조회 ==================================================
  const [usrData, setUsrData] = useState<IUserProfile>();

  const fetchUserInfo = async () => {
    loadUsrInfoData().then((data) => {
      if (data.resultCd === '0000') {
        setUsrData(data);
        // console.log('조회된 사용자 정보:', data);

        // 사용자명 저장
        storeData('usrNm', data.usrNm);
      } else {
        console.error('사용자 정보 조회 실패: ', data.resultMsg);
      }
    });
  };
  // ================================================== 사용자 정보 조회

  // 회원 잔액 조회 ===================================================
  const [rmnAmtData, setRmnAmtData] = useState<IRmnAmt>();
  const fetchUserBalance = async () => {
    loadUserAmt().then((data) => {
      if (data.resultCd === '0000') {
        setRmnAmtData(data);
        // console.log('회원 잔액:', data);
      } else {
        console.error('회원 잔액 조회 실패: ', data.resultMsg);
      }
    });
  };
  // =================================================== 회원 잔액 조회

  // 회원 최근 이력 조회 (20건) =========================================
  const [useList, setUseList] = useState<ListDataItem[] | null>(null);
  const getUseListApi = async () => {
    try {
      const result = await getUseList();
      setUseList(result.listData);
    } catch (error) {
      console.log('error', error);
    }
  };
  // ========================================= 회원 최근 이력 조회 (20건)

  // 모든 데이터 새로고침 ===============================================
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true); // 새로고침 시작

    await Promise.all([
      fetchUserInfo(), // 사용자 정보 업데이트
      fetchUserBalance(), // 회원 잔액 업데이트
      getUseListApi(), // 회원 최근 이력 업데이트
    ]);

    setRefreshing(false); // 새로고침 완료
  };
  // =============================================== 모든 데이터 새로고침

  // 화면 focus 시 데이터 조회 =========================================
  useFocusEffect(
    useCallback(() => {
      fetchUserInfo();
      fetchUserBalance();
      getUseListApi();
    }, []),
  );
  // ========================================= 화면 focus 시 데이터 조회

  // 최근 이용내역 조회 ================================================
  const PAGE_SIZE = 5;
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // 최근 결제내역 아이템 렌더링
  const renderTransactionItem = ({ item }: { item: ListDataItem }) => {
    return <TransactionItem data={item} />;
  };
  // ================================================ 최근 이용내역 조회

  return (
    <ScreenWrapper backgroundColor={theme.colors.bg} topComponent={false}>
      <ScrollView
        contentContainerStyle={styles.wrap}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* 상단 */}
        <View style={{ gap: 12 }}>
          {/* 현재 잔액 */}
          <BalanceInfo navigation={navigation} usrData={usrData} rmnAmtData={rmnAmtData} />

          {/* 결제하기 버튼 */}
          <GradientButton label={'결제하기'} onPress={() => navigation.navigate('QRscan')} />
        </View>

        {/* 하단 - 최근 이용 내역 카드 */}
        <View style={styles.recentList}>
          <Pressable style={styles.recentHeader} onPress={() => navigation.navigate('UseList', { showAll: true })}>
            <View style={[layout.rowCenter, { gap: 10 }]}>
              <View style={styles.recentIcon}>
                <Image source={require('@images/icon/list.png')} style={styles.icon} />
              </View>
              <Typography mode="subtitle1" color="gray900">
                최근 이용 내역
              </Typography>
            </View>
            <View style={[layout.rowCenter, { gap: 2 }]}>
              <Typography mode="subtitle3" color="gray500">
                전체보기
              </Typography>
              <Icon color={theme.colors.gray400} size={18} source={'chevron-right'} />
            </View>
          </Pressable>

          {/* 리스트. 카드가 남은 높이를 다 쓰므로, 비어 있을 때 안내가 카드 세로 가운데에 오도록 내용 영역도 늘린다 */}
          <FlatList
            style={{ flex: 1 }}
            data={useList ? useList.slice(0, visibleCount) : []}
            renderItem={renderTransactionItem}
            keyExtractor={(item, index) => `${index}`}
            scrollEnabled={false}
            contentContainerStyle={{ flexGrow: 1 }}
            ListEmptyComponent={() =>
              useList === null ? (
                // 아직 조회 전: "없음" 문구 대신 행 모양 자리표시자 (마이페이지·계좌관리와 같은 방식)
                <View>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <View key={i} style={[styles.skeletonRow, i > 0 && styles.skeletonDivider]}>
                      <Skeleton width={28} height={12} />
                      <View style={{ flex: 1, gap: 6 }}>
                        <Skeleton width="55%" height={14} />
                        <Skeleton width={36} height={10} />
                      </View>
                      <Skeleton width={64} height={14} />
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}>
                    <Icon source="receipt-text-outline" size={20} color={theme.colors.primary} />
                  </View>
                  <Typography mode="body2" color="gray500">
                    최근 이용 내역이 없습니다.
                  </Typography>
                </View>
              )
            }
            ItemSeparatorComponent={() => <Divider style={styles.separator} />}
          />

          {/* 더보기: 목록 바로 아래가 아니라 카드 맨 아래에 붙인다 (목록이 짧아도 카드 하단에 고정) */}
          {useList && visibleCount < useList.length && (
            <Pressable
              style={({ pressed }) => [styles.more, pressed && { opacity: 0.6 }]}
              onPress={() => setVisibleCount((prev) => (useList ? Math.min(prev + PAGE_SIZE, useList.length) : prev))}>
              <Typography mode="subtitle3" color="gray600">
                더보기
              </Typography>
              <Icon color={theme.colors.gray500} size={18} source="chevron-down" />
            </Pressable>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  // flexGrow: 내용이 화면보다 짧을 때 남는 높이를 아래 카드가 채우도록 (길면 평소처럼 스크롤)
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'android' ? 24 : 16,
    gap: 16,
    flexGrow: 1,
  },
  icon: { width: 20, height: 20 },
  recentList: {
    flex: 1, // 화면 아래까지 늘어나 홈이 항상 꽉 찬 모습이 되게
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    boxShadow: theme.shadow.card,
    overflow: 'hidden',
  },
  recentHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: { backgroundColor: theme.colors.gray100, marginHorizontal: 16 },
  // 조회 전 자리표시자 행: 실제 행(TransactionItem)과 같은 높이·여백
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 17, paddingHorizontal: 16 },
  skeletonDivider: { borderTopWidth: 1, borderTopColor: theme.colors.gray100 },
  // 비어 있을 때: 늘어난 내용 영역의 세로 가운데에 아이콘·문구를 둔다 (다른 화면의 빈 상태와 같은 모양)
  empty: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16, // 카드 아래 여백
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.gray50,
  },
});

export default DashboardScreen;
export { DashboardScreen };

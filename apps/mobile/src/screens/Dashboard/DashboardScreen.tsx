import { useCallback, useRef, useState } from 'react';
import { FlatList, Image, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Divider, Icon } from 'react-native-paper';

import { IRmnAmt, ListDataItem } from '@typ/paymentType';
import type { RootStackParamList } from '@typ/navigation';
import { IUserProfile } from '@typ/userType';
import { removeData, removeEncryptedToken, storeData } from '@storages/asyncStorage';
import { useDialog } from '@contexts/DialogContext';
import { goToLogin } from '@utils/navigationHelpers';
import { hasSession } from '@apis/client';
import { loadUserAmt, loadUsrInfoData } from '@apis/commonApi';
import { getUseList } from '@apis/paymentApi';
import { BalanceInfo, GradientButton, TransactionItem } from '@components/dashboard';
import { ScreenWrapper, Skeleton, Typography } from '@components/common';
import { layout, theme } from '@styles';

type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  // Dialog
  const { alert } = useDialog();

  /**
   * 세션이 끊긴 경우(다른 기기에서 탈퇴·비밀번호 변경, 토큰 만료·폐기) 저장 정보를 지우고 로그인 화면으로 보낸다.
   * 조회 여러 개가 동시에 실패해도 안내는 한 번만 띄운다.
   */
  const isSessionExpiredHandled = useRef(false);
  const handleSessionExpired = async () => {
    if (isSessionExpiredHandled.current) return;
    isSessionExpiredHandled.current = true;

    await removeEncryptedToken().catch(() => {});
    await removeData('mbUid');
    await alert({
      title: '다시 로그인해 주세요',
      message1: '로그인 상태가 만료되었어요.',
      message2: '안전을 위해 로그인 화면으로 이동합니다.',
    });
    goToLogin(navigation);
  };

  // 사용자 정보 조회 ==================================================
  const [usrData, setUsrData] = useState<IUserProfile>();

  const fetchUserInfo = async () => {
    // 당겨서 새로고침(Promise.all)이 응답을 기다릴 수 있도록 Promise 를 돌려준다
    return loadUsrInfoData().then((data) => {
      if (data.resultCd === '0000') {
        setUsrData(data);
        // console.log('조회된 사용자 정보:', data);

        // 출금 계좌 등록 시 본인 명의 확인(RefundAuthScreen)에 쓴다
        storeData('usrNm', data.usrNm);
      } else if (data.resultCd === 'UNAUTHENTICATED') {
        handleSessionExpired();
      } else {
        console.error('사용자 정보 조회 실패: ', data.resultMsg);
      }
    });
  };
  // ================================================== 사용자 정보 조회

  // 회원 잔액 조회 ===================================================
  const [rmnAmtData, setRmnAmtData] = useState<IRmnAmt>();
  const fetchUserBalance = async () => {
    return loadUserAmt().then((data) => {
      if (data.resultCd === '0000') {
        setRmnAmtData(data);
        // console.log('회원 잔액:', data);
      } else if (data.resultCd === 'UNAUTHENTICATED') {
        handleSessionExpired();
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
    setRefreshing(true);

    await Promise.all([fetchUserInfo(), fetchUserBalance(), getUseListApi()]);

    setRefreshing(false);
  };
  // =============================================== 모든 데이터 새로고침

  // 화면 focus 시 데이터 조회 =========================================
  useFocusEffect(
    useCallback(() => {
      // 세션이 없으면(만료·폐기) 조회 대신 로그인으로 보낸다
      hasSession().then((loggedIn) => {
        if (!loggedIn) {
          handleSessionExpired();
          return;
        }
        fetchUserInfo();
        fetchUserBalance();
        getUseListApi();
      });
    }, []),
  );
  // ========================================= 화면 focus 시 데이터 조회

  // 최근 이용내역 조회 ================================================
  const PAGE_SIZE = 5;
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

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

          {/* 비어 있을 때 안내가 카드 세로 가운데에 오도록 내용 영역을 카드 높이만큼 늘린다 */}
          <FlatList
            style={{ flex: 1 }}
            data={useList ? useList.slice(0, visibleCount) : []}
            renderItem={renderTransactionItem}
            keyExtractor={(item, index) => `${index}`}
            scrollEnabled={false}
            contentContainerStyle={{ flexGrow: 1 }}
            ListEmptyComponent={() =>
              useList === null ? (
                // 조회 전에는 "없음" 문구 대신 행 모양 자리표시자를 보여준다
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

          {/* 더보기: 목록이 짧아도 카드 맨 아래에 고정한다 */}
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
  // 내용이 화면보다 짧을 때 남는 높이를 아래 카드가 채우도록 늘린다
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'android' ? 24 : 16,
    gap: 16,
    flexGrow: 1,
  },
  icon: { width: 20, height: 20 },
  recentList: {
    flex: 1, // 화면 아래까지 늘려 홈이 항상 꽉 차 보이게 한다
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
  // 빈 상태: 늘어난 내용 영역의 세로 가운데에 둔다
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
    marginBottom: 16,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.gray50,
  },
});

export default DashboardScreen;
export { DashboardScreen };

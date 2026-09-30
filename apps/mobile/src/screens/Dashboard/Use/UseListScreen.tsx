import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Divider, Icon } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { TransactionListItem } from '@typ/paymentType';
import { convertDateWithoutHypen, getDateMonthsAgo, getDateWithHypen, getOneWeekAgoDate } from '@utils/formatter';
import { useDialog } from '@contexts/DialogContext';
import { loadTransactionList } from '@apis/paymentApi';
import { BottomSheet, Dropdown, PrimaryButton, ScreenWrapper, SkeletonList, Typography } from '@components/common';
import {
  ChargeComponent,
  GetCdModal,
  PeriodModal,
  RefundComponent,
  TrxStCdModal,
  UseComponent,
} from '@components/uselist';
import { theme } from '@styles';

type UseListScreenProps = NativeStackScreenProps<RootStackParamList, 'UseList'>;

const UseListScreen: React.FC<UseListScreenProps> = ({ route }) => {
  /**
   * 초기 조회 조건. 기본은 1주일·결제, 대시보드 "전체보기"(showAll)로 들어오면 3개월·모두.
   * 대시보드 최근 목록은 기간 제한이 없어 같은 건들이 여기서도 보이도록 넉넉히 연다.
   */
  const showAll = route.params?.showAll ?? false;
  const initialPeriod = showAll ? '3months' : '1week';
  const initialFrDt = showAll ? getDateMonthsAgo(3) : getOneWeekAgoDate();
  const initialGetCd = showAll ? 'ALL' : 'USE';
  const initialGetCdRadio = showAll ? 'all' : 'use';

  /** 기간 조건: 바텀시트의 라디오 선택값으로 frDt·toDt 를 정한다 */
  const [frDt, setFrDt] = useState<string>(convertDateWithoutHypen(initialFrDt));
  const [toDt, setToDt] = useState<string>(convertDateWithoutHypen(getDateWithHypen(new Date())));

  const [periodModal, setPeriodModal] = useState<boolean>(false); // 기간 선택 BottomSheet

  const [selectedPeriod, setSelectedPeriod] = useState<string>(initialPeriod); // 선택된 radio value값
  const [periodPlaceholder, setPeriodPlaceholder] = useState<string>(showAll ? '3개월' : '1주일');
  const [dropdownKey1, setDropdownKey1] = useState(0); // Dropdown 리렌더링 트리거 키

  // 모달 선택값 반영
  const handlePeriodChange = (frDt: string, toDt: string, radio: string) => {
    setFrDt(convertDateWithoutHypen(frDt));
    setToDt(convertDateWithoutHypen(toDt));
    setSelectedPeriod(radio);
  };

  // 선택값에 맞춰 placeholder 갱신
  useEffect(() => {
    switch (selectedPeriod) {
      case '1week':
        setPeriodPlaceholder('1주일');
        break;
      case '1month':
        setPeriodPlaceholder('1개월');
        break;
      case '3months':
        setPeriodPlaceholder('3개월');
        break;
      case 'specific':
        setPeriodPlaceholder('직접입력');
        break;
      default:
        setPeriodPlaceholder('기간');
    }

    // Dropdown 리렌더링을 트리거
    setDropdownKey1((prevKey) => prevKey + 1);
  }, [selectedPeriod]);

  /** 거래 종류 조건: 바텀시트의 라디오 선택값으로 getCd 를 정한다 */
  const [tempGetCd, setTempGetCd] = useState<string>(initialGetCd); // 거래상태 모달에 전달하는 선택값 ALL | USE | CHRG | RFND
  const [actualGetCd, setActualGetCd] = useState<string>(initialGetCd); // 실제 조회에 사용할 getCd
  const [getCd, setGetCd] = useState<string>(initialGetCd); // 조회 버튼을 누른 시점의 getCd: ALL 모두 | USE 결제 | CHRG 충전 | RFND 출금
  const [getCdModal, setGetCdModal] = useState<boolean>(false); // 거래종류 선택 BottomSheet

  const [selectedGetCd, setSelectedGetCd] = useState<string>(initialGetCdRadio); // 선택된 radio value값
  const [getCdPlaceholder, setGetCdPlaceholder] = useState<string>(showAll ? '모두' : '결제');
  const [dropdownKey2, setDropdownKey2] = useState(0); // Dropdown 리렌더링 트리거 키

  // 모달 선택값 반영
  const handleGetCdChange = (selectedGetCd: string, radio: string) => {
    setTempGetCd(selectedGetCd); // 모달에 전달할 값
    setSelectedGetCd(radio);

    // 거래 종류가 바뀌면 거래 상태는 "모두"로 되돌린다
    setActualGetCd(selectedGetCd);
    setTrxStCd('9');
    setSelectedTrxStCd('all');
    setTrxStCdPlaceholder('모두');
  };

  // 선택값에 맞춰 placeholder 갱신
  useEffect(() => {
    switch (selectedGetCd) {
      case 'all':
        setGetCdPlaceholder('모두');
        break;
      case 'use':
        setGetCdPlaceholder('결제');
        break;
      case 'charge':
        setGetCdPlaceholder('충전');
        break;
      case 'refund':
        setGetCdPlaceholder('출금');
        break;
      default:
        setGetCdPlaceholder('거래종류');
    }

    // Dropdown 리렌더링을 트리거
    setDropdownKey2((prevKey) => prevKey + 1);
  }, [selectedGetCd]);

  /** 거래 상태 조건: 바텀시트의 라디오 선택값으로 trxStCd 를 정한다 */
  const [trxStCd, setTrxStCd] = useState<string>('9'); // 결제 - 0 승인 | 1 취소, 충전·출금 - 1 성공 | 2 실패, 9 모두
  const [trxStCdModal, setTrxStCdModal] = useState<boolean>(false); // 거래상태 선택 BottomSheet

  const [selectedTrxStCd, setSelectedTrxStCd] = useState<string>('all'); // 선택된 radio value값
  const [trxStCdPlaceholder, setTrxStCdPlaceholder] = useState<string>('모두');
  const [dropdownKey3, setDropdownKey3] = useState(0); // Dropdown 리렌더링 트리거 키

  // 모달 선택값 반영
  const handleTrxStCdChange = (getCd: string, trxStCd: string, radio: string) => {
    setActualGetCd(getCd);
    setTrxStCd(trxStCd);
    setSelectedTrxStCd(radio);
  };

  // 선택값에 맞춰 placeholder 갱신
  useEffect(() => {
    switch (selectedTrxStCd) {
      case 'confirm':
        setTrxStCdPlaceholder('승인');
        break;
      case 'cancel':
        setTrxStCdPlaceholder('취소');
        break;
      case 'success':
        setTrxStCdPlaceholder('성공');
        break;
      case 'fail':
        setTrxStCdPlaceholder('실패');
        break;
      case 'all':
        setTrxStCdPlaceholder('모두');
        break;
      default:
        setTrxStCdPlaceholder('거래상태');
    }

    // Dropdown 리렌더링을 트리거
    setDropdownKey3((prevKey) => prevKey + 1);
  }, [selectedTrxStCd]);

  /** 조회 및 무한 스크롤. 조회 버튼으로 첫 페이지를 받고, 목록 끝에 닿으면 다음 페이지를 이어 붙인다 */
  const [listData, setListData] = useState<TransactionListItem[]>([]); // 사용 내역 (모두 조회 시 종류가 섞여 있음)

  // setTimeout 으로 예약된 호출은 최신 state 를 못 보므로 진행 여부와 시작 번호는 ref 로 든다
  const isFetchingRef = useRef(false);
  const startIdxRef = useRef(0);
  const [maxCount] = useState(10); // 한 번에 가져올 최대 항목 수
  const [isLoading, setIsLoading] = useState<boolean>(false); // 로딩 상태
  const [isLoaded, setIsLoaded] = useState<boolean>(false); // 첫 조회가 한 번이라도 끝났는지 (끝나기 전엔 자리표시자)
  const [hasMore, setHasMore] = useState<boolean>(false); // 더 가져올 데이터 존재 여부

  const [triggerFetch, setTriggerFetch] = useState(false); // 데이터 fetch 트리거 상태

  // 조회 시작
  const handleLoadList = async () => {
    if (!actualGetCd || !trxStCd || !frDt || !toDt) {
      alert({
        title: '안내',
        message1: '조회 조건이 선택되지 않았습니다.',
      });
      return;
    }

    // 선택된 값을 실제 조회 상태에 반영
    setGetCd(actualGetCd);

    // 데이터 초기화 및 조회 트리거
    setListData([]);
    startIdxRef.current = 0;
    setHasMore(true);
    setTriggerFetch(true);
  };

  // 상태 업데이트 후 API 호출
  useEffect(() => {
    if (triggerFetch) {
      fetchData(true);
      setTriggerFetch(false);
    }
  }, [triggerFetch]);

  const fetchData = async (reset: boolean = false) => {
    if (isFetchingRef.current || !hasMore) return;

    isFetchingRef.current = true;
    setIsLoading(true);
    try {
      const currentStartIdx = reset ? 0 : startIdxRef.current;
      const data = await loadTransactionList(getCd, trxStCd, frDt, toDt, currentStartIdx, maxCount);

      if (data?.resultCd === '0000') {
        const newData = Array.isArray(data.listData) ? data.listData : [];

        console.log('조회 결과 리스트:', newData);

        setListData((prevData) => (reset ? newData : [...prevData, ...newData]));

        if (newData.length < maxCount) {
          setHasMore(false);
        } else {
          startIdxRef.current = currentStartIdx + maxCount;
        }
      } else {
        console.log('데이터 조회 실패:', data?.resultMsg || '알 수 없는 오류');
        setHasMore(false);
      }
    } catch (error) {
      console.log('API 호출 오류:', error);
      setHasMore(false);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setIsLoaded(true);
    }
  };

  // FlatList 무한 스크롤
  const loadMore = async () => {
    if (isFetchingRef.current || !hasMore) return;

    setTimeout(() => {
      fetchData();
    }, 300); // 디바운스: 300ms 후 실행
  };

  // 진입 시 초기 조건으로 바로 조회한다
  useEffect(() => {
    handleLoadList();
  }, []);

  // Dialog
  const { alert } = useDialog();

  return (
    <ScreenWrapper backgroundColor={theme.colors.bg}>
      {/* 조회 조건 카드 */}
      <View style={styles.filterCard}>
        <View style={styles.selectBox}>
          {/* 기간 선택 */}
          <View style={{ flex: 1 }}>
            <Dropdown
              key={`period-${dropdownKey1}`}
              size="md"
              onOpen="modal"
              placeholder={periodPlaceholder}
              options={[]}
              openEvent={() => setPeriodModal(true)}
            />
          </View>

          {/* 거래 종류 선택 */}
          <View style={{ flex: 1 }}>
            <Dropdown
              key={`getCd-${dropdownKey2}`}
              size="md"
              onOpen="modal"
              placeholder={getCdPlaceholder}
              options={[]}
              openEvent={() => setGetCdModal(true)}
            />
          </View>

          {/* 거래 상태 선택 */}
          <View style={{ flex: 1 }}>
            <Dropdown
              key={`trxStCd-${dropdownKey3}`}
              size="md"
              onOpen="modal"
              placeholder={trxStCdPlaceholder}
              options={[]}
              openEvent={() => setTrxStCdModal(true)}
            />
          </View>
        </View>

        <PrimaryButton label={'조회'} onPress={handleLoadList} size={'lg'} />
      </View>

      {/* 조회 결과 카드: 남은 높이를 다 쓰고 목록만 안에서 스크롤된다 */}
      <View style={styles.listCard}>
        {!isLoaded ? (
          // 첫 조회가 끝나기 전에는 "없음" 문구 대신 자리표시자를 보여준다
          <View style={styles.listInner}>
            <SkeletonList rows={5} />
          </View>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            contentContainerStyle={[styles.listInner, { flexGrow: 1 }]}
            data={listData}
            keyExtractor={(item, index) => `${item.getCd}-${'tid' in item ? item.tid : item.rfndNo}-${index}`}
            renderItem={({ item }) => {
              // "모두" 조회는 종류가 섞여 있으므로 각 건의 getCd 로 행 모양을 정한다
              if (item.getCd === 'USE') {
                return <UseComponent getCd={item.getCd} item={item} />;
              } else if (item.getCd === 'CHRG') {
                return <ChargeComponent item={item} getCd={item.getCd} />;
              } else {
                return <RefundComponent item={item} getCd={item.getCd} />;
              }
            }}
            ItemSeparatorComponent={() => <Divider style={{ backgroundColor: theme.colors.gray100 }} />}
            ListFooterComponent={() =>
              isLoading && listData.length > 0 ? (
                <ActivityIndicator size={'small'} color={theme.colors.primary} style={{ paddingVertical: 16 }} />
              ) : null
            }
            ListEmptyComponent={() =>
              isLoading ? (
                <SkeletonList rows={5} />
              ) : (
                // 빈 상태
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}>
                    <Icon source="receipt-text-outline" size={20} color={theme.colors.primary} />
                  </View>
                  <Typography mode="body2" color="gray500">
                    조회 조건에 맞는 이용 내역이 없어요.
                  </Typography>
                </View>
              )
            }
            onEndReached={() => {
              // 빈 목록에서도 onEndReached 가 불리고, 예약된 fetch 가 stale closure 로 첫 페이지를 다시 붙일 수 있어 초기 조회 중에는 막는다
              if (listData.length === 0) return;
              loadMore();
            }}
            onEndReachedThreshold={0.1}
          />
        )}
      </View>

      {/* 기간 선택 모달 */}
      <BottomSheet
        visible={periodModal}
        setVisible={setPeriodModal}
        title={'조회하실 기간을 선택해 주세요'}
        content={
          <PeriodModal
            radioValue={selectedPeriod}
            frDt={frDt}
            toDt={toDt}
            handleSelectPeriod={() => setPeriodModal(false)}
            onPeriodChange={handlePeriodChange}
          />
        }
      />

      {/* 거래종류 선택 모달 */}
      <BottomSheet
        visible={getCdModal}
        setVisible={setGetCdModal}
        title={'조회하실 거래 종류를 선택해 주세요'}
        content={
          <GetCdModal
            radioValue={selectedGetCd}
            handleSelectedGetCd={() => setGetCdModal(false)}
            onGetCdChange={handleGetCdChange}
          />
        }
      />

      {/* 거래상태 선택 모달 */}
      <BottomSheet
        visible={trxStCdModal}
        setVisible={setTrxStCdModal}
        title={'조회하실 거래 상태를 선택해 주세요'}
        content={
          <TrxStCdModal
            radioValue={selectedTrxStCd}
            getCd={tempGetCd}
            handleSelectedTrxStCd={() => setTrxStCdModal(false)}
            onTrxStCdChange={handleTrxStCdChange}
          />
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  filterCard: {
    marginHorizontal: 16,
    marginTop: theme.screen.topCard,
    padding: 16,
    gap: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
  },
  selectBox: { flexDirection: 'row', gap: 16, alignItems: 'center', justifyContent: 'flex-start' },
  listCard: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
    overflow: 'hidden',
  },
  listInner: { paddingHorizontal: 16 },
  // 빈 상태: 늘어난 내용 영역의 세로 가운데에 둔다
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 40 },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default UseListScreen;
export { UseListScreen };
